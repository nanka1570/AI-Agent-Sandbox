"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Trash2, Receipt, Repeat, Search, GripVertical } from "lucide-react";
import { format, subMonths } from "date-fns";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Payment, CreditCard, Category } from "@/generated/prisma/client";
import { paymentSchema, type PaymentInput, type PaymentStatus } from "@/types";
import {
  createPayment,
  updatePayment,
  deletePayment,
  deleteRecurringPayments,
  updatePaymentOrder,
} from "@/lib/actions/payment";
import { formatCurrency, formatCurrencyJP, formatMonth } from "@/lib/utils";
import { AmountPresets } from "@/components/amount-presets";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { ExportButton } from "@/components/payments/export-button";
import { BulkAllocationDialog } from "@/components/payments/bulk-allocation-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type PaymentWithCard = Payment & { creditCard: CreditCard; category: Category | null };

type Props = {
  payments: PaymentWithCard[];
  creditCards: CreditCard[];
  categories: Category[];
  currentMonth: string;
};

// 直近12ヶ月分の選択肢を生成
function generateMonthOptions(): { value: string; label: string }[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(now, i);
    const value = format(date, "yyyy-MM");
    return { value, label: formatMonth(value) };
  });
}

// ドラッグ可能なテーブル行
function SortablePaymentRow({
  payment,
  onEdit,
  onDelete,
}: {
  payment: PaymentWithCard;
  onEdit: (payment: PaymentWithCard) => void;
  onDelete: (payment: PaymentWithCard) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: payment.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className="border-b-2 border-border hover:bg-secondary/20"
    >
      {/* ドラッグハンドル */}
      <TableCell className="w-8 py-2 pl-2 pr-0">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
          aria-label="ドラッグして並べ替え"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      <TableCell className="font-bold">{payment.creditCard.name}</TableCell>
      <TableCell>
        {payment.category ? (
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-full border border-border"
              style={{ backgroundColor: payment.category.color }}
            />
            <span className="text-sm">{payment.category.name}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          {formatMonth(payment.month)}
          {payment.isRecurring && (
            <Repeat className="h-3.5 w-3.5 text-primary" aria-label="繰り返し" />
          )}
        </div>
      </TableCell>
      <TableCell className="font-bold font-mono">{formatCurrency(payment.amount)}</TableCell>
      <TableCell>
        <StatusBadge paymentId={payment.id} status={payment.status as PaymentStatus} />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(payment)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="h-8 w-8"
            onClick={() => onDelete(payment)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function PaymentList({ payments, creditCards, categories, currentMonth }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(payments);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PaymentWithCard | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PaymentWithCard | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // 繰り返し削除モード: "single" = この支払いだけ, "group" = グループ全体
  const [deleteMode, setDeleteMode] = useState<"single" | "group">("single");
  // 合計から振り分けダイアログ
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  // サーバー再レンダリング後に props と state を同期
  useEffect(() => { setItems(payments); }, [payments]);

  // 連続入力用：前回使用したカード・カテゴリを保持
  const [lastCardId, setLastCardId] = useState("");
  const [lastCategoryId, setLastCategoryId] = useState(
    () => categories.find((c) => c.name === "雑費")?.id ?? ""
  );

  // フィルター状態
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterKeyword, setFilterKeyword] = useState<string>("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
  );

  const monthOptions = generateMonthOptions();

  const form = useForm<PaymentInput>({
    // z.preprocess により入力型が unknown になるため型アサーションが必要
    resolver: zodResolver(paymentSchema) as ReturnType<typeof zodResolver<PaymentInput, unknown, PaymentInput>>,
    defaultValues: {
      creditCardId: "",
      categoryId: "",
      month: currentMonth,
      amount: undefined,
      memo: "",
      isRecurring: false,
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  // クライアントサイドフィルタリング（items ステートを参照）
  const filteredPayments = useMemo(() => {
    return items.filter((payment) => {
      // カテゴリフィルター
      if (filterCategory !== "all") {
        if (!payment.categoryId || payment.categoryId !== filterCategory) {
          return false;
        }
      }
      // キーワード検索（メモの部分一致）
      if (filterKeyword.trim() !== "") {
        const keyword = filterKeyword.trim().toLowerCase();
        const memo = (payment.memo ?? "").toLowerCase();
        if (!memo.includes(keyword)) {
          return false;
        }
      }
      return true;
    });
  }, [items, filterCategory, filterKeyword]);

  // 月フィルター変更時にURLを更新（Server Componentを再レンダリング）
  function handleMonthChange(month: string) {
    router.push(`/payments?month=${month}`);
  }

  function handleOpenCreate() {
    setEditTarget(null);
    form.reset({
      creditCardId: lastCardId,
      categoryId: lastCategoryId,
      month: currentMonth,
      amount: undefined,
      memo: "",
      isRecurring: false,
    });
    setIsFormOpen(true);
  }

  function handleOpenEdit(payment: PaymentWithCard) {
    setEditTarget(payment);
    form.reset({
      creditCardId: payment.creditCardId,
      categoryId: payment.categoryId ?? "",
      month: payment.month,
      amount: payment.amount,
      memo: payment.memo ?? "",
      isRecurring: payment.isRecurring,
    });
    setIsFormOpen(true);
  }

  async function onSubmit(values: PaymentInput) {
    if (editTarget) {
      const result = await updatePayment(editTarget.id, values);
      if (result.success) {
        toast("更新しました");
        setIsFormOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } else {
      const result = await createPayment(values);
      if (result.success) {
        toast("登録しました");
        setLastCardId(values.creditCardId);
        setLastCategoryId(values.categoryId ?? "");
        setIsFormOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    }
  }

  // 削除ダイアログを開く
  function handleOpenDelete(payment: PaymentWithCard) {
    setDeleteTarget(payment);
    setDeleteMode("single");
  }

  // 単件削除
  async function handleDeleteSingle() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deletePayment(deleteTarget.id);
    setIsDeleting(false);
    if (result.success) {
      toast("削除しました");
      setDeleteTarget(null);
      setItems((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    } else {
      toast.error(result.error);
    }
  }

  // 繰り返しグループ一括削除
  async function handleDeleteGroup() {
    if (!deleteTarget?.recurringGroupId) return;
    setIsDeleting(true);
    const result = await deleteRecurringPayments(deleteTarget.recurringGroupId);
    setIsDeleting(false);
    if (result.success) {
      toast("繰り返しグループを削除しました");
      const groupId = deleteTarget.recurringGroupId;
      setDeleteTarget(null);
      setItems((prev) => prev.filter((p) => p.recurringGroupId !== groupId));
    } else {
      toast.error(result.error);
    }
  }

  async function handleDelete() {
    if (deleteMode === "group") {
      await handleDeleteGroup();
    } else {
      await handleDeleteSingle();
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filteredPayments.findIndex((p) => p.id === active.id);
    const newIndex = filteredPayments.findIndex((p) => p.id === over.id);
    const newFiltered = arrayMove(filteredPayments, oldIndex, newIndex);

    // items ステート全体を更新（フィルター対象アイテムの位置のみ差し替え）
    const filteredIdSet = new Set(filteredPayments.map((p) => p.id));
    const filteredPositions = items
      .map((item, idx) => ({ idx, isFiltered: filteredIdSet.has(item.id) }))
      .filter(({ isFiltered }) => isFiltered)
      .map(({ idx }) => idx);

    const newItems = [...items];
    filteredPositions.forEach((pos, i) => {
      newItems[pos] = newFiltered[i];
    });
    setItems(newItems); // 楽観的更新

    await updatePaymentOrder(newFiltered.map((p) => p.id));
  }

  return (
    <>
      {/* ヘッダー: タイトル + 月フィルター + 新規登録 */}
      <div className="flex items-center justify-between border-b-4 border-border pb-4">
        <h1 className="text-2xl font-black">支払い管理</h1>
        <div className="flex items-center gap-3">
          <Select value={currentMonth} onValueChange={(v) => handleMonthChange(v)}>
            <SelectTrigger className="w-[160px] border-2 border-border bg-white font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {monthOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ExportButton month={currentMonth} />
          <Button variant="outline" onClick={() => setIsBulkOpen(true)}>合計から振り分け</Button>
          <Button onClick={() => handleOpenCreate()}>+ 新規登録</Button>
        </div>
      </div>

      {/* フィルターバー */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {/* カテゴリフィルター */}
        <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v)}>
          <SelectTrigger className="w-[160px] border-2 border-border bg-white text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <SelectValue placeholder="カテゴリ" />
          </SelectTrigger>
          <SelectContent className="border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <SelectItem value="all">すべてのカテゴリ</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full border border-border"
                    style={{ backgroundColor: cat.color }}
                  />
                  {cat.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* キーワード検索 */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="メモで検索"
            value={filterKeyword}
            onChange={(e) => setFilterKeyword(e.target.value)}
            className="w-[200px] border-2 border-border bg-white pl-8 text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          />
        </div>

        {/* フィルター件数表示 */}
        {(filterCategory !== "all" || filterKeyword.trim() !== "") && (
          <span className="text-sm text-muted-foreground">
            {filteredPayments.length} / {items.length} 件
          </span>
        )}
      </div>

      {/* テーブル */}
      <div className="mt-4">
        {filteredPayments.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={
              items.length === 0
                ? "この月の支払いデータがありません"
                : "条件に一致する支払いがありません"
            }
            description={
              items.length === 0
                ? "新規登録ボタンから追加してください。"
                : "フィルター条件を変更してください。"
            }
          />
        ) : (
          <div className="overflow-x-auto border-2 border-border bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredPayments.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-2 border-border bg-muted">
                      <TableHead className="w-8" />
                      <TableHead className="font-black">カード</TableHead>
                      <TableHead className="font-black">カテゴリ</TableHead>
                      <TableHead className="font-black">対象月</TableHead>
                      <TableHead className="font-black">金額</TableHead>
                      <TableHead className="font-black">ステータス</TableHead>
                      <TableHead className="font-black text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <SortablePaymentRow
                        key={payment.id}
                        payment={payment}
                        onEdit={handleOpenEdit}
                        onDelete={handleOpenDelete}
                      />
                    ))}
                  </TableBody>
                </Table>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>

      {/* 登録/編集ダイアログ */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!isSubmitting) setIsFormOpen(open); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? "支払い編集" : "支払い登録"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="creditCardId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>クレジットカード *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="border-2 border-border bg-white">
                          <SelectValue placeholder="カードを選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        {creditCards.map((card) => (
                          <SelectItem key={card.id} value={card.id}>{card.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>カテゴリ</FormLabel>
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="border-2 border-border bg-white">
                          <SelectValue placeholder="カテゴリを選択（任意）" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-block h-3 w-3 rounded-full border border-border"
                                style={{ backgroundColor: cat.color }}
                              />
                              {cat.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      カテゴリの追加・編集は「カテゴリ / 予算」タブから行えます
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>対象月 *</FormLabel>
                    <FormControl><Input type="month" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>金額（円） *</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="50000"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={String(field.value ?? "")}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/[^0-9]/g, "");
                          field.onChange(digits as unknown as number);
                        }}
                      />
                    </FormControl>
                    <AmountPresets
                      storageKey="kakeibo-presets-payment"
                      defaults={[5000, 10000, 30000, 50000, 100000]}
                      onSelect={(v) => field.onChange(v)}
                    />
                    {field.value ? (
                      <FormDescription className="font-bold text-foreground">
                        = {formatCurrencyJP(field.value)}
                      </FormDescription>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="memo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>メモ</FormLabel>
                    <FormControl><Textarea placeholder="メモ（任意）" rows={3} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* 毎月繰り返しチェックボックス（新規登録時のみ表示） */}
              {!editTarget && (
                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        毎月繰り返し（翌月から3ヶ月分を自動登録）
                      </FormLabel>
                    </FormItem>
                  )}
                />
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => setIsFormOpen(false)}>キャンセル</Button>
                <Button type="submit" disabled={isSubmitting}>{editTarget ? "更新する" : "登録する"}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 合計から振り分けダイアログ */}
      <BulkAllocationDialog
        open={isBulkOpen}
        onOpenChange={setIsBulkOpen}
        creditCards={creditCards}
        categories={categories}
        currentMonth={currentMonth}
      />

      {/* 削除確認ダイアログ */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>この支払いデータを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>この操作は取り消せません。</AlertDialogDescription>
          </AlertDialogHeader>

          {/* 繰り返しグループの場合、削除モード選択を表示 */}
          {deleteTarget?.isRecurring && deleteTarget.recurringGroupId && (
            <div className="space-y-2 py-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="deleteMode"
                  value="single"
                  checked={deleteMode === "single"}
                  onChange={() => setDeleteMode("single")}
                  className="accent-primary"
                />
                <span className="text-sm">この支払いだけ削除</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="deleteMode"
                  value="group"
                  checked={deleteMode === "group"}
                  onChange={() => setDeleteMode("group")}
                  className="accent-primary"
                />
                <span className="text-sm">繰り返しグループ全て削除</span>
              </label>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>キャンセル</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={isDeleting} onClick={() => handleDelete()}>削除する</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

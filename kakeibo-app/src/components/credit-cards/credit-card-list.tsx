"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Trash2, CreditCard, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CreditCard as CreditCardType } from "@/generated/prisma/client";
import { creditCardSchema, type CreditCardInput } from "@/types";
import {
  createCreditCard,
  updateCreditCard,
  deleteCreditCard,
  updateCreditCardOrder,
} from "@/lib/actions/credit-card";
import { formatDay, formatPaymentDay } from "@/lib/utils";

// カードブランド定義
const BRANDS = [
  { id: "visa",       label: "Visa",       bg: "bg-blue-600",   text: "text-white" },
  { id: "mastercard", label: "MC",          bg: "bg-red-600",    text: "text-white" },
  { id: "jcb",        label: "JCB",         bg: "bg-green-600",  text: "text-white" },
  { id: "amex",       label: "Amex",        bg: "bg-sky-700",    text: "text-white" },
  { id: "other",      label: "他",           bg: "bg-gray-400",   text: "text-white" },
] as const;

// ブランドバッジ（カード一覧に表示）
function BrandBadge({ brand }: { brand: string | null }) {
  const found = BRANDS.find((b) => b.id === brand);
  if (!found) return null;
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-black ${found.bg} ${found.text}`}>
      {found.label}
    </span>
  );
}

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  cards: CreditCardType[];
};

// ドラッグ可能なカードアイテム
function SortableCardItem({
  card,
  onEdit,
  onDelete,
}: {
  card: CreditCardType;
  onEdit: (card: CreditCardType) => void;
  onDelete: (card: CreditCardType) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            {/* ドラッグハンドル */}
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="mt-0.5 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
              aria-label="ドラッグして並べ替え"
            >
              <GripVertical className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <BrandBadge brand={card.brand ?? null} />
                <p className="truncate font-black text-lg">{card.name}</p>
              </div>
              <p className="mt-1 text-sm font-bold">
                締め日: {formatDay(card.closingDay)}
                {card.confirmationDay != null && (
                  <> / 確定日: {formatPaymentDay(card.confirmationDay, card.confirmationMonthOffset ?? 0)}</>
                )}
                {" "}/ 支払い日:{" "}
                {formatPaymentDay(card.paymentDay, card.paymentMonthOffset)}
              </p>
              {card.memo && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {card.memo}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(card)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8"
                onClick={() => onDelete(card)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function CreditCardList({ cards }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(cards);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CreditCardType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CreditCardType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // サーバー再レンダリング後に props と state を同期
  useEffect(() => { setItems(cards); }, [cards]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
  );

  const form = useForm<CreditCardInput>({
    // z.preprocess により入力型が unknown になるため型アサーションが必要
    resolver: zodResolver(creditCardSchema) as ReturnType<typeof zodResolver<CreditCardInput, unknown, CreditCardInput>>,
    defaultValues: {
      name: "",
      closingDay: undefined,
      paymentDay: undefined,
      paymentMonthOffset: 0,
      confirmationDay: undefined,
      confirmationMonthOffset: 0,
      brand: "",
      memo: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  function handleOpenCreate() {
    setEditTarget(null);
    form.reset({ name: "", closingDay: undefined, paymentDay: undefined, paymentMonthOffset: 0, confirmationDay: undefined, confirmationMonthOffset: 0, brand: "", memo: "" });
    setIsFormOpen(true);
  }

  function handleOpenEdit(card: CreditCardType) {
    setEditTarget(card);
    form.reset({
      name: card.name,
      closingDay: card.closingDay,
      paymentDay: card.paymentDay,
      paymentMonthOffset: card.paymentMonthOffset,
      confirmationDay: card.confirmationDay ?? undefined,
      confirmationMonthOffset: card.confirmationMonthOffset ?? 0,
      brand: card.brand ?? "",
      memo: card.memo ?? "",
    });
    setIsFormOpen(true);
  }

  async function onSubmit(values: CreditCardInput) {
    if (editTarget) {
      const result = await updateCreditCard(editTarget.id, values);
      if (result.success) {
        toast("更新しました");
        setIsFormOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } else {
      const result = await createCreditCard(values);
      if (result.success) {
        toast("登録しました");
        setIsFormOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deleteCreditCard(deleteTarget.id);
    setIsDeleting(false);
    if (result.success) {
      toast("削除しました");
      setDeleteTarget(null);
      setItems((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    } else {
      toast.error(result.error);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((c) => c.id === active.id);
    const newIndex = items.findIndex((c) => c.id === over.id);
    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems); // 楽観的更新
    await updateCreditCardOrder(newItems.map((c) => c.id));
  }

  return (
    <>
      <div className="flex items-center justify-between border-b-4 border-border pb-4">
        <h1 className="text-2xl font-black">クレジットカード管理</h1>
        <Button onClick={() => handleOpenCreate()}>+ 新規登録</Button>
      </div>

      <div className="mt-6">
        {items.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="クレジットカードが登録されていません"
            description="新規登録ボタンから追加してください。"
          />
        ) : (
          <DndContext
            id="credit-card-dnd"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((c) => c.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((card) => (
                  <SortableCardItem
                    key={card.id}
                    card={card}
                    onEdit={handleOpenEdit}
                    onDelete={(card) => setDeleteTarget(card)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!isSubmitting) setIsFormOpen(open); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? "クレジットカード編集" : "クレジットカード登録"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>カード名 *</FormLabel>
                    <FormControl><Input placeholder="楽天カード" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* ブランド選択 */}
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ブランド</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {BRANDS.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => field.onChange(field.value === b.id ? "" : b.id)}
                          className={`cursor-pointer rounded border-2 px-3 py-1 text-sm font-black transition-all ${
                            field.value === b.id
                              ? `${b.bg} ${b.text} border-transparent shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`
                              : "border-border bg-white hover:bg-secondary"
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="closingDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>締め日 *</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="1〜31"
                          disabled={field.value === 32}
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          value={field.value === 32 ? "" : String(field.value ?? "")}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/[^0-9]/g, "");
                            field.onChange(digits as unknown as number);
                          }}
                          className={field.value === 32 ? "bg-muted" : ""}
                        />
                        <button
                          type="button"
                          onClick={() => field.onChange(field.value === 32 ? (undefined as unknown as number) : 32)}
                          className={`rounded border-2 px-2 py-1 text-sm font-bold transition-colors ${
                            field.value === 32
                              ? "border-black bg-black text-white"
                              : "border-border bg-white hover:bg-secondary"
                          }`}
                        >
                          末日
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* 支払い確定日 */}
              <FormField
                control={form.control}
                name="confirmationDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>支払い確定日</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="1〜31（任意）"
                          disabled={field.value === 32}
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          value={field.value === 32 ? "" : String(field.value ?? "")}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/[^0-9]/g, "");
                            field.onChange(digits === "" ? (undefined as unknown as number) : (digits as unknown as number));
                          }}
                          className={field.value === 32 ? "bg-muted" : ""}
                        />
                        <button
                          type="button"
                          onClick={() => field.onChange(field.value === 32 ? (undefined as unknown as number) : 32)}
                          className={`rounded border-2 px-2 py-1 text-sm font-bold transition-colors ${
                            field.value === 32
                              ? "border-black bg-black text-white"
                              : "border-border bg-white hover:bg-secondary"
                          }`}
                        >
                          末日
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* 確定月 */}
              <FormField
                control={form.control}
                name="confirmationMonthOffset"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>確定月</FormLabel>
                    <Select
                      value={String(field.value ?? 0)}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <FormControl>
                        <SelectTrigger className="border-2 border-border bg-white">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <SelectItem value="0">当月</SelectItem>
                        <SelectItem value="1">翌月</SelectItem>
                        <SelectItem value="2">翌々月</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>支払い日 *</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="1〜31"
                          disabled={field.value === 32}
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          value={field.value === 32 ? "" : String(field.value ?? "")}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/[^0-9]/g, "");
                            field.onChange(digits as unknown as number);
                          }}
                          className={field.value === 32 ? "bg-muted" : ""}
                        />
                        <button
                          type="button"
                          onClick={() => field.onChange(field.value === 32 ? (undefined as unknown as number) : 32)}
                          className={`rounded border-2 px-2 py-1 text-sm font-bold transition-colors ${
                            field.value === 32
                              ? "border-black bg-black text-white"
                              : "border-border bg-white hover:bg-secondary"
                          }`}
                        >
                          末日
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentMonthOffset"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>支払月 *</FormLabel>
                    <Select
                      value={String(field.value)}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <FormControl>
                        <SelectTrigger className="border-2 border-border bg-white">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <SelectItem value="0">当月</SelectItem>
                        <SelectItem value="1">翌月</SelectItem>
                        <SelectItem value="2">翌々月</SelectItem>
                      </SelectContent>
                    </Select>
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
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => setIsFormOpen(false)}>キャンセル</Button>
                <Button type="submit" disabled={isSubmitting}>{editTarget ? "更新する" : "登録する"}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>このクレジットカードを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>このカードに紐づく支払いデータも全て削除されます。この操作は取り消せません。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>キャンセル</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={isDeleting} onClick={() => handleDelete()}>削除する</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

"use client";

import { useState, useMemo } from "react";
import { Plus, ListPlus, Pencil, Trash2, Repeat } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { PaymentStatusBadge } from "@/components/payments/payment-status-badge";
import { PaymentForm } from "@/components/payments/payment-form";
import { BulkRegisterDialog } from "@/components/payments/bulk-register-dialog";
import { CsvExportButton } from "@/components/payments/csv-export-button";
import {
  togglePaymentStatus,
  deletePayment,
  deleteRecurringGroup,
  bulkUpdatePaymentStatus,
} from "@/lib/actions/payment-actions";
import { formatCurrency, formatMonth } from "@/lib/utils/format";
import type { PaymentStatus } from "@/lib/constants";
import { PAYMENT_STATUSES } from "@/lib/constants";

interface PaymentItem {
  id: string;
  creditCardId: string;
  month: string;
  amount: number;
  status: PaymentStatus;
  memo: string | null;
  categoryId: string | null;
  isRecurring: boolean;
  recurringGroupId: string | null;
  creditCard: { name: string };
  category: { name: string; color: string } | null;
}

interface PaymentListProps {
  payments: PaymentItem[];
  creditCards: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string; color: string }>;
}

/**
 * 支払い一覧コンポーネント
 * カテゴリフィルター、キーワード検索、ステータスToggle、一括操作を提供
 */
export function PaymentList({
  payments,
  creditCards,
  categories,
}: PaymentListProps) {
  // フィルター
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [keyword, setKeyword] = useState("");

  // フォームダイアログ
  const [formOpen, setFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentItem | undefined>();

  // 一括登録ダイアログ
  const [bulkOpen, setBulkOpen] = useState(false);

  // 削除確認ダイアログ
  const [deleteTarget, setDeleteTarget] = useState<PaymentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 繰り返し一括削除確認ダイアログ
  const [recurringDeleteTarget, setRecurringDeleteTarget] = useState<string | null>(null);
  const [isDeletingRecurring, setIsDeletingRecurring] = useState(false);

  // ステータストグル中のID（多重クリック防止）
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // 一括ステータス変更ダイアログ
  const [bulkStatusTarget, setBulkStatusTarget] = useState<{
    creditCardId: string;
    month: string;
    cardName: string;
  } | null>(null);
  const [bulkNewStatus, setBulkNewStatus] = useState<PaymentStatus>("confirmed");
  const [isUpdatingBulk, setIsUpdatingBulk] = useState(false);

  /** フィルター適用後の支払い一覧 */
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // カテゴリフィルター
      if (categoryFilter !== "all") {
        if (categoryFilter === "none" && p.categoryId !== null) return false;
        if (categoryFilter !== "none" && p.categoryId !== categoryFilter)
          return false;
      }

      // キーワード検索（メモフィールド）
      if (keyword) {
        const lowerKeyword = keyword.toLowerCase();
        const matchesMemo = p.memo?.toLowerCase().includes(lowerKeyword);
        if (!matchesMemo) return false;
      }

      return true;
    });
  }, [payments, categoryFilter, keyword]);

  /** 新規追加ダイアログを開く */
  const handleAdd = () => {
    setEditingPayment(undefined);
    setFormOpen(true);
  };

  /** 編集ダイアログを開く */
  const handleEdit = (payment: PaymentItem) => {
    setEditingPayment(payment);
    setFormOpen(true);
  };

  /** ステータスをトグルする */
  const handleToggleStatus = async (id: string) => {
    if (togglingId) return;
    setTogglingId(id);
    const result = await togglePaymentStatus(id);
    if (!result.success) {
      toast.error(result.error ?? "ステータスの変更に失敗しました");
    }
    setTogglingId(null);
  };

  /** 単体削除を実行する */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    const result = await deletePayment(deleteTarget.id);
    if (result.success) {
      toast.success("支払いを削除しました");
    } else {
      toast.error(result.error ?? "削除に失敗しました");
    }

    setIsDeleting(false);
    setDeleteTarget(null);
  };

  /** 繰り返しグループの一括削除を実行する */
  const handleDeleteRecurring = async () => {
    if (!recurringDeleteTarget) return;
    setIsDeletingRecurring(true);

    const result = await deleteRecurringGroup(recurringDeleteTarget);
    if (result.success) {
      toast.success("繰り返しグループを一括削除しました");
    } else {
      toast.error(result.error ?? "一括削除に失敗しました");
    }

    setIsDeletingRecurring(false);
    setRecurringDeleteTarget(null);
  };

  /** 一括ステータス変更を実行する */
  const handleBulkStatusUpdate = async () => {
    if (!bulkStatusTarget) return;
    setIsUpdatingBulk(true);

    const result = await bulkUpdatePaymentStatus(
      bulkStatusTarget.creditCardId,
      bulkStatusTarget.month,
      bulkNewStatus
    );
    if (result.success) {
      const statusLabel =
        PAYMENT_STATUSES[bulkNewStatus]?.label ?? bulkNewStatus;
      toast.success(`一括で「${statusLabel}」に変更しました`);
    } else {
      toast.error(result.error ?? "一括変更に失敗しました");
    }

    setIsUpdatingBulk(false);
    setBulkStatusTarget(null);
  };

  /** カード・月の組み合わせを抽出（一括ステータス変更用） */
  const cardMonthPairs = useMemo(() => {
    const map = new Map<string, { creditCardId: string; month: string; cardName: string }>();
    payments.forEach((p) => {
      const key = `${p.creditCardId}_${p.month}`;
      if (!map.has(key)) {
        map.set(key, {
          creditCardId: p.creditCardId,
          month: p.month,
          cardName: p.creditCard.name,
        });
      }
    });
    return Array.from(map.values());
  }, [payments]);

  return (
    <div className="space-y-4">
      {/* 操作ボタン群 */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleAdd}>
          <Plus className="size-4" />
          新規追加
        </Button>
        <Button variant="outline" onClick={() => setBulkOpen(true)}>
          <ListPlus className="size-4" />
          一括登録
        </Button>
        <CsvExportButton />
      </div>

      {/* フィルター */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        {/* カテゴリフィルター */}
        <div className="space-y-1">
          <Label className="text-xs">カテゴリ</Label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全て</SelectItem>
              <SelectItem value="none">未分類</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block size-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* キーワード検索 */}
        <div className="space-y-1">
          <Label className="text-xs">キーワード検索</Label>
          <Input
            placeholder="メモで検索..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-[200px]"
          />
        </div>

        {/* 一括ステータス変更 */}
        {cardMonthPairs.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs">一括ステータス変更</Label>
            <Select
              value=""
              onValueChange={(val) => {
                const pair = cardMonthPairs.find(
                  (p) => `${p.creditCardId}_${p.month}` === val
                );
                if (pair) {
                  setBulkStatusTarget(pair);
                  setBulkNewStatus("confirmed");
                }
              }}
            >
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="カード・月を選択" />
              </SelectTrigger>
              <SelectContent>
                {cardMonthPairs.map((pair) => (
                  <SelectItem
                    key={`${pair.creditCardId}_${pair.month}`}
                    value={`${pair.creditCardId}_${pair.month}`}
                  >
                    {pair.cardName} - {formatMonth(pair.month)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* データがない場合 */}
      {filteredPayments.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-foreground/40 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {payments.length === 0
              ? "支払いがまだ登録されていません"
              : "条件に一致する支払いがありません"}
          </p>
        </div>
      )}

      {/* テーブル */}
      {filteredPayments.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>利用月</TableHead>
                <TableHead>カード</TableHead>
                <TableHead className="text-right">金額</TableHead>
                <TableHead>カテゴリ</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>メモ</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  {/* 利用月 */}
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {formatMonth(payment.month)}
                      {payment.isRecurring && (
                        <Repeat className="size-3 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>

                  {/* カード名 */}
                  <TableCell className="whitespace-nowrap">
                    {payment.creditCard.name}
                  </TableCell>

                  {/* 金額 */}
                  <TableCell className="text-right whitespace-nowrap">
                    {formatCurrency(payment.amount)}
                  </TableCell>

                  {/* カテゴリ */}
                  <TableCell>
                    {payment.category ? (
                      <Badge
                        variant="outline"
                        className="whitespace-nowrap"
                        style={{
                          borderColor: payment.category.color,
                          color: payment.category.color,
                        }}
                      >
                        {payment.category.name}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  {/* ステータス */}
                  <TableCell>
                    <PaymentStatusBadge
                      status={payment.status}
                      onClick={() => handleToggleStatus(payment.id)}
                    />
                  </TableCell>

                  {/* メモ */}
                  <TableCell className="max-w-[150px] truncate">
                    {payment.memo || "-"}
                  </TableCell>

                  {/* 操作 */}
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleEdit(payment)}
                        aria-label="支払いを編集"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(payment)}
                        aria-label="支払いを削除"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                      {payment.recurringGroupId && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            setRecurringDeleteTarget(payment.recurringGroupId!)
                          }
                          title="繰り返しグループ一括削除"
                        >
                          <Repeat className="size-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 追加・編集フォームダイアログ */}
      <PaymentForm
        key={editingPayment?.id ?? "new"}
        payment={editingPayment}
        creditCards={creditCards}
        categories={categories}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      {/* 一括登録ダイアログ */}
      <BulkRegisterDialog
        creditCards={creditCards}
        categories={categories}
        open={bulkOpen}
        onOpenChange={setBulkOpen}
      />

      {/* 単体削除確認ダイアログ */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>支払いを削除</DialogTitle>
            <DialogDescription>
              この支払い（{formatCurrency(deleteTarget?.amount ?? 0)}）を削除しますか？
              この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "削除中..." : "削除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 繰り返し一括削除確認ダイアログ */}
      <Dialog
        open={!!recurringDeleteTarget}
        onOpenChange={(open) => !open && setRecurringDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>繰り返しグループを一括削除</DialogTitle>
            <DialogDescription>
              この繰り返しグループに属する全ての支払いを削除しますか？
              この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRecurringDeleteTarget(null)}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRecurring}
              disabled={isDeletingRecurring}
            >
              {isDeletingRecurring ? "削除中..." : "一括削除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 一括ステータス変更確認ダイアログ */}
      <Dialog
        open={!!bulkStatusTarget}
        onOpenChange={(open) => !open && setBulkStatusTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>一括ステータス変更</DialogTitle>
            <DialogDescription>
              「{bulkStatusTarget?.cardName}」の
              {bulkStatusTarget ? formatMonth(bulkStatusTarget.month) : ""}
              の支払いを一括で変更します。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>変更先ステータス</Label>
            <Select value={bulkNewStatus} onValueChange={(v) => setBulkNewStatus(v as PaymentStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(PAYMENT_STATUSES) as [PaymentStatus, (typeof PAYMENT_STATUSES)[PaymentStatus]][]).map(
                  ([value, { label }]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkStatusTarget(null)}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleBulkStatusUpdate}
              disabled={isUpdatingBulk}
            >
              {isUpdatingBulk ? "変更中..." : "一括変更"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

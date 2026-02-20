"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Trash2, Receipt } from "lucide-react";
import { format, subMonths } from "date-fns";
import type { Payment, CreditCard } from "@/generated/prisma/client";
import { paymentSchema, type PaymentInput, type PaymentStatus } from "@/types";
import { createPayment, updatePayment, deletePayment } from "@/lib/actions/payment";
import { formatCurrency, formatMonth } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type PaymentWithCard = Payment & { creditCard: CreditCard };

type Props = {
  payments: PaymentWithCard[];
  creditCards: CreditCard[];
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

export function PaymentList({ payments, creditCards, currentMonth }: Props) {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PaymentWithCard | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PaymentWithCard | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const monthOptions = generateMonthOptions();

  const form = useForm<PaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      creditCardId: "",
      month: currentMonth,
      amount: undefined,
      memo: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  // 月フィルター変更時にURLを更新（Server Componentを再レンダリング）
  function handleMonthChange(month: string) {
    router.push(`/payments?month=${month}`);
  }

  function handleOpenCreate() {
    setEditTarget(null);
    form.reset({ creditCardId: "", month: currentMonth, amount: undefined, memo: "" });
    setIsFormOpen(true);
  }

  function handleOpenEdit(payment: PaymentWithCard) {
    setEditTarget(payment);
    form.reset({
      creditCardId: payment.creditCardId,
      month: payment.month,
      amount: payment.amount,
      memo: payment.memo ?? "",
    });
    setIsFormOpen(true);
  }

  async function onSubmit(values: PaymentInput) {
    if (editTarget) {
      const result = await updatePayment(editTarget.id, values);
      if (result.success) {
        toast("更新しました");
        setIsFormOpen(false);
      } else {
        toast.error(result.error);
      }
    } else {
      const result = await createPayment(values);
      if (result.success) {
        toast("登録しました");
        setIsFormOpen(false);
      } else {
        toast.error(result.error);
      }
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deletePayment(deleteTarget.id);
    setIsDeleting(false);
    if (result.success) {
      toast("削除しました");
      setDeleteTarget(null);
    } else {
      toast.error(result.error);
    }
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
          <Button onClick={() => handleOpenCreate()}>+ 新規登録</Button>
        </div>
      </div>

      {/* テーブル */}
      <div className="mt-6">
        {payments.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="この月の支払いデータがありません"
            description="新規登録ボタンから追加してください。"
          />
        ) : (
          <div className="overflow-x-auto border-2 border-border bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-border bg-muted">
                  <TableHead className="font-black">カード</TableHead>
                  <TableHead className="font-black">対象月</TableHead>
                  <TableHead className="font-black">金額</TableHead>
                  <TableHead className="font-black">ステータス</TableHead>
                  <TableHead className="font-black text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id} className="border-b-2 border-border hover:bg-secondary/20">
                    <TableCell className="font-bold">{payment.creditCard.name}</TableCell>
                    <TableCell>{formatMonth(payment.month)}</TableCell>
                    <TableCell className="font-bold font-mono">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>
                      <StatusBadge paymentId={payment.id} status={payment.status as PaymentStatus} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(payment)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => setDeleteTarget(payment)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      <Input type="number" placeholder="50000" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))} />
                    </FormControl>
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

      {/* 削除確認ダイアログ */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>この支払いデータを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>この操作は取り消せません。</AlertDialogDescription>
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

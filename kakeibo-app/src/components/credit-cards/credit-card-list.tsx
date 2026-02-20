"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Trash2, CreditCard } from "lucide-react";
import type { CreditCard as CreditCardType } from "@/generated/prisma/client";
import { creditCardSchema, type CreditCardInput } from "@/types";
import { createCreditCard, updateCreditCard, deleteCreditCard } from "@/lib/actions/credit-card";
import { formatDay, formatPaymentDay } from "@/lib/utils";
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

export function CreditCardList({ cards }: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CreditCardType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CreditCardType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<CreditCardInput>({
    resolver: zodResolver(creditCardSchema),
    defaultValues: {
      name: "",
      closingDay: undefined,
      paymentDay: undefined,
      paymentMonthOffset: 0,
      memo: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  function handleOpenCreate() {
    setEditTarget(null);
    form.reset({ name: "", closingDay: undefined, paymentDay: undefined, paymentMonthOffset: 0, memo: "" });
    setIsFormOpen(true);
  }

  function handleOpenEdit(card: CreditCardType) {
    setEditTarget(card);
    form.reset({
      name: card.name,
      closingDay: card.closingDay,
      paymentDay: card.paymentDay,
      paymentMonthOffset: card.paymentMonthOffset,
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
      } else {
        toast.error(result.error);
      }
    } else {
      const result = await createCreditCard(values);
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
    const result = await deleteCreditCard(deleteTarget.id);
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
      <div className="flex items-center justify-between border-b-4 border-border pb-4">
        <h1 className="text-2xl font-black">クレジットカード管理</h1>
        <Button onClick={() => handleOpenCreate()}>+ 新規登録</Button>
      </div>

      <div className="mt-6">
        {cards.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="クレジットカードが登録されていません"
            description="新規登録ボタンから追加してください。"
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <Card key={card.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-black text-lg">{card.name}</p>
                      <p className="mt-1 text-sm font-bold">
                        締め日: {formatDay(card.closingDay)} / 支払い日: {formatPaymentDay(card.paymentDay, card.paymentMonthOffset)}
                      </p>
                      {card.memo && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{card.memo}</p>
                      )}
                    </div>
                    <div className="ml-2 flex shrink-0 gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(card)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => setDeleteTarget(card)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!isSubmitting) setIsFormOpen(open); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? "クレジットカード編集" : "クレジットカード登録"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <FormField
                control={form.control}
                name="closingDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>締め日 *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1〜31" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))} />
                    </FormControl>
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
                      <Input type="number" placeholder="1〜31" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))} />
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

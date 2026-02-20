"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Trash2, Wallet } from "lucide-react";
import { format } from "date-fns";
import type { Salary } from "@/generated/prisma/client";
import { salarySchema, type SalaryInput } from "@/types";
import { createSalary, updateSalary, deleteSalary } from "@/lib/actions/salary";
import { formatCurrency, formatCurrencyJP, formatDay, formatMonth } from "@/lib/utils";
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
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  salaries: Salary[];
};

export function SalaryList({ salaries }: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Salary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Salary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 現在月をデフォルト値に
  const currentMonth = format(new Date(), "yyyy-MM");

  const form = useForm<SalaryInput>({
    resolver: zodResolver(salarySchema),
    defaultValues: {
      month: currentMonth,
      payDay: undefined,
      amount: undefined,
      memo: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  function handleOpenCreate() {
    setEditTarget(null);
    form.reset({ month: currentMonth, payDay: undefined, amount: undefined, memo: "" });
    setIsFormOpen(true);
  }

  function handleOpenEdit(salary: Salary) {
    setEditTarget(salary);
    form.reset({
      month: salary.month,
      payDay: salary.payDay,
      amount: salary.amount,
      memo: salary.memo ?? "",
    });
    setIsFormOpen(true);
  }

  async function onSubmit(values: SalaryInput) {
    if (editTarget) {
      const result = await updateSalary(editTarget.id, values);
      if (result.success) {
        toast("更新しました");
        setIsFormOpen(false);
      } else {
        toast.error(result.error);
      }
    } else {
      const result = await createSalary(values);
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
    const result = await deleteSalary(deleteTarget.id);
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
        <h1 className="text-2xl font-black">給料管理</h1>
        <Button onClick={() => handleOpenCreate()}>+ 新規登録</Button>
      </div>

      <div className="mt-6">
        {salaries.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="給料データがありません"
            description="新規登録ボタンから追加してください。"
          />
        ) : (
          <div className="overflow-x-auto border-2 border-border bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-border bg-muted">
                  <TableHead className="font-black">対象月</TableHead>
                  <TableHead className="font-black">支給日</TableHead>
                  <TableHead className="font-black">手取り額</TableHead>
                  <TableHead className="font-black">メモ</TableHead>
                  <TableHead className="font-black text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaries.map((salary) => (
                  <TableRow key={salary.id} className="border-b-2 border-border hover:bg-secondary/20">
                    <TableCell className="font-bold">{formatMonth(salary.month)}</TableCell>
                    <TableCell>{formatDay(salary.payDay)}</TableCell>
                    <TableCell className="font-bold font-mono">{formatCurrency(salary.amount)}</TableCell>
                    <TableCell className="text-muted-foreground">{salary.memo || "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(salary)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => setDeleteTarget(salary)}>
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
            <DialogTitle>{editTarget ? "給料編集" : "給料登録"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                name="payDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>支給日 *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1〜31" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>手取り額（円） *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="250000" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))} />
                    </FormControl>
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
            <AlertDialogTitle>この給料データを削除しますか？</AlertDialogTitle>
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

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Trash2, Wallet, GripVertical } from "lucide-react";
import { format } from "date-fns";
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
import type { Salary } from "@/generated/prisma/client";
import { salarySchema, type SalaryInput } from "@/types";
import {
  createSalary,
  updateSalary,
  deleteSalary,
  updateSalaryOrder,
} from "@/lib/actions/salary";
import { formatCurrency, formatCurrencyJP, formatDay, formatMonth } from "@/lib/utils";
import { AmountPresets } from "@/components/amount-presets";
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

// ドラッグ可能なテーブル行
function SortableSalaryRow({
  salary,
  onEdit,
  onDelete,
}: {
  salary: Salary;
  onEdit: (salary: Salary) => void;
  onDelete: (salary: Salary) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: salary.id });

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
      <TableCell className="font-bold">{formatMonth(salary.month)}</TableCell>
      <TableCell>{formatDay(salary.payDay)}</TableCell>
      <TableCell className="font-bold font-mono">{formatCurrency(salary.amount)}</TableCell>
      <TableCell className="text-muted-foreground">{salary.memo || "—"}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(salary)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="h-8 w-8"
            onClick={() => onDelete(salary)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function SalaryList({ salaries }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(salaries);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Salary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Salary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // サーバー再レンダリング後に props と state を同期
  useEffect(() => { setItems(salaries); }, [salaries]);

  // 現在月をデフォルト値に
  const currentMonth = format(new Date(), "yyyy-MM");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
  );

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
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } else {
      const result = await createSalary(values);
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
    const result = await deleteSalary(deleteTarget.id);
    setIsDeleting(false);
    if (result.success) {
      toast("削除しました");
      setDeleteTarget(null);
      setItems((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    } else {
      toast.error(result.error);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((s) => s.id === active.id);
    const newIndex = items.findIndex((s) => s.id === over.id);
    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems); // 楽観的更新
    await updateSalaryOrder(newItems.map((s) => s.id));
  }

  return (
    <>
      <div className="flex items-center justify-between border-b-4 border-border pb-4">
        <h1 className="text-2xl font-black">給料管理</h1>
        <Button onClick={() => handleOpenCreate()}>+ 新規登録</Button>
      </div>

      <div className="mt-6">
        {items.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="給料データがありません"
            description="新規登録ボタンから追加してください。"
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
                items={items.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-2 border-border bg-muted">
                      <TableHead className="w-8" />
                      <TableHead className="font-black">対象月</TableHead>
                      <TableHead className="font-black">支給日</TableHead>
                      <TableHead className="font-black">手取り額</TableHead>
                      <TableHead className="font-black">メモ</TableHead>
                      <TableHead className="font-black text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((salary) => (
                      <SortableSalaryRow
                        key={salary.id}
                        salary={salary}
                        onEdit={handleOpenEdit}
                        onDelete={(salary) => setDeleteTarget(salary)}
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
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="1〜31"
                        {...field}
                        value={field.value != null ? String(field.value) : ""}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/[^0-9]/g, "");
                          field.onChange(digits === "" ? undefined : Number(digits));
                        }}
                      />
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
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="250000"
                        {...field}
                        value={field.value != null ? String(field.value) : ""}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/[^0-9]/g, "");
                          field.onChange(digits === "" ? undefined : Number(digits));
                        }}
                      />
                    </FormControl>
                    <AmountPresets
                      storageKey="kakeibo-presets-salary"
                      defaults={[150000, 200000, 250000, 300000, 350000]}
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

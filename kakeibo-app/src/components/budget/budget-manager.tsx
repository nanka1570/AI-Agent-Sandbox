"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Wallet } from "lucide-react";
import type { Category, Budget, Payment } from "@/generated/prisma/client";
import {
  categorySchema,
  budgetSchema,
  type CategoryInput,
  type BudgetInput,
  type ActionResult,
} from "@/types";
import { createCategory, updateCategory, deleteCategory } from "@/lib/actions/category";
import { upsertBudget } from "@/lib/actions/budget";
import { formatCurrency, formatCurrencyJP } from "@/lib/utils";
import { MonthSelector } from "@/components/month-selector";
import { EmptyState } from "@/components/empty-state";
import { Progress } from "@/components/ui/progress";
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

// 予算にカテゴリ情報を含めた型
type BudgetWithCategory = Budget & { category: Category };

type Props = {
  categories: Category[];
  budgets: BudgetWithCategory[];
  payments: Payment[];
  currentMonth: string;
};

// カテゴリ別の実績を計算する
function calcActualByCategory(
  payments: Payment[],
  categoryId: string
): number {
  return payments
    .filter((p) => p.categoryId === categoryId)
    .reduce((sum, p) => sum + p.amount, 0);
}

// 消化率を計算する（0-100、超過時は100以上）
function calcProgress(actual: number, budget: number): number {
  if (budget <= 0) return 0;
  return Math.round((actual / budget) * 100);
}

export function BudgetManager({
  categories,
  budgets,
  payments,
  currentMonth,
}: Props) {
  const router = useRouter();

  // カテゴリ追加/編集ダイアログ
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [editCategoryTarget, setEditCategoryTarget] = useState<Category | null>(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 予算編集ダイアログ
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [budgetCategoryTarget, setBudgetCategoryTarget] = useState<Category | null>(null);

  // カテゴリフォーム
  const categoryForm = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", color: "#FF6384", sortOrder: 0 },
  });

  // 予算フォーム
  const budgetForm = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { categoryId: "", month: currentMonth, amount: undefined },
  });

  const isCategorySubmitting = categoryForm.formState.isSubmitting;
  const isBudgetSubmitting = budgetForm.formState.isSubmitting;

  // カテゴリ追加ダイアログを開く
  function handleOpenCreateCategory() {
    setEditCategoryTarget(null);
    categoryForm.reset({ name: "", color: "#FF6384", sortOrder: categories.length });
    setIsCategoryOpen(true);
  }

  // カテゴリ編集ダイアログを開く
  function handleOpenEditCategory(category: Category) {
    setEditCategoryTarget(category);
    categoryForm.reset({
      name: category.name,
      color: category.color,
      sortOrder: category.sortOrder,
    });
    setIsCategoryOpen(true);
  }

  // カテゴリ保存
  async function onCategorySubmit(values: CategoryInput) {
    let result: ActionResult<Category>;
    if (editCategoryTarget) {
      result = await updateCategory(editCategoryTarget.id, values);
    } else {
      result = await createCategory(values);
    }

    if (result.success) {
      toast(editCategoryTarget ? "カテゴリを更新しました" : "カテゴリを追加しました");
      setIsCategoryOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  // カテゴリ削除
  async function handleDeleteCategory() {
    if (!deleteCategoryTarget) return;
    setIsDeleting(true);
    const result = await deleteCategory(deleteCategoryTarget.id);
    setIsDeleting(false);
    if (result.success) {
      toast("カテゴリを削除しました");
      setDeleteCategoryTarget(null);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  // 予算設定ダイアログを開く
  function handleOpenBudget(category: Category) {
    setBudgetCategoryTarget(category);
    const existingBudget = budgets.find((b) => b.categoryId === category.id);
    budgetForm.reset({
      categoryId: category.id,
      month: currentMonth,
      amount: existingBudget?.amount ?? undefined,
    });
    setIsBudgetOpen(true);
  }

  // 予算保存
  async function onBudgetSubmit(values: BudgetInput) {
    const result = await upsertBudget(values);
    if (result.success) {
      toast("予算を設定しました");
      setIsBudgetOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <>
      {/* ヘッダー: タイトル + MonthSelector + カテゴリ追加ボタン */}
      <div className="flex items-center justify-between border-b-4 border-border pb-4">
        <h1 className="text-2xl font-black">予算管理</h1>
        <div className="flex items-center gap-3">
          <MonthSelector currentMonth={currentMonth} basePath="/budget" />
          <Button onClick={() => handleOpenCreateCategory()}>
            <Plus className="mr-1 h-4 w-4" />
            カテゴリ追加
          </Button>
        </div>
      </div>

      {/* カテゴリ一覧テーブル */}
      <div className="mt-6">
        {categories.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="カテゴリがありません"
            description="カテゴリを追加して予算を管理しましょう。"
          />
        ) : (
          <div className="overflow-x-auto border-2 border-border bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-border bg-muted">
                  <TableHead className="font-black">カテゴリ</TableHead>
                  <TableHead className="font-black">予算額</TableHead>
                  <TableHead className="font-black">実績</TableHead>
                  <TableHead className="w-[200px] font-black">消化率</TableHead>
                  <TableHead className="font-black text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => {
                  const budget = budgets.find((b) => b.categoryId === category.id);
                  const budgetAmount = budget?.amount ?? 0;
                  const actual = calcActualByCategory(payments, category.id);
                  const progress = budgetAmount > 0 ? calcProgress(actual, budgetAmount) : 0;
                  const isOverBudget = progress > 100;

                  return (
                    <TableRow
                      key={category.id}
                      className="border-b-2 border-border hover:bg-secondary/20"
                    >
                      {/* カテゴリ名 + 色付き丸 */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-4 w-4 rounded-full border-2 border-border"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-bold">{category.name}</span>
                        </div>
                      </TableCell>

                      {/* 予算額 */}
                      <TableCell className="font-mono font-bold">
                        {budgetAmount > 0 ? (
                          <button
                            type="button"
                            className="cursor-pointer underline decoration-dotted underline-offset-2 hover:text-primary"
                            onClick={() => handleOpenBudget(category)}
                          >
                            {formatCurrency(budgetAmount)}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="cursor-pointer text-muted-foreground hover:text-primary"
                            onClick={() => handleOpenBudget(category)}
                          >
                            設定する
                          </button>
                        )}
                      </TableCell>

                      {/* 実績 */}
                      <TableCell className="font-mono font-bold">
                        {formatCurrency(actual)}
                      </TableCell>

                      {/* 消化率バー */}
                      <TableCell>
                        {budgetAmount > 0 ? (
                          <div className="flex items-center gap-2">
                            <Progress
                              value={Math.min(progress, 100)}
                              className={`h-3 border border-border ${isOverBudget ? "[&>div]:bg-red-500" : "[&>div]:bg-emerald-500"}`}
                            />
                            <span
                              className={`min-w-[3rem] text-right text-xs font-bold ${isOverBudget ? "text-red-600" : "text-muted-foreground"}`}
                            >
                              {progress}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>

                      {/* 操作ボタン */}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenEditCategory(category)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {!category.isDefault && (
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setDeleteCategoryTarget(category)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* カテゴリ追加/編集ダイアログ */}
      <Dialog
        open={isCategoryOpen}
        onOpenChange={(open) => {
          if (!isCategorySubmitting) setIsCategoryOpen(open);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editCategoryTarget ? "カテゴリ編集" : "カテゴリ追加"}
            </DialogTitle>
          </DialogHeader>
          <Form {...categoryForm}>
            <form
              onSubmit={categoryForm.handleSubmit(onCategorySubmit)}
              className="space-y-4"
            >
              <FormField
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>カテゴリ名 *</FormLabel>
                    <FormControl>
                      <Input placeholder="例: 食費" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={categoryForm.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>カラー *</FormLabel>
                    <div className="flex items-center gap-3">
                      <FormControl>
                        <Input type="color" className="h-10 w-16 p-1" {...field} />
                      </FormControl>
                      <Input
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="#FF6384"
                        className="flex-1"
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isCategorySubmitting}
                  onClick={() => setIsCategoryOpen(false)}
                >
                  キャンセル
                </Button>
                <Button type="submit" disabled={isCategorySubmitting}>
                  {editCategoryTarget ? "更新する" : "追加する"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* カテゴリ削除確認ダイアログ */}
      <AlertDialog
        open={!!deleteCategoryTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteCategoryTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              「{deleteCategoryTarget?.name}」を削除しますか？
            </AlertDialogTitle>
            <AlertDialogDescription>
              このカテゴリに関連する予算データも削除されます。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={() => handleDeleteCategory()}
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 予算設定ダイアログ */}
      <Dialog
        open={isBudgetOpen}
        onOpenChange={(open) => {
          if (!isBudgetSubmitting) setIsBudgetOpen(open);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              予算設定 - {budgetCategoryTarget?.name}
            </DialogTitle>
          </DialogHeader>
          <Form {...budgetForm}>
            <form
              onSubmit={budgetForm.handleSubmit(onBudgetSubmit)}
              className="space-y-4"
            >
              <FormField
                control={budgetForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>予算額（円） *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="30000"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? undefined : Number(e.target.value)
                          )
                        }
                      />
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
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isBudgetSubmitting}
                  onClick={() => setIsBudgetOpen(false)}
                >
                  キャンセル
                </Button>
                <Button type="submit" disabled={isBudgetSubmitting}>
                  保存する
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

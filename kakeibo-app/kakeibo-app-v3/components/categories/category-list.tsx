"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  CategoryForm,
  type CategoryItem,
} from "@/components/categories/category-form";
import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";
import {
  deleteCategory,
  createDefaultCategories,
} from "@/lib/actions/category-actions";
import { FIXED_LAST_CATEGORY_NAME } from "@/lib/constants";

interface CategoryListProps {
  categories: CategoryItem[];
}

export function CategoryList({
  categories: initialCategories,
}: CategoryListProps) {
  const [items, setItems] = useState(initialCategories);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryItem | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingDefaults, setIsCreatingDefaults] = useState(false);

  const sorted = [...items].sort((a, b) => {
    if (a.name === FIXED_LAST_CATEGORY_NAME) return 1;
    if (b.name === FIXED_LAST_CATEGORY_NAME) return -1;
    return a.sortOrder - b.sortOrder;
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deleteCategory(deleteTarget.id);
    if (result.success) {
      toast.success("カテゴリを削除しました");
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
    } else {
      toast.error(result.error ?? "削除に失敗しました");
    }
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  const handleCreateDefaults = async () => {
    setIsCreatingDefaults(true);
    const result = await createDefaultCategories();
    if (result.success) {
      toast.success("デフォルトカテゴリを作成しました");
      // ページリロードで反映
      window.location.reload();
    } else {
      toast.error(result.error ?? "作成に失敗しました");
      setIsCreatingDefaults(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center">
        <FolderPlus className="size-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          カテゴリがまだ登録されていません
        </p>
        <Button onClick={handleCreateDefaults} disabled={isCreatingDefaults}>
          {isCreatingDefaults ? "作成中..." : "デフォルトカテゴリを作成"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={() => {
          setEditing(undefined);
          setFormOpen(true);
        }}
        className="w-full sm:w-auto"
      >
        <Plus className="size-4" />
        カテゴリを追加
      </Button>

      <div className="space-y-2">
        {sorted.map((category) => (
          <div
            key={category.id}
            className="flex items-center gap-3 rounded-lg border bg-card p-3"
          >
            <div
              className="size-6 shrink-0 rounded-full border"
              style={{ backgroundColor: category.color }}
            />
            <span className="flex-1 text-sm font-medium">{category.name}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setEditing(category);
                setFormOpen(true);
              }}
              aria-label={`${category.name}を編集`}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setDeleteTarget(category)}
              aria-label={`${category.name}を削除`}
              disabled={category.isDefault}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      <CategoryForm
        key={editing?.id ?? "new"}
        category={editing}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={(data, isEditing) => {
          if (isEditing) {
            setItems((prev) =>
              prev.map((i) => (i.id === data.id ? data : i)),
            );
          } else {
            setItems((prev) => [...prev, data]);
          }
        }}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="カテゴリを削除"
        description={`「${deleteTarget?.name}」を削除しますか？この操作は取り消せません。`}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}

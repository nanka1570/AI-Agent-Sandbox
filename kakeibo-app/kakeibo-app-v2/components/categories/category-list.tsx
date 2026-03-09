"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, Plus, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { CategoryForm } from "@/components/categories/category-form";
import {
  reorderCategories,
  deleteCategory,
  createDefaultCategories,
} from "@/lib/actions/category-actions";
import { FIXED_LAST_CATEGORY_NAME } from "@/lib/constants";

interface CategoryItem {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  isDefault: boolean;
}

interface CategoryListProps {
  categories: CategoryItem[];
}

/** ソート可能なカテゴリアイテム */
function SortableCategoryItem({
  category,
  onEdit,
  onDelete,
}: {
  category: CategoryItem;
  onEdit: (category: CategoryItem) => void;
  onDelete: (category: CategoryItem) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border bg-card p-3 ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      {/* ドラッグハンドル */}
      <button
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-5" />
      </button>

      {/* カラーバッジ */}
      <div
        className="size-6 shrink-0 rounded-full border"
        style={{ backgroundColor: category.color }}
      />

      {/* カテゴリ名 */}
      <span className="flex-1 text-sm font-medium">{category.name}</span>

      {/* 編集ボタン */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onEdit(category)}
        aria-label={`${category.name}を編集`}
      >
        <Pencil className="size-4" />
      </Button>

      {/* 削除ボタン */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onDelete(category)}
        aria-label={`${category.name}を削除`}
      >
        <Trash2 className="size-4 text-destructive" />
      </Button>
    </div>
  );
}

/** 「その他」カテゴリの固定表示アイテム */
function FixedCategoryItem({
  category,
  onEdit,
  onDelete,
}: {
  category: CategoryItem;
  onEdit: (category: CategoryItem) => void;
  onDelete: (category: CategoryItem) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3 opacity-75">
      {/* ドラッグハンドル（無効） */}
      <div className="text-muted-foreground/30">
        <GripVertical className="size-5" />
      </div>

      {/* カラーバッジ */}
      <div
        className="size-6 shrink-0 rounded-full border"
        style={{ backgroundColor: category.color }}
      />

      {/* カテゴリ名 */}
      <span className="flex-1 text-sm font-medium">{category.name}</span>

      {/* 編集ボタン */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onEdit(category)}
        aria-label={`${category.name}を編集`}
      >
        <Pencil className="size-4" />
      </Button>

      {/* 削除ボタン */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onDelete(category)}
        aria-label={`${category.name}を削除`}
      >
        <Trash2 className="size-4 text-destructive" />
      </Button>
    </div>
  );
}

export function CategoryList({ categories: initialCategories }: CategoryListProps) {
  const isEmpty = initialCategories.length === 0;
  const [isCreatingDefaults, setIsCreatingDefaults] = useState(false);

  // 末尾固定カテゴリを分離
  const otherCategory = initialCategories.find(
    (c) => c.isDefault && c.name === FIXED_LAST_CATEGORY_NAME
  );
  const sortableCategories = initialCategories.filter(
    (c) => !(c.isDefault && c.name === FIXED_LAST_CATEGORY_NAME)
  );

  const [items, setItems] = useState(sortableCategories);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  /** ドラッグ完了時の並び替え処理 */
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      // リバート用に変更前の状態を保持
      const prevItems = items;
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      // 「その他」を含めた全IDリストを構築（「その他」は末尾）
      const orderedIds = [
        ...newItems.map((i) => i.id),
        ...(otherCategory ? [otherCategory.id] : []),
      ];

      const result = await reorderCategories(orderedIds);
      if (!result.success) {
        toast.error(result.error ?? "並び替えに失敗しました");
        setItems(prevItems);
      }
    },
    [items, otherCategory]
  );

  /** 新規追加ダイアログを開く */
  const handleAdd = () => {
    setEditingCategory(undefined);
    setFormOpen(true);
  };

  /** 編集ダイアログを開く */
  const handleEdit = (category: CategoryItem) => {
    setEditingCategory(category);
    setFormOpen(true);
  };

  /** 削除確認ダイアログを開く */
  const handleDeleteConfirm = (category: CategoryItem) => {
    setDeleteTarget(category);
  };

  /** 削除を実行する */
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

  /** デフォルトカテゴリを作成する */
  const handleCreateDefaults = async () => {
    setIsCreatingDefaults(true);
    const result = await createDefaultCategories();
    if (result.success) {
      toast.success("デフォルトカテゴリを作成しました");
    } else {
      toast.error(result.error ?? "デフォルトカテゴリの作成に失敗しました");
    }
    setIsCreatingDefaults(false);
  };

  // カテゴリが0件の場合はデフォルト作成 UI を表示
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
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
      {/* 新規追加ボタン */}
      <Button onClick={handleAdd} className="w-full sm:w-auto">
        <Plus className="size-4" />
        カテゴリを追加
      </Button>

      {/* ソート可能なカテゴリリスト */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {items.map((category) => (
              <SortableCategoryItem
                key={category.id}
                category={category}
                onEdit={handleEdit}
                onDelete={handleDeleteConfirm}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* 「その他」カテゴリ（末尾固定） */}
      {otherCategory && (
        <div className="space-y-2">
          <FixedCategoryItem
            category={otherCategory}
            onEdit={handleEdit}
            onDelete={handleDeleteConfirm}
          />
        </div>
      )}

      {/* 追加・編集フォームダイアログ */}
      <CategoryForm
        key={editingCategory?.id ?? "new"}
        category={editingCategory}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={(data, isEditing) => {
          if (isEditing) {
            setItems((prev) =>
              prev.map((i) => (i.id === data.id ? data : i))
            );
          } else {
            setItems((prev) => [...prev, data]);
          }
        }}
      />

      {/* 削除確認ダイアログ */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>カテゴリを削除</DialogTitle>
            <DialogDescription>
              「{deleteTarget?.name}」を削除しますか？この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
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
    </div>
  );
}

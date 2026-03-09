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
import { GripVertical, Pencil, Trash2, Plus, CreditCard } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { CreditCardForm } from "@/components/credit-cards/credit-card-form";
import {
  reorderCreditCards,
  deleteCreditCard,
} from "@/lib/actions/credit-card-actions";
import { CARD_BRANDS } from "@/lib/constants";
import { formatDay } from "@/lib/utils/format";

interface CreditCardItem {
  id: string;
  name: string;
  closingDay: number;
  paymentDay: number;
  paymentMonthOffset: number;
  confirmationDay: number | null;
  confirmationMonthOffset: number | null;
  brand: string | null;
  memo: string | null;
  sortOrder: number;
}

interface CreditCardListProps {
  cards: CreditCardItem[];
}

/** ブランドのラベルを取得する */
function getBrandLabel(brandValue: string | null): string | null {
  if (!brandValue) return null;
  const brand = CARD_BRANDS.find((b) => b.value === brandValue);
  return brand?.label ?? brandValue;
}

/** 支払月オフセットのラベル */
const OFFSET_LABELS: Record<number, string> = {
  0: "当月",
  1: "翌月",
  2: "翌々月",
};

function getOffsetLabel(offset: number): string {
  return OFFSET_LABELS[offset] ?? `${offset}ヶ月後`;
}

/** ソート可能なクレジットカードアイテム */
function SortableCreditCardItem({
  card,
  onEdit,
  onDelete,
}: {
  card: CreditCardItem;
  onEdit: (card: CreditCardItem) => void;
  onDelete: (card: CreditCardItem) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const brandLabel = getBrandLabel(card.brand);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border-2 border-foreground bg-card p-4 shadow-[3px_3px_0px_oklch(0.50_0.01_280)] ${
        isDragging ? "opacity-50 shadow-[1px_1px_0px_oklch(0.50_0.01_280)]" : ""
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

      {/* カードアイコン */}
      <CreditCard className="size-5 shrink-0 text-muted-foreground" />

      {/* カード情報 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{card.name}</span>
          {brandLabel && (
            <Badge variant="secondary" className="text-xs">
              {brandLabel}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          締め{formatDay(card.closingDay)} → {getOffsetLabel(card.paymentMonthOffset)}
          {formatDay(card.paymentDay)}払い
        </p>
      </div>

      {/* 編集ボタン */}
      <Button variant="ghost" size="icon-sm" onClick={() => onEdit(card)} aria-label={`${card.name}を編集`}>
        <Pencil className="size-4" />
      </Button>

      {/* 削除ボタン */}
      <Button variant="ghost" size="icon-sm" onClick={() => onDelete(card)} aria-label={`${card.name}を削除`}>
        <Trash2 className="size-4 text-destructive" />
      </Button>
    </div>
  );
}

export function CreditCardList({ cards: initialCards }: CreditCardListProps) {
  const [items, setItems] = useState(initialCards);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCardItem | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<CreditCardItem | null>(null);
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

      const orderedIds = newItems.map((i) => i.id);
      const result = await reorderCreditCards(orderedIds);
      if (!result.success) {
        toast.error(result.error ?? "並び替えに失敗しました");
        setItems(prevItems);
      }
    },
    [items]
  );

  /** 新規追加ダイアログを開く */
  const handleAdd = () => {
    setEditingCard(undefined);
    setFormOpen(true);
  };

  /** 編集ダイアログを開く */
  const handleEdit = (card: CreditCardItem) => {
    setEditingCard(card);
    setFormOpen(true);
  };

  /** 削除確認ダイアログを開く */
  const handleDeleteConfirm = (card: CreditCardItem) => {
    setDeleteTarget(card);
  };

  /** 削除を実行する */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    const result = await deleteCreditCard(deleteTarget.id);
    if (result.success) {
      toast.success("カードを削除しました");
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
    } else {
      toast.error(result.error ?? "削除に失敗しました");
    }

    setIsDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">
      {/* 新規追加ボタン */}
      <Button onClick={handleAdd} className="w-full sm:w-auto">
        <Plus className="size-4" />
        カードを追加
      </Button>

      {/* カードがない場合 */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-foreground/40 p-8 text-center">
          <CreditCard className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            クレジットカードがまだ登録されていません
          </p>
        </div>
      )}

      {/* ソート可能なカードリスト */}
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
            {items.map((card) => (
              <SortableCreditCardItem
                key={card.id}
                card={card}
                onEdit={handleEdit}
                onDelete={handleDeleteConfirm}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* 追加・編集フォームダイアログ */}
      <CreditCardForm
        key={editingCard?.id ?? "new"}
        card={editingCard}
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
            <DialogTitle>カードを削除</DialogTitle>
            <DialogDescription>
              「{deleteTarget?.name}
              」を削除しますか？関連する支払いもすべて削除されます。この操作は取り消せません。
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

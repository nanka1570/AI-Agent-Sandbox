"use client";

import { useEffect, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { categorySchema, type CategoryInput } from "@/lib/validations/category";
import { createCategory, updateCategory } from "@/lib/actions/category-actions";

export interface CategoryItem {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  isDefault: boolean;
}

interface CategoryFormProps {
  category?: CategoryItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (data: CategoryItem, isEditing: boolean) => void;
}

export function CategoryForm({
  category,
  open,
  onOpenChange,
  onSuccess,
}: CategoryFormProps) {
  const isEditing = !!category;
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      color: category?.color ?? "#FF6384",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: category?.name ?? "",
        color: category?.color ?? "#FF6384",
      });
    }
  }, [open, category, reset]);

  const onSubmit = (formData: CategoryInput) => {
    startTransition(async () => {
      const result = isEditing
        ? await updateCategory(category.id, formData)
        : await createCategory(formData);

      if (result.success) {
        toast.success(
          isEditing ? "カテゴリを更新しました" : "カテゴリを追加しました",
        );
        if (result.data) {
          const { id, name, color, sortOrder, isDefault } = result.data;
          onSuccess?.({ id, name, color, sortOrder, isDefault }, isEditing);
        }
        reset();
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "カテゴリを編集" : "カテゴリを追加"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">カテゴリ名</Label>
            <Input
              id="category-name"
              placeholder="例: 食費"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-color">カラー</Label>
            <Controller
              name="color"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-3">
                  <Input
                    id="category-color"
                    type="color"
                    className="h-10 w-16 cursor-pointer p-1"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                  <Input
                    placeholder="#FF6384"
                    className="flex-1"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                </div>
              )}
            />
            {errors.color && (
              <p className="text-sm text-destructive">{errors.color.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting || isPending}>
              {isSubmitting || isPending
                ? "保存中..."
                : isEditing
                  ? "更新"
                  : "追加"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

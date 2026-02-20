"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { CreditCard, Category } from "@/generated/prisma/client";
import { QuickInputDialog } from "@/components/quick-input/quick-input-dialog";

type Props = {
  creditCards: CreditCard[];
  categories: Category[];
};

export function QuickInputFab({ creditCards, categories }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* FAB ボタン（右下固定） */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full border-2 border-border bg-primary text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:scale-105 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:bottom-8"
        aria-label="クイック入力"
      >
        <Plus className="h-7 w-7" />
      </button>

      {/* クイック入力ダイアログ */}
      <QuickInputDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        creditCards={creditCards}
        categories={categories}
      />
    </>
  );
}

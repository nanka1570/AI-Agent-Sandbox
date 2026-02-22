"use client";

import { useState, useEffect } from "react";
import { formatCurrencyJP } from "@/lib/utils";

type Props = {
  storageKey: string;
  defaults: number[];
  onSelect: (value: number) => void;
};

export function AmountPresets({ storageKey, defaults, onSelect }: Props) {
  const [presets, setPresets] = useState<number[]>(defaults);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");

  // localStorage からカスタムプリセットを読み込み
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as unknown;
        if (
          Array.isArray(parsed) &&
          parsed.every((v) => typeof v === "number")
        ) {
          setPresets(parsed as number[]);
        }
      } catch {
        // 無効なデータは無視
      }
    }
  }, [storageKey]);

  function save(next: number[]) {
    setPresets(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }

  function handleRemove(v: number) {
    save(presets.filter((p) => p !== v));
  }

  function handleAdd() {
    const v = Number(inputValue);
    if (!v || v <= 0 || presets.includes(v)) return;
    const next = [...presets, v].sort((a, b) => a - b);
    save(next);
    setInputValue("");
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1">
        {presets.map((v) =>
          isEditing ? (
            <button
              key={v}
              type="button"
              onClick={() => handleRemove(v)}
              className="flex items-center gap-0.5 border border-destructive px-2 py-0.5 text-xs font-bold text-destructive hover:bg-destructive/10"
            >
              <span>×</span>
              {formatCurrencyJP(v)}
            </button>
          ) : (
            <button
              key={v}
              type="button"
              onClick={() => onSelect(v)}
              className="border border-border px-2 py-0.5 text-xs font-bold hover:bg-secondary active:translate-x-px active:translate-y-px"
            >
              {formatCurrencyJP(v)}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground"
        >
          {isEditing ? "完了" : "✎ 編集"}
        </button>
      </div>
      {isEditing && (
        <div className="flex gap-1">
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="金額を入力"
            className="w-28 border border-border px-2 py-0.5 text-xs"
          />
          <button
            type="button"
            onClick={() => handleAdd()}
            className="border border-border px-2 py-0.5 text-xs font-bold hover:bg-secondary"
          >
            追加
          </button>
        </div>
      )}
    </div>
  );
}

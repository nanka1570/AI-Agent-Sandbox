"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  parseCsv,
  applyMapping,
  type ParsedCsv,
  type ImportItem,
  type ColumnMapping,
} from "@/lib/utils/csv-import";
import { bulkCreatePayments } from "@/lib/actions/csv-import-actions";
import { formatCurrency } from "@/lib/utils/format";

interface CardOption {
  id: string;
  name: string;
}
interface CategoryOption {
  id: string;
  name: string;
  color: string;
}

interface CsvImportWizardProps {
  cards: CardOption[];
  categories: CategoryOption[];
}

const NO_COLUMN = "__none__";

export function CsvImportWizard({ cards, categories }: CsvImportWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({
    dateColumn: "",
    amountColumn: "",
    memoColumn: undefined,
  });
  const [cardId, setCardId] = useState<string>(cards[0]?.id ?? "");
  const [defaultCategoryId, setDefaultCategoryId] = useState<string>(
    categories[0]?.id ?? "",
  );
  const [items, setItems] = useState<ImportItem[]>([]);
  const [errors, setErrors] = useState<{ row: number; reason: string }[]>([]);
  const [importError, setImportError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    const text = await file.text();
    const result = parseCsv(text);
    setParsed(result);
    setMapping({
      dateColumn: result.headers[0] ?? "",
      amountColumn: result.headers[1] ?? "",
      memoColumn: result.headers[2],
    });
    setItems([]);
    setErrors([]);
  };

  const handlePreview = () => {
    if (!parsed) return;
    if (!mapping.dateColumn || !mapping.amountColumn) {
      toast.error("日付列・金額列を指定してください");
      return;
    }
    const result = applyMapping(parsed.rows, mapping);
    setItems(result.items);
    setErrors(result.errors);
  };

  const handleImport = () => {
    if (items.length === 0) {
      toast.error("インポートする明細がありません");
      return;
    }
    setImportError(null);
    startTransition(async () => {
      const result = await bulkCreatePayments({
        creditCardId: cardId,
        items: items.map((i) => ({
          usageDate: i.usageDate,
          amount: i.amount,
          memo: i.memo,
          categoryId: defaultCategoryId,
        })),
      });
      if (result.success) {
        const { created, skipped } = result.data ?? { created: 0, skipped: 0 };
        toast.success(
          `${created} 件を登録${skipped > 0 ? `（${skipped} 件は重複でスキップ）` : ""}`,
        );
        router.push("/payments");
      } else {
        setImportError(result.error ?? "一括登録に失敗しました");
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-4">
        <p className="mb-3 text-sm font-medium">1. カードを選択</p>
        <Select value={cardId} onValueChange={setCardId}>
          <SelectTrigger>
            <SelectValue placeholder="カード" />
          </SelectTrigger>
          <SelectContent>
            {cards.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <p className="mb-3 text-sm font-medium">2. CSV ファイルをアップロード</p>
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors hover:bg-accent">
          <Upload className="size-6 text-muted-foreground" />
          <span className="text-sm">
            {parsed ? "ファイルを変更" : "クリックして選択"}
          </span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
        {parsed && (
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="size-3" />
            {parsed.rows.length} 行 / {parsed.headers.length} 列を検出
          </p>
        )}
      </div>

      {parsed && (
        <div className="rounded-lg border bg-card p-4">
          <p className="mb-3 text-sm font-medium">3. 列を割り当て</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-xs">日付列</Label>
              <Select
                value={mapping.dateColumn}
                onValueChange={(v) =>
                  setMapping((m) => ({ ...m, dateColumn: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {parsed.headers.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">金額列</Label>
              <Select
                value={mapping.amountColumn}
                onValueChange={(v) =>
                  setMapping((m) => ({ ...m, amountColumn: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {parsed.headers.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">摘要列（任意）</Label>
              <Select
                value={mapping.memoColumn ?? NO_COLUMN}
                onValueChange={(v) =>
                  setMapping((m) => ({
                    ...m,
                    memoColumn: v === NO_COLUMN ? undefined : v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_COLUMN}>指定なし</SelectItem>
                  {parsed.headers.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Label className="text-xs">デフォルトカテゴリ</Label>
            <Select
              value={defaultCategoryId}
              onValueChange={setDefaultCategoryId}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handlePreview} className="mt-4">
            プレビューを表示
          </Button>
        </div>
      )}

      {items.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="size-4 text-green-600" />
            4. プレビュー（{items.length} 件）
          </p>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b">
                  <th className="p-2 text-left">日付</th>
                  <th className="p-2 text-right">金額</th>
                  <th className="p-2 text-left">摘要</th>
                </tr>
              </thead>
              <tbody>
                {items.slice(0, 100).map((item, i) => (
                  <tr
                    key={`${item.usageDate}-${item.amount}-${i}`}
                    className="border-b"
                  >
                    <td className="p-2">{item.usageDate}</td>
                    <td className="p-2 text-right font-mono">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="p-2 text-muted-foreground">
                      {item.memo ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length > 100 && (
              <p className="mt-2 text-xs text-muted-foreground">
                （先頭 100 件を表示）
              </p>
            )}
          </div>
          <Button
            onClick={handleImport}
            disabled={isPending}
            className="mt-4 w-full"
          >
            {isPending
              ? "登録中..."
              : `${items.length} 件を一括登録（重複は自動スキップ）`}
          </Button>
        </div>
      )}

      {errors.length > 0 && (
        <div className="rounded-lg border border-destructive bg-destructive/5 p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-destructive">
            <AlertCircle className="size-4" />
            解釈できなかった行（{errors.length} 件）
          </p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {errors.slice(0, 10).map((e) => (
              <li key={`${e.row}-${e.reason}`}>
                {e.row} 行目: {e.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {importError && (
        <div className="rounded-lg border border-destructive bg-destructive/5 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-destructive">
            <AlertCircle className="size-4" />
            一括登録に失敗しました
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{importError}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            「一括登録」ボタンからリトライできます。
          </p>
        </div>
      )}
    </div>
  );
}

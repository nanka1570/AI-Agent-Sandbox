"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { exportPaymentsCSV } from "@/lib/actions/export";
import { Button } from "@/components/ui/button";

type Props = {
  month: string;
};

/**
 * CSV出力ボタン
 * クリックで Server Action を呼び、結果をBlobにしてダウンロードする
 */
export function ExportButton({ month }: Props) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const result = await exportPaymentsCSV(month);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      // BOMを付与してExcelでの文字化けを防ぐ
      const bom = "\uFEFF";
      const blob = new Blob([bom + result.csv], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);

      // ダウンロードリンクを生成してクリック
      const link = document.createElement("a");
      link.href = url;
      link.download = `支払い_${month}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast("CSVをダウンロードしました");
    } catch {
      toast.error("CSVエクスポートに失敗しました");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isExporting}
      onClick={() => handleExport()}
      className="gap-1.5"
    >
      <Download className="h-4 w-4" />
      CSV出力
    </Button>
  );
}

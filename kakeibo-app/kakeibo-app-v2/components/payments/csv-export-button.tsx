"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportPaymentsCSV } from "@/lib/actions/export-actions";

/**
 * CSVエクスポートボタン
 * クリックするとServer Actionで生成したCSVをダウンロードする
 */
export function CsvExportButton() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await exportPaymentsCSV();
      if (!result.success || !result.data) {
        toast.error(result.success ? "データがありません" : result.error);
        return;
      }

      // BlobからダウンロードURLを生成してクリック
      const blob = new Blob([result.data], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
      a.download = `kakeibo-payments-${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("CSVをダウンロードしました");
    } catch {
      toast.error("エクスポートに失敗しました");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={exporting}>
      <Download className="size-4" />
      {exporting ? "エクスポート中..." : "CSV出力"}
    </Button>
  );
}

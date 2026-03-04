// 広告バナーのプレースホルダー（AdSense承認後に差し替え）
// 本番では Google AdSense のスクリプトとスロットに置き換える
export function AdBanner() {
  return (
    <div className="my-4 flex h-[90px] items-center justify-center border-2 border-dashed border-muted-foreground/30 bg-muted/50 text-xs text-muted-foreground">
      広告スペース
    </div>
  );
}

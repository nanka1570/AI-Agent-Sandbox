// バッジの配色はここで一元管理する（変更時はこのファイルだけ直す）
// green = 買い・良好 / red = 売り / orange = 警戒 / gray = データなし・無効

const TONES = {
  green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  orange: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  gray: "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500",
} as const;

export type BadgeTone = keyof typeof TONES;

export function Badge({
  tone,
  title,
  children,
}: {
  tone: BadgeTone;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      title={title}
      className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

// 買い/売りシグナル用のショートハンド
export function SignalTypeBadge({
  type,
  title,
}: {
  type: "buy" | "sell";
  title?: string;
}) {
  return (
    <Badge tone={type === "buy" ? "green" : "red"} title={title}>
      {type === "buy" ? "買い" : "売り"}
    </Badge>
  );
}

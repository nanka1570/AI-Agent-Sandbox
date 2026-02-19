import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center border-2 border-dashed border-border bg-white p-16 text-center">
      <Icon className="mb-4 h-12 w-12" />
      <h3 className="mb-2 text-lg font-black">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

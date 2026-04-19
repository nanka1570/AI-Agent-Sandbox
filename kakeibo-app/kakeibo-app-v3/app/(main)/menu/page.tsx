import Link from "next/link";
import {
  Landmark,
  Wallet,
  CreditCard,
  Tag,
  PiggyBank,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { logout } from "@/lib/actions/auth-actions";

const menuItems = [
  { href: "/accounts", label: "口座", icon: Landmark },
  { href: "/salary", label: "手取り", icon: Wallet },
  { href: "/credit-cards", label: "クレジットカード", icon: CreditCard },
  { href: "/categories", label: "カテゴリ", icon: Tag },
  { href: "/budget", label: "予算", icon: PiggyBank },
] as const;

async function handleLogout() {
  "use server";
  await logout();
}

export default function MenuPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">メニュー</h1>
        <p className="text-sm text-muted-foreground">
          各マスターデータの管理や設定を行います。
        </p>
      </div>

      <nav className="space-y-2">
        {menuItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
          >
            <Icon className="size-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">{label}</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        ))}
      </nav>

      <form action={handleLogout}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-lg border bg-card p-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="size-5" />
          ログアウト
        </button>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

/**
 * ログアウトボタン（ヘッダーに表示）
 */
export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    try {
      await logout();
    } catch {
      // redirect は例外をthrowするため、Next.js が自動的に処理する
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleLogout()}
      disabled={isLoading}
      className="gap-1 text-xs font-bold text-muted-foreground hover:text-foreground"
    >
      <LogOut className="h-3.5 w-3.5" />
      {isLoading ? "..." : "ログアウト"}
    </Button>
  );
}

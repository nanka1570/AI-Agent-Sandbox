"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Trash2,
  Plus,
  Upload,
  Receipt,
  CreditCard,
  ChevronDown,
  Wallet,
  Repeat,
  Settings2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PaymentForm,
  type PaymentItem,
} from "@/components/payments/payment-form";
import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";
import { SubscriptionOverrideDialog } from "@/components/subscriptions/subscription-override-dialog";
import {
  deletePayment,
  deletePaymentGroup,
} from "@/lib/actions/payment-actions";
import { formatCurrency } from "@/lib/utils/format";
import { PAYMENT_STATUSES, type PaymentStatus } from "@/lib/constants";

interface CardOption {
  id: string;
  name: string;
}
interface AccountOption {
  id: string;
  name: string;
}
interface CategoryOption {
  id: string;
  name: string;
  color: string;
}

interface EnrichedPayment extends PaymentItem {
  cardName: string | null;
  accountName: string | null;
  categoryName: string;
  categoryColor: string;
}

export interface VirtualSubscriptionPayment {
  subscriptionId: string;
  month: string;
  usageDate: Date;
  amount: number;
  baseAmount: number;
  overridden: boolean;
  source: "card" | "account";
  creditCardId: string | null;
  accountId: string | null;
  name: string;
  categoryName: string;
  categoryColor: string;
  cardName: string | null;
  accountName: string | null;
  memo: string | null;
}

interface PaymentListProps {
  payments: EnrichedPayment[];
  subscriptions?: VirtualSubscriptionPayment[];
  cards: CardOption[];
  accounts: AccountOption[];
  categories: CategoryOption[];
}

export function PaymentList({
  payments: initial,
  subscriptions = [],
  cards,
  accounts,
  categories,
}: PaymentListProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EnrichedPayment | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<EnrichedPayment | null>(null);
  const [deleteScope, setDeleteScope] = useState<"one" | "future">("one");
  const [isDeleting, setIsDeleting] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [overrideTarget, setOverrideTarget] =
    useState<VirtualSubscriptionPayment | null>(null);

  const toggleCollapsed = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const grouped = useMemo(() => {
    // key 形式: "card:<id>" | "account:<id>" | "none"
    const buckets = new Map<string, EnrichedPayment[]>();
    for (const p of initial) {
      const key = p.creditCardId
        ? `card:${p.creditCardId}`
        : p.accountId
          ? `account:${p.accountId}`
          : "none";
      const arr = buckets.get(key);
      if (arr) arr.push(p);
      else buckets.set(key, [p]);
    }
    const order: string[] = [
      ...cards.map((c) => `card:${c.id}`),
      ...accounts.map((a) => `account:${a.id}`),
      "none",
    ];
    return order
      .filter((k) => buckets.has(k))
      .map((key) => {
        const items = buckets.get(key) ?? [];
        const [kind, id] = key.split(":");
        let name = "未設定";
        if (kind === "card") {
          name = cards.find((c) => c.id === id)?.name ?? "カード";
        } else if (kind === "account") {
          name = accounts.find((a) => a.id === id)?.name ?? "口座";
        }
        const total = items.reduce((s, p) => s + p.amount, 0);
        return { key, kind, name, items, total };
      });
  }, [initial, cards, accounts]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const useGroup = deleteTarget.recurringGroupId && deleteScope === "future";
    const result = useGroup
      ? await deletePaymentGroup(deleteTarget.id)
      : await deletePayment(deleteTarget.id);
    if (result.success) {
      toast.success(
        useGroup && "data" in result && result.data
          ? `定期支払 ${result.data.count} 件を削除しました`
          : "支払いを削除しました",
      );
      router.refresh();
    } else {
      toast.error(result.error ?? "削除に失敗しました");
    }
    setIsDeleting(false);
    setDeleteTarget(null);
    setDeleteScope("one");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
          disabled={cards.length === 0 && accounts.length === 0}
        >
          <Plus className="size-4" />
          支払いを登録
        </Button>
        <Link href="/payments/import">
          <Button variant="outline" disabled={cards.length === 0}>
            <Upload className="size-4" />
            CSV 取り込み
          </Button>
        </Link>
      </div>

      {subscriptions.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2 rounded-md bg-muted/60 px-3 py-2">
            <Repeat className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-bold">定期支払（仮想表示）</h2>
            <Link
              href="/subscriptions"
              className="ml-auto text-[11px] text-muted-foreground underline"
            >
              管理
            </Link>
          </div>
          <div className="space-y-2">
            {subscriptions.map((s) => {
              const dateStr = format(s.usageDate, "yyyy-MM-dd");
              const src =
                s.source === "card"
                  ? (s.cardName ?? "カード")
                  : (s.accountName ?? "口座");
              return (
                <div
                  key={`${s.subscriptionId}:${s.month}`}
                  className="flex items-center gap-3 rounded-lg border border-dashed bg-card/60 p-3"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: s.categoryColor }}
                      />
                      <p className="text-sm font-medium">{s.name}</p>
                      <span className="text-[11px] text-muted-foreground">
                        {s.categoryName}
                      </span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        定期
                      </span>
                      {s.overridden && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
                          今月のみ変更
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {dateStr} / {src}
                      {s.memo && <span className="ml-2">{s.memo}</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(s.amount)}</p>
                    {s.overridden && s.amount !== s.baseAmount && (
                      <p className="text-[10px] text-muted-foreground line-through">
                        {formatCurrency(s.baseAmount)}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setOverrideTarget(s)}
                    aria-label="今月だけ変更"
                  >
                    <Settings2 className="size-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {cards.length === 0 && accounts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          先に「クレジットカード」または「口座」を登録してください。
        </div>
      ) : initial.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
          <Receipt className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            支払いがまだ登録されていません
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((g) => {
            const groupKey = g.key;
            const isOpen = !collapsed.has(groupKey);
            return (
            <section key={groupKey} className="space-y-2">
              <button
                type="button"
                onClick={() => toggleCollapsed(groupKey)}
                className="flex w-full items-center gap-3 rounded-md bg-muted/60 px-3 py-2 transition-colors hover:bg-muted"
                aria-expanded={isOpen}
              >
                <ChevronDown
                  className={`size-4 text-muted-foreground transition-transform ${
                    isOpen ? "" : "-rotate-90"
                  }`}
                />
                {g.kind === "account" ? (
                  <Wallet className="size-4 text-muted-foreground" />
                ) : (
                  <CreditCard className="size-4 text-muted-foreground" />
                )}
                <h2 className="text-sm font-bold">{g.name}</h2>
                {g.kind === "account" && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    口座引き落とし
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {g.items.length} 件
                </span>
                <span className="ml-auto text-base font-bold">
                  {formatCurrency(g.total)}
                </span>
              </button>
              {isOpen && (
              <div className="space-y-2">
                {g.items.map((p) => {
                  const status =
                    PAYMENT_STATUSES[p.status as PaymentStatus] ??
                    PAYMENT_STATUSES.unconfirmed;
                  const dateStr =
                    typeof p.usageDate === "string"
                      ? p.usageDate.slice(0, 10)
                      : format(p.usageDate, "yyyy-MM-dd");
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 rounded-lg border bg-card p-3"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: p.categoryColor }}
                          />
                          <p className="text-sm font-medium">
                            {p.categoryName}
                          </p>
                          <Badge variant={status.variant}>{status.label}</Badge>
                          {p.recurringGroupId && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              定期
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {dateStr}
                          {p.memo && <span className="ml-2">{p.memo}</span>}
                        </p>
                      </div>
                      <p className="font-bold">{formatCurrency(p.amount)}</p>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setEditing(p);
                          setFormOpen(true);
                        }}
                        aria-label="編集"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(p)}
                        aria-label="削除"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
              )}
            </section>
            );
          })}
        </div>
      )}

      <PaymentForm
        key={editing?.id ?? "new"}
        payment={editing}
        cards={cards}
        accounts={accounts}
        categories={categories}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={() => router.refresh()}
      />

      {overrideTarget && (
        <SubscriptionOverrideDialog
          open={!!overrideTarget}
          onOpenChange={(open) => !open && setOverrideTarget(null)}
          subscriptionId={overrideTarget.subscriptionId}
          subscriptionName={overrideTarget.name}
          month={overrideTarget.month}
          baseAmount={overrideTarget.baseAmount}
          currentAmount={overrideTarget.amount}
          overridden={overrideTarget.overridden}
          onSuccess={() => router.refresh()}
        />
      )}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteScope("one");
          }
        }}
        title="支払いを削除"
        description={
          deleteTarget?.recurringGroupId ? (
            <div className="space-y-3">
              <p>
                {formatCurrency(deleteTarget?.amount ?? 0)} の支払いは定期支払の一部です。
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={deleteScope === "one" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDeleteScope("one")}
                >
                  この回だけ削除
                </Button>
                <Button
                  type="button"
                  variant={deleteScope === "future" ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setDeleteScope("future")}
                >
                  この回以降すべて削除
                </Button>
              </div>
            </div>
          ) : (
            `${formatCurrency(deleteTarget?.amount ?? 0)} の支払いを削除しますか？`
          )
        }
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

    </div>
  );
}

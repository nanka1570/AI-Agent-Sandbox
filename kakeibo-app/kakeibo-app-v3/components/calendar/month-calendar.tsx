"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
} from "date-fns";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format";
import { addMonthsToMonth } from "@/lib/utils/date";
import { PaymentForm } from "@/components/payments/payment-form";

interface DayPayment {
  id: string;
  amount: number;
  categoryColor: string;
}

interface CalendarData {
  [date: string]: DayPayment[];
}

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

interface MonthCalendarProps {
  month: string;
  data: CalendarData;
  cards: CardOption[];
  accounts: AccountOption[];
  categories: CategoryOption[];
}

export function MonthCalendar({
  month,
  data,
  cards,
  accounts,
  categories,
}: MonthCalendarProps) {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const [year, m] = month.split("-").map(Number);
  const monthStart = startOfMonth(new Date(year, m - 1, 1));
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const today = new Date();

  const changeMonth = (delta: number) => {
    router.push(`/calendar?month=${addMonthsToMonth(month, delta)}`);
  };

  const openQuickAdd = (dateStr: string) => {
    setSelectedDay(dateStr);
    setFormOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {year}年{m}月
        </h2>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => changeMonth(-1)}
            aria-label="前の月"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => changeMonth(1)}
            aria-label="次の月"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border text-xs">
        {["日", "月", "火", "水", "木", "金", "土"].map((d) => (
          <div
            key={d}
            className="bg-card p-2 text-center font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, today);
          const items = data[dateStr] ?? [];
          const total = items.reduce((s, p) => s + p.amount, 0);
          return (
            <button
              key={dateStr}
              onClick={() => openQuickAdd(dateStr)}
              className={`min-h-[72px] bg-card p-1.5 text-left transition-colors hover:bg-accent ${
                !inMonth ? "opacity-40" : ""
              } ${isToday ? "ring-2 ring-inset ring-primary" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs">{format(day, "d")}</span>
                {items.length > 0 && (
                  <Plus className="size-3 text-muted-foreground" />
                )}
              </div>
              {items.length > 0 && (
                <>
                  <div className="mt-1 flex flex-wrap gap-0.5">
                    {items.slice(0, 4).map((it) => (
                      <span
                        key={it.id}
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: it.categoryColor }}
                      />
                    ))}
                  </div>
                  <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                    {formatCurrency(total)}
                  </p>
                </>
              )}
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <PaymentForm
          key={selectedDay}
          cards={cards}
          accounts={accounts}
          categories={categories}
          defaultUsageDate={selectedDay}
          open={formOpen}
          onOpenChange={setFormOpen}
          onSuccess={() => {
            setFormOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

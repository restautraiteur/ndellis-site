import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarDays, Check, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@ui/components/ui/dialog";
import { Button } from "@ui/components/ui/button";
import type { MenuRow } from "@core/domain/menu/api";
import { useCart } from "@/features/cart/cart-context";
import { formatDay, formatPrice, todayISO } from "@core/lib/format";
import { cn } from "@core/lib/utils";

/** Lundi de la semaine d'une date « AAAA-MM-JJ ». */
function mondayOf(day: string) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

const dateParts = (day: string) => {
  const d = new Date(`${day}T00:00:00Z`);
  const fmt = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("fr-FR", { ...o, timeZone: "UTC" }).format(d);
  return {
    weekday: fmt({ weekday: "short" }).replace(".", ""),
    num: d.getUTCDate(),
    month: fmt({ month: "short" }).replace(".", ""),
  };
};

/**
 * « Voir tout le menu » : tous les plats publiés (souvent le mois entier), semaine par semaine et
 * jour par jour, avec choix direct (le panier les classe par jour).
 */
export function MonthMenuDialog({
  rows,
  onPickDay,
}: {
  rows: MenuRow[];
  onPickDay: (day: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { items, add, setQuantity } = useCart();
  const plats = useMemo(() => rows.filter((r) => r.category === "plat"), [rows]);
  const weeks = useMemo(() => {
    const map = new Map<string, Map<string, MenuRow[]>>();
    for (const row of plats) {
      const week = map.get(mondayOf(row.day_date)) ?? new Map<string, MenuRow[]>();
      week.set(row.day_date, [...(week.get(row.day_date) ?? []), row]);
      map.set(mondayOf(row.day_date), week);
    }
    return [...map]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monday, days]) => [monday, [...days].sort(([a], [b]) => a.localeCompare(b))] as const);
  }, [plats]);
  const [week, setWeek] = useState<string | null>(null);
  const currentWeek = weeks.find(([m]) => m === week) ?? weeks[0];
  const chosenDays = new Set(items.filter((i) => i.source === "menu").map((i) => i.day_date));
  const dayCount = weeks.reduce((n, [, days]) => n + days.length, 0);
  const chosenCount = weeks.reduce(
    (n, [, days]) => n + days.filter(([d]) => chosenDays.has(d)).length,
    0,
  );

  if (plats.length === 0 || !currentWeek) return null;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full">
          <CalendarDays className="size-4" /> Voir tout le menu
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[92vh] max-w-5xl flex-col gap-0 overflow-hidden p-0">
        <header className="space-y-4 border-b border-border bg-card px-5 pb-4 pt-6 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3 pr-8">
            <div>
              <DialogTitle className="font-display text-2xl font-bold text-primary sm:text-3xl">
                Tout le menu
              </DialogTitle>
              <DialogDescription className="mt-1">
                Choisissez votre plat pour chaque jour : votre panier les range par date.
              </DialogDescription>
            </div>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
              {chosenCount} / {dayCount} jours choisis
            </span>
          </div>
          {weeks.length > 1 && (
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide">
              {weeks.map(([monday, days]) => {
                const done = days.every(([d]) => chosenDays.has(d));
                return (
                  <button
                    key={monday}
                    type="button"
                    onClick={() => setWeek(monday)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                      monday === currentWeek[0]
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-primary hover:border-primary",
                    )}
                  >
                    {done && <Check className="size-3.5" />}
                    Semaine du {dateParts(monday).num} {dateParts(monday).month}
                  </button>
                );
              })}
            </div>
          )}
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto bg-muted/30 px-5 py-5 sm:px-8">
          {currentWeek[1].map(([day, dayRows]) => {
            const parts = dateParts(day);
            const chosen = chosenDays.has(day);
            return (
              <section
                key={day}
                className={cn(
                  "flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:flex-row",
                  chosen ? "border-accent/50" : "border-border",
                )}
              >
                <button
                  type="button"
                  title={`Voir le ${formatDay(day).toLowerCase()} dans le menu`}
                  onClick={() => {
                    onPickDay(day);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex shrink-0 items-center gap-3 rounded-xl px-3 py-2 text-left sm:w-24 sm:flex-col sm:justify-center sm:gap-0 sm:text-center",
                    chosen ? "bg-accent text-accent-foreground" : "bg-primary/5 text-primary",
                  )}
                >
                  <span className="text-xs font-semibold uppercase tracking-wide opacity-80">
                    {parts.weekday}
                  </span>
                  <span className="font-display text-3xl font-bold leading-none sm:my-1">
                    {parts.num}
                  </span>
                  <span className="text-xs font-medium opacity-80">{parts.month}</span>
                  {day === todayISO() && (
                    <span className="ml-auto text-[10px] font-semibold uppercase sm:ml-0 sm:mt-1">
                      Aujourd'hui
                    </span>
                  )}
                  {chosen && (
                    <Check className="ml-auto size-4 sm:ml-0 sm:mt-1" aria-label="Choisi" />
                  )}
                </button>

                <ul className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {dayRows.map((row) => {
                    const inCart = items.find((i) => i.id === row.day_product_id);
                    const available = row.state === "disponible" && row.stock_left > 0;
                    return (
                      <li
                        key={row.day_product_id}
                        className={cn(
                          "flex gap-3 rounded-xl border p-2.5 transition-colors",
                          inCart ? "border-accent bg-accent/5" : "border-border",
                          !available && "opacity-50",
                        )}
                      >
                        {row.photo_url ? (
                          <img
                            src={row.photo_url}
                            alt=""
                            loading="lazy"
                            className="size-20 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-secondary font-display text-2xl text-muted-foreground">
                            {row.name.slice(0, 1)}
                          </span>
                        )}
                        <div className="flex min-w-0 flex-1 flex-col">
                          {row.dish_category && (
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-accent">
                              {row.dish_category}
                            </span>
                          )}
                          <p className="line-clamp-2 text-sm font-semibold leading-snug first-letter:uppercase">
                            {row.name}
                          </p>
                          <div className="mt-auto flex items-center justify-between gap-2 pt-1.5">
                            <span className="whitespace-nowrap text-sm font-medium text-muted-foreground">
                              {available ? formatPrice(row.price) : "Indisponible"}
                            </span>
                            {inCart ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="size-7 rounded-full"
                                  aria-label="Retirer"
                                  onClick={() =>
                                    setQuantity(row.day_product_id, inCart.quantity - 1)
                                  }
                                >
                                  <Minus className="size-3.5" />
                                </Button>
                                <span className="w-5 text-center text-sm font-semibold">
                                  {inCart.quantity}
                                </span>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="size-7 rounded-full"
                                  aria-label="Ajouter"
                                  disabled={inCart.quantity >= row.stock_left}
                                  onClick={() =>
                                    setQuantity(row.day_product_id, inCart.quantity + 1)
                                  }
                                >
                                  <Plus className="size-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                className="h-8 rounded-full px-4"
                                disabled={!available}
                                onClick={() => {
                                  add({
                                    id: row.day_product_id,
                                    source: "menu",
                                    name: row.name,
                                    category: row.category,
                                    price: row.price,
                                    day_date: row.day_date,
                                  });
                                  toast.success(
                                    `${row.name} choisi pour le ${formatDay(day).toLowerCase()}`,
                                  );
                                }}
                              >
                                Choisir
                              </Button>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-border bg-card px-5 py-3 sm:px-8">
          <span className="text-sm text-muted-foreground">
            {items.filter((i) => i.source === "menu").reduce((n, i) => n + i.quantity, 0)} plat(s)
            dans le panier
          </span>
          <Button asChild size="sm" className="rounded-full">
            <Link to="/commande" onClick={() => setOpen(false)}>
              Voir mon panier
            </Link>
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronLeft, ChevronRight, Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@ui/components/ui/button";
import { Skeleton } from "@ui/components/ui/skeleton";
import { publicMenuQuery, type MenuRow } from "@core/domain/menu/api";
import { formatDay, formatPrice, todayISO } from "@core/lib/format";
import { cn } from "@core/lib/utils";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { CartBar } from "@/features/cart/components/cart-bar";
import { useCart } from "@/features/cart/cart-context";

const WEEKDAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const WEEKDAYS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const iso = (d: Date) => d.toISOString().slice(0, 10);
const monthName = (month: string) =>
  new Intl.DateTimeFormat("fr-FR", { month: "long", timeZone: "UTC" }).format(
    new Date(`${month}-01T00:00:00Z`),
  );

/** Numéro de semaine ISO d'une date « AAAA-MM-JJ ». */
function isoWeek(day: string) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Hachures des jours passés. */
const PAST_BG = {
  backgroundImage:
    "repeating-linear-gradient(135deg, transparent 0 7px, color-mix(in oklab, currentColor 7%, transparent) 7px 8px)",
};

/**
 * « Les menus du mois » : un calendrier mural (une colonne par jour, du lundi au vendredi ; samedi
 * et dimanche seulement s'ils ont un menu). Chaque plat est un « événement » du jour, à choisir.
 * Sur téléphone : vue agenda, semaine par semaine.
 */
export function MonthMenuPage() {
  const { data: rows = [], isLoading } = useQuery(publicMenuQuery());
  const { items } = useCart();
  const today = todayISO();
  const plats = useMemo(() => rows.filter((r) => r.category === "plat"), [rows]);
  const byDay = useMemo(() => {
    const map = new Map<string, MenuRow[]>();
    for (const r of plats) map.set(r.day_date, [...(map.get(r.day_date) ?? []), r]);
    return map;
  }, [plats]);
  const months = useMemo(
    () => [...new Set([today.slice(0, 7), ...plats.map((r) => r.day_date.slice(0, 7))])].sort(),
    [plats, today],
  );
  const [picked, setPicked] = useState<string | null>(null);
  const month =
    picked && months.includes(picked)
      ? picked
      : (months.find((m) => plats.some((r) => r.day_date.startsWith(m))) ?? today.slice(0, 7));
  const monthIndex = months.indexOf(month);

  // Semaines du mois (lundi → dimanche) ; les jours hors du mois restent vides.
  const weeks = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const first = new Date(Date.UTC(y!, m! - 1, 1));
    const last = new Date(Date.UTC(y!, m!, 0));
    const start = new Date(first);
    start.setUTCDate(1 - ((first.getUTCDay() + 6) % 7));
    const out: { week: number; days: (string | null)[] }[] = [];
    for (const d = new Date(start); d <= last;) {
      const days: (string | null)[] = [];
      const monday = iso(d);
      for (let i = 0; i < 7; i++) {
        days.push(d.getUTCMonth() === m! - 1 ? iso(d) : null);
        d.setUTCDate(d.getUTCDate() + 1);
      }
      out.push({ week: isoWeek(monday), days });
    }
    return out;
  }, [month]);
  const columns = [0, 1, 2, 3, 4, 5, 6].filter(
    (c) => c < 5 || weeks.some((w) => w.days[c] && byDay.has(w.days[c]!)),
  );
  const visibleWeeks = weeks.filter((w) => columns.some((c) => w.days[c]));

  const chosenDays = new Set(items.filter((i) => i.source === "menu").map((i) => i.day_date));
  const monthDays = [...byDay.keys()].filter((d) => d.startsWith(month));
  const chosenCount = monthDays.filter((d) => chosenDays.has(d)).length;
  const cartMeals = items.filter((i) => i.source === "menu").reduce((n, i) => n + i.quantity, 0);
  const gridCols = `3rem repeat(${columns.length}, minmax(0, 1fr))`;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader overlay />
      <section className="bg-sidebar text-sidebar-foreground">
        <div className="mx-auto max-w-7xl px-4 pb-24 pt-36 sm:pt-44">
          <p className="text-xs font-bold uppercase tracking-widest text-accent">Menus</p>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Les menus du mois</h1>
          <p className="mt-2 max-w-xl text-sm text-sidebar-foreground/80">
            Tous les plats prévus, jour par jour. Choisissez votre plat pour chaque jour : il
            s'ajoute à votre panier, rangé par date.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-16">
        <div className="relative z-10 -mt-16 overflow-hidden rounded-3xl border border-border bg-card shadow-warm">
          {/* Bandeau du mois, comme un calendrier mural */}
          <header className="relative flex flex-wrap items-center justify-between gap-4 bg-primary px-4 pb-5 pt-6 text-primary-foreground sm:px-6">
            {/* anneaux de reliure */}
            <div aria-hidden="true" className="absolute inset-x-0 top-0 flex justify-around px-16">
              {Array.from({ length: 8 }, (_, i) => (
                <span key={i} className="h-3.5 w-2 rounded-b-full bg-primary-foreground/35" />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Mois précédent"
                disabled={monthIndex <= 0}
                onClick={() => setPicked(months[monthIndex - 1]!)}
                className="flex size-9 items-center justify-center rounded-full bg-primary-foreground/10 transition-colors hover:bg-primary-foreground/20 disabled:opacity-30"
              >
                <ChevronLeft className="size-5" />
              </button>
              <h2 className="flex items-baseline gap-2 font-display">
                <span className="text-3xl font-bold capitalize sm:text-4xl">
                  {monthName(month)}
                </span>
                <span className="text-lg text-primary-foreground/70">{month.slice(0, 4)}</span>
              </h2>
              <button
                type="button"
                aria-label="Mois suivant"
                disabled={monthIndex >= months.length - 1}
                onClick={() => setPicked(months[monthIndex + 1]!)}
                className="flex size-9 items-center justify-center rounded-full bg-primary-foreground/10 transition-colors hover:bg-primary-foreground/20 disabled:opacity-30"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {monthDays.length > 0 && (
                <span className="text-sm text-primary-foreground/80">
                  <strong className="text-primary-foreground">{chosenCount}</strong> /{" "}
                  {monthDays.length} jours choisis
                </span>
              )}
              <Link
                to="/commande"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition-transform hover:scale-105"
              >
                <ShoppingBag className="size-4" /> Mon panier
                {cartMeals > 0 && (
                  <span className="rounded-full bg-accent-foreground/20 px-1.5 text-xs">
                    {cartMeals}
                  </span>
                )}
              </Link>
            </div>
          </header>

          {isLoading ? (
            <div className="grid gap-px bg-border p-px md:grid-cols-5">
              {Array.from({ length: 10 }, (_, i) => (
                <Skeleton key={i} className="h-36 rounded-none" />
              ))}
            </div>
          ) : monthDays.length === 0 ? (
            <div className="p-12 text-center">
              <h2 className="font-display text-xl font-bold">Menu bientôt disponible</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Les menus de ce mois ne sont pas encore publiés. Revenez bientôt !
              </p>
            </div>
          ) : (
            <>
              {/* Grille du calendrier (ordinateur et tablette) */}
              <div className="hidden md:block">
                <div
                  className="grid border-b border-border bg-muted/60"
                  style={{ gridTemplateColumns: gridCols }}
                >
                  <span className="py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Sem.
                  </span>
                  {columns.map((c) => (
                    <span
                      key={c}
                      className="border-l border-border py-2.5 text-center text-xs font-bold uppercase tracking-widest text-primary"
                    >
                      {WEEKDAYS[c]}
                    </span>
                  ))}
                </div>
                {visibleWeeks.map((w) => (
                  <div
                    key={w.week}
                    className="grid border-b border-border last:border-b-0"
                    style={{ gridTemplateColumns: gridCols }}
                  >
                    <span className="flex justify-center pt-3 text-xs font-semibold text-muted-foreground">
                      {w.week}
                    </span>
                    {columns.map((c) => {
                      const day = w.days[c];
                      return day ? (
                        <CalendarCell
                          key={day}
                          day={day}
                          dishes={byDay.get(day) ?? []}
                          today={today}
                          chosen={chosenDays.has(day)}
                        />
                      ) : (
                        <div key={c} className="min-h-32 border-l border-border bg-muted/30" />
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Agenda (téléphone) : jours à venir, semaine par semaine */}
              <div className="md:hidden">
                {visibleWeeks.map((w) => {
                  const days = columns
                    .map((c) => w.days[c])
                    .filter((d): d is string => !!d && d >= today);
                  if (!days.some((d) => byDay.has(d))) return null;
                  return (
                    <section key={w.week}>
                      <h3 className="border-b border-border bg-muted/60 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                        Semaine {w.week} · du {formatDay(days[0]!).toLowerCase()}
                      </h3>
                      {days.map((day) => (
                        <AgendaRow
                          key={day}
                          day={day}
                          dishes={byDay.get(day) ?? []}
                          today={today}
                          chosen={chosenDays.has(day)}
                        />
                      ))}
                    </section>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-accent" /> Plat choisi
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-full border-2 border-accent" /> Aujourd'hui
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm border border-border" style={PAST_BG} /> Jour passé
          </span>
        </p>
      </main>
      <CartBar />
      <SiteFooter />
    </div>
  );
}

function DayNumber({ day, today }: { day: string; today: string }) {
  const isToday = day === today;
  return (
    <span
      className={cn(
        "flex size-8 items-center justify-center rounded-full font-display text-base font-bold",
        isToday
          ? "bg-accent text-accent-foreground"
          : day < today
            ? "text-muted-foreground"
            : "text-primary",
      )}
    >
      {Number(day.slice(8, 10))}
    </span>
  );
}

function CalendarCell({
  day,
  dishes,
  today,
  chosen,
}: {
  day: string;
  dishes: MenuRow[];
  today: string;
  chosen: boolean;
}) {
  const past = day < today;
  return (
    <div
      className={cn(
        "relative min-h-32 border-l border-border p-2 text-muted-foreground",
        day === today && "bg-accent/5",
        chosen && !past && "bg-accent/[0.07]",
      )}
      style={past ? PAST_BG : undefined}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <DayNumber day={day} today={today} />
        {chosen && (
          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase text-accent">
            <Check className="size-3" /> Choisi
          </span>
        )}
      </div>
      {dishes.length > 0 && (
        <ul className="space-y-1.5">
          {dishes.map((row) => (
            <DishEvent key={row.day_product_id} row={row} />
          ))}
        </ul>
      )}
    </div>
  );
}

function AgendaRow({
  day,
  dishes,
  today,
  chosen,
}: {
  day: string;
  dishes: MenuRow[];
  today: string;
  chosen: boolean;
}) {
  const d = new Date(`${day}T00:00:00Z`);
  const isToday = day === today;
  return (
    <div className={cn("flex gap-3 border-b border-border p-3", chosen && "bg-accent/[0.07]")}>
      <div
        className={cn(
          "flex w-14 shrink-0 flex-col items-center rounded-xl border py-1.5",
          isToday ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card",
        )}
      >
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
          {WEEKDAYS_SHORT[(d.getUTCDay() + 6) % 7]}
        </span>
        <span className="font-display text-2xl font-bold leading-tight">{d.getUTCDate()}</span>
        {chosen && <Check className="size-3.5" aria-label="Choisi" />}
      </div>
      <div className="min-w-0 flex-1">
        {dishes.length === 0 ? (
          <p className="pt-3 text-sm text-muted-foreground">Pas de menu ce jour-là</p>
        ) : (
          <ul className="space-y-1.5">
            {dishes.map((row) => (
              <DishEvent key={row.day_product_id} row={row} large />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Un plat présenté comme un événement du calendrier : vignette, nom, prix, choix. */
function DishEvent({ row, large }: { row: MenuRow; large?: boolean }) {
  const { items, add, setQuantity } = useCart();
  const inCart = items.find((i) => i.id === row.day_product_id);
  const available = row.state === "disponible" && row.stock_left > 0;
  const choose = () => {
    add({
      id: row.day_product_id,
      source: "menu",
      name: row.name,
      category: row.category,
      price: row.price,
      day_date: row.day_date,
    });
    toast.success(`${row.name} choisi pour le ${formatDay(row.day_date).toLowerCase()}`);
  };
  return (
    <li
      className={cn(
        "flex items-center gap-2 rounded-lg border-l-4 py-1 pl-1 pr-1.5 text-foreground transition-colors",
        inCart
          ? "border-accent bg-accent text-accent-foreground"
          : available
            ? "border-primary/60 bg-primary/[0.06] hover:bg-primary/10"
            : "border-border bg-muted/60 opacity-60",
      )}
    >
      {row.photo_url ? (
        <img
          src={row.photo_url}
          alt=""
          loading="lazy"
          className={cn("shrink-0 rounded-md object-cover", large ? "size-12" : "size-9")}
        />
      ) : null}
      <div className="min-w-0 flex-1 leading-tight">
        <p
          className={cn(
            "line-clamp-2 break-words font-semibold first-letter:uppercase",
            large ? "text-sm" : "text-[13px]",
          )}
        >
          {row.name}
        </p>
        <p
          className={cn(
            "whitespace-nowrap text-[11px]",
            inCart ? "text-accent-foreground/80" : "text-muted-foreground",
          )}
        >
          {available ? formatPrice(row.price) : row.state === "ferme" ? "Clos" : "Épuisé"}
          {large && row.dish_category ? ` · ${row.dish_category}` : ""}
        </p>
      </div>
      {inCart ? (
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            aria-label={`Retirer ${row.name}`}
            onClick={() => setQuantity(row.day_product_id, inCart.quantity - 1)}
            className="flex size-6 items-center justify-center rounded-full bg-accent-foreground/20 hover:bg-accent-foreground/30"
          >
            <Minus className="size-3" />
          </button>
          <span className="w-4 text-center text-xs font-bold">{inCart.quantity}</span>
          <button
            type="button"
            aria-label={`Ajouter ${row.name}`}
            disabled={inCart.quantity >= row.stock_left}
            onClick={() => setQuantity(row.day_product_id, inCart.quantity + 1)}
            className="flex size-6 items-center justify-center rounded-full bg-accent-foreground/20 hover:bg-accent-foreground/30 disabled:opacity-40"
          >
            <Plus className="size-3" />
          </button>
        </div>
      ) : (
        <Button
          size="icon"
          aria-label={`Choisir ${row.name}`}
          disabled={!available}
          onClick={choose}
          className="size-7 shrink-0 rounded-full"
        >
          <Plus className="size-4" />
        </Button>
      )}
    </li>
  );
}

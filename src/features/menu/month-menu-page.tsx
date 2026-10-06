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

const iso = (d: Date) => d.toISOString().slice(0, 10);
const monthTitle = (month: string) =>
  new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${month}-01T00:00:00Z`),
  );

/**
 * « Les menus du mois » : tous les plats publiés, en calendrier (une colonne par jour, du lundi au
 * vendredi ; samedi et dimanche seulement s'ils ont un menu). Sur téléphone, liste par semaine.
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

  // Semaines du mois (lundi → dimanche), avec les jours du mois uniquement.
  const weeks = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const first = new Date(Date.UTC(y!, m! - 1, 1));
    const last = new Date(Date.UTC(y!, m!, 0));
    const start = new Date(first);
    start.setUTCDate(1 - ((first.getUTCDay() + 6) % 7));
    const out: (string | null)[][] = [];
    for (const d = new Date(start); d <= last;) {
      const week: (string | null)[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(d.getUTCMonth() === m! - 1 ? iso(d) : null);
        d.setUTCDate(d.getUTCDate() + 1);
      }
      out.push(week);
    }
    return out;
  }, [month]);
  // Lundi → vendredi, plus samedi / dimanche s'ils ont un menu ce mois-ci.
  const columns = [0, 1, 2, 3, 4, 5, 6].filter(
    (c) => c < 5 || weeks.some((w) => w[c] && byDay.has(w[c]!)),
  );
  const visibleWeeks = weeks.filter((w) => columns.some((c) => w[c]));

  const chosenDays = new Set(items.filter((i) => i.source === "menu").map((i) => i.day_date));
  const monthDays = [...byDay.keys()].filter((d) => d.startsWith(month));
  const chosenCount = monthDays.filter((d) => chosenDays.has(d)).length;
  const cartMeals = items.filter((i) => i.source === "menu").reduce((n, i) => n + i.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader overlay />
      <section className="relative overflow-hidden bg-sidebar text-sidebar-foreground">
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-36 sm:pt-44">
          <p className="text-xs font-bold uppercase tracking-widest text-accent">Menus</p>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Les menus du mois</h1>
          <p className="mt-2 max-w-xl text-sm text-sidebar-foreground/80">
            Tous les plats prévus, jour par jour. Choisissez votre plat pour chaque jour : il
            s'ajoute à votre panier, rangé par date.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-16">
        {/* Barre du mois */}
        <div className="relative z-10 -mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-card sm:p-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              aria-label="Mois précédent"
              disabled={monthIndex <= 0}
              onClick={() => setPicked(months[monthIndex - 1]!)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <h2 className="min-w-44 text-center font-display text-xl font-bold capitalize text-primary sm:text-2xl">
              {monthTitle(month)}
            </h2>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              aria-label="Mois suivant"
              disabled={monthIndex >= months.length - 1}
              onClick={() => setPicked(months[monthIndex + 1]!)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {monthDays.length > 0 && (
              <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
                {chosenCount} / {monthDays.length} jours choisis
              </span>
            )}
            <Button asChild className="rounded-full">
              <Link to="/commande">
                <ShoppingBag className="size-4" /> Mon panier
                {cartMeals > 0 && (
                  <span className="rounded-full bg-primary-foreground/20 px-1.5 text-xs">
                    {cartMeals}
                  </span>
                )}
              </Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-6 grid gap-3 md:grid-cols-5">
            {Array.from({ length: 10 }, (_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : monthDays.length === 0 ? (
          <div className="surface-card mt-6 p-10 text-center">
            <h2 className="font-display text-xl font-bold">Menu bientôt disponible</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Les menus de ce mois ne sont pas encore publiés. Revenez bientôt !
            </p>
          </div>
        ) : (
          <>
            {/* Calendrier (ordinateur et tablette) */}
            <div className="mt-6 hidden md:block">
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
              >
                {columns.map((c) => (
                  <p
                    key={c}
                    className="text-center text-xs font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    {WEEKDAYS[c]}
                  </p>
                ))}
                {visibleWeeks.flatMap((week, wi) =>
                  columns.map((c) => {
                    const day = week[c];
                    return day ? (
                      <DayCell
                        key={day}
                        day={day}
                        dishes={byDay.get(day) ?? []}
                        today={today}
                        chosen={chosenDays.has(day)}
                      />
                    ) : (
                      <div key={`empty-${wi}-${c}`} />
                    );
                  }),
                )}
              </div>
            </div>

            {/* Liste par semaine (téléphone) */}
            <div className="mt-6 space-y-6 md:hidden">
              {visibleWeeks.map((week, wi) => {
                // Sur téléphone : seulement les jours à venir, et seulement les semaines avec un menu.
                const days = columns
                  .map((c) => week[c])
                  .filter((d): d is string => !!d && d >= today);
                if (!days.some((d) => byDay.has(d))) return null;
                return (
                  <section key={wi} className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Semaine du {formatDay(days[0]!).toLowerCase()}
                    </h3>
                    {days.map((day) => (
                      <DayCell
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
      </main>
      <CartBar />
      <SiteFooter />
    </div>
  );
}

function DayCell({
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
  const empty = dishes.length === 0;
  const num = Number(day.slice(8, 10));
  const label = formatDay(day);
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border bg-card p-2.5 transition-colors",
        empty ? "md:min-h-24" : "min-h-40",
        chosen ? "border-accent ring-1 ring-accent/40" : "border-border",
        (past || empty) && "bg-muted/40",
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
        <span className="flex items-baseline gap-1.5">
          <span
            className={cn(
              "font-display text-2xl font-bold leading-none",
              day === today ? "text-accent" : past ? "text-muted-foreground" : "text-primary",
            )}
          >
            {num}
          </span>
          <span className="text-xs text-muted-foreground md:hidden">{label}</span>
        </span>
        {day === today ? (
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase text-accent-foreground">
            Aujourd'hui
          </span>
        ) : chosen ? (
          <span className="flex size-5 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Check className="size-3" aria-label="Choisi" />
          </span>
        ) : null}
      </div>
      {empty ? (
        <p className="text-xs text-muted-foreground md:m-auto">{past ? "Passé" : "Pas de menu"}</p>
      ) : (
        <ul className="space-y-2">
          {dishes.map((row) => (
            <DishChoice key={row.day_product_id} row={row} />
          ))}
        </ul>
      )}
    </div>
  );
}

function DishChoice({ row }: { row: MenuRow }) {
  const { items, add, setQuantity } = useCart();
  const inCart = items.find((i) => i.id === row.day_product_id);
  const available = row.state === "disponible" && row.stock_left > 0;
  return (
    <li
      className={cn(
        "flex overflow-hidden rounded-xl border transition-colors md:block",
        inCart ? "border-accent bg-accent/5" : "border-border bg-background",
        !available && "opacity-55",
      )}
    >
      {row.photo_url ? (
        <img
          src={row.photo_url}
          alt=""
          loading="lazy"
          className="size-24 shrink-0 object-cover md:aspect-[16/9] md:size-auto md:w-full"
        />
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col justify-center space-y-1 p-2">
        {row.dish_category && (
          <p className="text-[10px] font-semibold uppercase tracking-wide text-accent">
            {row.dish_category}
          </p>
        )}
        <p className="line-clamp-2 text-sm font-semibold leading-snug first-letter:uppercase">
          {row.name}
        </p>
        <div className="flex items-center justify-between gap-1 pt-0.5">
          <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">
            {available ? formatPrice(row.price) : row.state === "ferme" ? "Clos" : "Épuisé"}
          </span>
          {inCart ? (
            <div className="flex items-center gap-0.5">
              <Button
                size="icon"
                variant="outline"
                className="size-6 rounded-full"
                aria-label={`Retirer ${row.name}`}
                onClick={() => setQuantity(row.day_product_id, inCart.quantity - 1)}
              >
                <Minus className="size-3" />
              </Button>
              <span className="w-4 text-center text-xs font-semibold">{inCart.quantity}</span>
              <Button
                size="icon"
                variant="outline"
                className="size-6 rounded-full"
                aria-label={`Ajouter ${row.name}`}
                disabled={inCart.quantity >= row.stock_left}
                onClick={() => setQuantity(row.day_product_id, inCart.quantity + 1)}
              >
                <Plus className="size-3" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className="h-7 rounded-full px-3 text-xs"
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
                  `${row.name} choisi pour le ${formatDay(row.day_date).toLowerCase()}`,
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
}

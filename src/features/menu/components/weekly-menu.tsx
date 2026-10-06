import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@ui/components/ui/tabs";
import { Badge } from "@ui/components/ui/badge";
import { Skeleton } from "@ui/components/ui/skeleton";
import { publicMenuQuery } from "@core/domain/menu/api";
import { formatDay, formatDayShort, todayISO } from "@core/lib/format";
import { ProductSection } from "@/features/menu/components/product-section";
import { SectionPill } from "@/components/section-pill";
import { Link } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";

export function WeeklyMenu() {
  const { data, isLoading } = useQuery(publicMenuQuery());
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const rows = data ?? [];

  const days = useMemo(() => [...new Set(rows.map((r) => r.day_date))].sort(), [rows]);
  const currentDay = activeDay && days.includes(activeDay) ? activeDay : (days[0] ?? null);
  const dayRows = rows.filter((r) => r.day_date === currentDay);
  // Les jus sont vendus via le catalogue permanent (section « Nos jus »), pas par jour.
  const plats = dayRows.filter((r) => r.category === "plat");

  useEffect(() => {
    if (currentDay && scrollRef.current) {
      const btn = dayRefs.current.get(currentDay);
      const bar = scrollRef.current;
      if (btn) {
        // Centre l'onglet du jour dans sa barre seulement : scrollIntoView ferait aussi défiler la
        // page vers le bas à l'ouverture.
        const offset = btn.getBoundingClientRect().left - bar.getBoundingClientRect().left;
        bar.scrollTo({
          left: bar.scrollLeft + offset - bar.clientWidth / 2 + btn.clientWidth / 2,
          behavior: "smooth",
        });
      }
    }
  }, [currentDay]);

  return (
    <div id="menu" className="relative scroll-mt-24 overflow-hidden">
      <main className="relative mx-auto max-w-6xl px-4 py-10">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : days.length === 0 ? (
          <div className="surface-card p-10 text-center">
            <h2 className="font-display text-xl font-bold">Menu bientôt disponible</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Le menu de la semaine sera publié prochainement. Revenez dimanche !
            </p>
          </div>
        ) : (
          <>
            <div className="no-print mb-10">
              <SectionPill>{days.length > 7 ? "Menu du mois" : "Menu de la semaine"}</SectionPill>
              <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                <h2 className="font-display text-4xl font-bold uppercase leading-none tracking-tight text-primary sm:text-6xl">
                  {days.length > 7 ? "Au menu ce mois-ci" : "Au menu cette semaine"}
                </h2>
                <Link
                  to="/menus"
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-semibold text-primary shadow-sm transition-colors hover:border-accent hover:text-accent"
                >
                  <CalendarDays className="size-4" /> Voir tous les menus du mois
                </Link>
              </div>
              <Tabs value={currentDay ?? ""} onValueChange={setActiveDay} className="mt-6">
                <TabsList
                  ref={scrollRef}
                  aria-label="Jours du menu"
                  className="flex h-auto w-full justify-start gap-3 overflow-x-auto rounded-none bg-transparent p-1 scrollbar-hide scroll-smooth"
                >
                  {days.map((day) => {
                    const isToday = day === todayISO();
                    return (
                      <TabsTrigger
                        key={day}
                        ref={(el) => {
                          if (el) dayRefs.current.set(day, el);
                        }}
                        value={day}
                        className="h-11 shrink-0 snap-start rounded-full border border-border bg-card px-6 text-sm font-semibold text-primary shadow-none transition-all hover:border-accent hover:text-accent data-[state=active]:border-accent data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-warm"
                      >
                        <span className="flex items-center gap-2">
                          {formatDayShort(day)}
                          {isToday && (
                            <span className="inline-flex size-2 rounded-full bg-current" />
                          )}
                        </span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-2xl font-bold">
                {currentDay ? formatDay(currentDay) : ""}
              </h2>
              {currentDay && (
                <Badge variant={currentDay === todayISO() ? "default" : "secondary"}>
                  {currentDay === todayISO() ? "Menu du jour" : "Précommande"}
                </Badge>
              )}
            </div>

            <ProductSection title="Les plats" rows={plats} />
          </>
        )}
      </main>
    </div>
  );
}

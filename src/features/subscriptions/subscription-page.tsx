import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarCheck, Check, Search } from "lucide-react";
import { toast } from "sonner";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { CLIENT } from "@/config/client";
import {
  createSubscription,
  lookupSubscriptions,
  plansQuery,
  subscriptionDatesQuery,
  type MySubscription,
} from "@/features/subscriptions/api";
import { Input } from "@ui/components/ui/input";
import { formatDay, formatPrice, parseDate, todayISO, weekdayLabel } from "@core/lib/format";
import { cn } from "@core/lib/utils";

function addDays(iso: string, count: number) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

function DayChip({ iso, className }: { iso: string; className?: string }) {
  return (
    <span
      className={cn(
        "flex w-12 shrink-0 flex-col items-center rounded-xl py-1.5 text-center leading-tight",
        className,
      )}
    >
      <span className="text-[10px] font-semibold uppercase">{weekdayLabel(iso).slice(0, 3)}</span>
      <span className="text-base font-bold">{parseDate(iso).getUTCDate()}</span>
    </span>
  );
}

/** Abonnement « Mangez ici toute la semaine » : souscription et consultation par téléphone. */
export function SubscriptionPage() {
  const [tab, setTab] = useState<"souscrire" | "mon-abonnement">("souscrire");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-28 sm:pt-32">
        <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-warm">
          <div className="relative bg-sidebar px-6 pb-6 pt-7 text-sidebar-foreground sm:px-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-accent/25 blur-3xl"
            />
            <p className="relative text-xs font-bold uppercase tracking-widest text-accent">
              {CLIENT.name}
            </p>
            <h1 className="relative mt-2 font-display text-3xl font-bold sm:text-4xl">
              Mangez ici toute la semaine
            </h1>
            <p className="relative mt-2 max-w-xl text-sm text-sidebar-foreground/80">
              Réservez vos repas d'avance. Votre repas du jour vous est gardé, vous ne commandez
              plus rien.
            </p>
            <div
              role="tablist"
              aria-label="Abonnement"
              className="relative mt-6 grid grid-cols-2 rounded-xl bg-sidebar-foreground/10 p-1"
            >
              {(
                [
                  ["souscrire", "M'abonner"],
                  ["mon-abonnement", "Mon abonnement"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={tab === value}
                  onClick={() => setTab(value)}
                  className={cn(
                    "h-10 rounded-lg text-sm font-semibold transition-colors",
                    tab === value
                      ? "bg-card text-foreground shadow-sm"
                      : "text-sidebar-foreground/80 hover:text-sidebar-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {tab === "souscrire" ? <SubscribeTab /> : <MySubscriptionTab />}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function SubscribeTab() {
  const tomorrow = addDays(todayISO(), 1);
  const { data: plans = [], isLoading } = useQuery(plansQuery());
  const { data: startOptions = [] } = useQuery(subscriptionDatesQuery(tomorrow, 12));
  const [planId, setPlanId] = useState("");
  const [start, setStart] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [done, setDone] = useState<Awaited<ReturnType<typeof createSubscription>> | null>(null);

  useEffect(() => {
    if (!planId && plans[0]) setPlanId(plans[0].id);
  }, [plans, planId]);
  useEffect(() => {
    if (!start && startOptions[0]) setStart(startOptions[0]);
  }, [startOptions, start]);

  const maxCount = Math.max(0, ...plans.map((p) => p.meals_count));
  const { data: allDates = [] } = useQuery(subscriptionDatesQuery(start, maxCount));
  const plan = plans.find((p) => p.id === planId) ?? null;
  const planDates = useMemo(
    () => (plan ? allDates.slice(0, plan.meals_count) : []),
    [allDates, plan],
  );

  const phoneDigits = phone.replace(/\D/g, "");
  const valid = !!plan && !!start && name.trim().length >= 2 && phoneDigits.length >= 7;

  const subscribe = useMutation({
    mutationFn: () =>
      createSubscription({
        planId: plan!.id,
        start,
        name: name.trim(),
        phone,
        address: address.trim(),
      }),
    onSuccess: (result) => setDone(result),
    onError: (error: Error) => toast.error(error.message),
  });

  if (done) {
    return (
      <div className="space-y-5 px-6 py-10 text-center sm:px-8">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Check className="size-7" />
        </span>
        <h2 className="font-display text-2xl font-bold">Votre abonnement est enregistré</h2>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          {done.plan_name} · {formatPrice(done.price)} — du {formatDay(done.start_date)} au{" "}
          {formatDay(done.end_date)}. {CLIENT.name} vous rappelle pour confirmer et encaisser.
          Retrouvez vos repas à tout moment dans « Mon abonnement » avec votre numéro.
        </p>
        <div className="mx-auto flex max-w-xl flex-wrap justify-center gap-2">
          {done.dates.map((d) => (
            <DayChip key={d} iso={d} className="bg-sidebar text-sidebar-foreground" />
          ))}
        </div>
      </div>
    );
  }

  if (!isLoading && plans.length === 0) {
    return (
      <p className="px-6 py-12 text-center text-sm text-muted-foreground sm:px-8">
        Les formules d'abonnement seront bientôt disponibles.
      </p>
    );
  }

  return (
    <>
      <div className="grid gap-8 px-6 py-7 sm:px-8 lg:grid-cols-2">
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            La formule
          </h2>
          <div className="mt-3 space-y-3">
            {plans.map((p) => {
              const selected = p.id === planId;
              const end = allDates[p.meals_count - 1];
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setPlanId(p.id)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-2xl border bg-card p-4 text-left transition-all",
                    selected
                      ? "border-sidebar shadow-warm ring-1 ring-sidebar"
                      : "border-border hover:border-accent/60",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-14 shrink-0 flex-col items-center justify-center rounded-xl",
                      selected ? "bg-sidebar text-sidebar-foreground" : "bg-muted text-foreground",
                    )}
                  >
                    <span className="text-xl font-bold leading-none">{p.meals_count}</span>
                    <span className="text-[10px] font-semibold uppercase">repas</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{p.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {end ? `Jusqu'au ${formatDay(end).toLowerCase()}` : "…"}
                    </span>
                    {p.delivery_included && (
                      <span className="block text-xs font-semibold text-primary">
                        Livraison incluse
                      </span>
                    )}
                  </span>
                  <span className="text-right">
                    <span className="block font-bold">{formatPrice(p.price)}</span>
                    {selected && (
                      <Check className="ml-auto mt-1 size-5 rounded-full bg-sidebar p-0.5 text-sidebar-foreground" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Je commence le
            </h2>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {startOptions.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={d === start}
                  onClick={() => setStart(d)}
                >
                  <DayChip
                    iso={d}
                    className={
                      d === start
                        ? "bg-sidebar text-sidebar-foreground"
                        : "border border-border bg-card hover:border-accent/60"
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          {plan && planDates.length > 0 && (
            <div className="rounded-2xl bg-muted/50 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Vos {plan.meals_count} repas
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {planDates.map((d) => (
                  <DayChip key={d} iso={d} className="bg-sidebar text-sidebar-foreground" />
                ))}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {formatDay(planDates[0]!)}, jusqu'au{" "}
                {formatDay(planDates[planDates.length - 1]!).toLowerCase()}. Les jours fermés sont
                automatiquement reportés.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Vos coordonnées
            </h2>
            <Input placeholder="Votre nom" value={name} onChange={(e) => setName(e.target.value)} />
            <Input
              placeholder="Votre téléphone"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              placeholder="Adresse de livraison (facultatif)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </section>
      </div>

      <div className="flex flex-col gap-3 border-t border-border bg-muted/30 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="text-xs text-muted-foreground">
          Aucun paiement en ligne : {CLIENT.name} vous rappelle pour confirmer et encaisser.
        </p>
        <button
          type="button"
          disabled={!valid || subscribe.isPending}
          onClick={() => subscribe.mutate()}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-sidebar px-6 text-sm font-semibold text-sidebar-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <CalendarCheck className="size-4" />
          {subscribe.isPending
            ? "Enregistrement…"
            : `M'abonner${plan ? ` · ${formatPrice(plan.price)}` : ""}`}
        </button>
      </div>
    </>
  );
}

function MySubscriptionTab() {
  const [phone, setPhone] = useState("");
  const [results, setResults] = useState<MySubscription[] | null>(null);
  const search = useMutation({
    mutationFn: () => lookupSubscriptions(phone),
    onSuccess: setResults,
    onError: (error: Error) => toast.error(error.message),
  });
  const today = todayISO();

  return (
    <div className="px-6 py-8 sm:px-8">
      <p className="mx-auto max-w-md text-center text-sm text-muted-foreground">
        Retrouvez votre abonnement avec le numéro donné en souscrivant : vos jours réservés, ceux
        déjà pris et ce qu'il vous reste.
      </p>
      <form
        className="mx-auto mt-5 flex max-w-md gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (phone.replace(/\D/g, "").length >= 7) search.mutate();
        }}
      >
        <Input
          placeholder="Votre téléphone"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button
          type="submit"
          disabled={phone.replace(/\D/g, "").length < 7 || search.isPending}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-sidebar px-4 text-sm font-semibold text-sidebar-foreground disabled:opacity-50"
        >
          <Search className="size-4" /> Voir
        </button>
      </form>

      {results !== null && results.length === 0 && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Aucun abonnement trouvé pour ce numéro.
        </p>
      )}

      <div className="mt-6 space-y-5">
        {(results ?? []).map((s) => {
          const remaining = s.meals.filter((m) => m.status === "prevu" && m.date >= today).length;
          const taken = s.meals.filter((m) => m.status === "pris").length;
          const next = s.meals.find((m) => m.status === "prevu" && m.date >= today);
          return (
            <article key={s.id} className="rounded-2xl border border-border p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{s.plan_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.customer_name} · du {formatDay(s.start_date)} au {formatDay(s.end_date)}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    s.payment_status === "paye"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800",
                  )}
                >
                  {s.payment_status === "paye" ? "Payé" : "Paiement à confirmer"}
                </span>
              </div>
              <p className="mt-3 text-sm">
                <span className="font-semibold">{remaining}</span> repas restant
                {remaining > 1 ? "s" : ""} · {taken} pris
                {next ? ` · prochain repas ${formatDay(next.date).toLowerCase()}` : ""}
                {remaining === 0 ? " · Tous vos repas ont été pris." : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {s.meals.map((m) => (
                  <DayChip
                    key={m.date}
                    iso={m.date}
                    className={cn(
                      m.status === "pris" && "bg-emerald-600 text-white",
                      m.status === "annule" && "bg-muted text-muted-foreground line-through",
                      m.status === "prevu" &&
                        (m.date < today
                          ? "bg-muted text-muted-foreground"
                          : "bg-sidebar text-sidebar-foreground"),
                    )}
                  />
                ))}
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Foncé : à venir · Vert : pris · Gris : passé ou annulé
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

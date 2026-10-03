import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  CalendarCheck,
  CalendarDays,
  Check,
  ChefHat,
  ChevronDown,
  PhoneCall,
  Search,
  Sparkles,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { CLIENT } from "@/config/client";
import {
  createSubscription,
  lookupSubscriptions,
  plansQuery,
  subscriptionDatesQuery,
  type MySubscription,
  type SubscriptionPlan,
} from "@/features/subscriptions/api";
import fonioCrevettes from "@/assets/fonio-crevettes.jpg";
import platPoisson from "@/assets/plat-senegalais-2.jpg";
import platPoulet from "@/assets/plat-senegalais-5.jpg";
import { Input } from "@ui/components/ui/input";
import { formatDay, formatPrice, parseDate, todayISO } from "@core/lib/format";
import { cn } from "@core/lib/utils";

const SHORT_MONTHS = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

function addDays(iso: string, count: number) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

/** Lundi de la semaine d'une date. */
function mondayOf(iso: string) {
  const day = parseDate(iso).getUTCDay();
  return addDays(iso, day === 0 ? -6 : 1 - day);
}

/** « 5 oct. » */
function shortDay(iso: string) {
  const d = parseDate(iso);
  return `${d.getUTCDate()} ${SHORT_MONTHS[d.getUTCMonth()]}`;
}

function perMeal(plan: SubscriptionPlan) {
  return Math.round(plan.price / plan.meals_count);
}

type Created = Awaited<ReturnType<typeof createSubscription>>;

/** Abonnement repas : formules, calendrier, réservation et suivi par téléphone. */
export function SubscriptionPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Hero />
        <HowItWorks />
        <Builder />
        <Tracking />
        <Faq />
      </main>
      <SiteFooter />
    </div>
  );
}

const PERKS = [
  { icon: ChefHat, label: "Cuisiné le jour même" },
  { icon: Truck, label: "Livraison incluse" },
  { icon: PhoneCall, label: "Réglé par téléphone" },
];

function Hero() {
  return (
    <section className="relative overflow-hidden bg-sidebar text-sidebar-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-10 size-96 rounded-full bg-accent/20 blur-3xl"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-32 sm:pt-36 lg:grid-cols-[1.1fr_1fr] lg:pb-24">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-sidebar-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent">
            <CalendarDays className="size-3.5" /> Abonnement repas
          </p>
          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
            Votre déjeuner de la semaine, <span className="text-accent">réglé d'avance.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base text-sidebar-foreground/75">
            Choisissez un nombre de repas et un jour de départ. Chaque jour ouvré, le plat du jour
            de {CLIENT.name} est mis de côté pour vous et livré, sans rien recommander.
          </p>
          <ul className="mt-7 flex flex-wrap gap-2 text-sm">
            {PERKS.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-sidebar-foreground/15 px-3 py-1.5"
              >
                <Icon className="size-4 text-accent" /> {label}
              </li>
            ))}
          </ul>
          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="#formules"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground transition-transform hover:scale-105"
            >
              Composer mon abonnement <ArrowDown className="size-4" />
            </a>
            <a
              href="#suivi"
              className="inline-flex h-12 items-center rounded-full border border-sidebar-foreground/25 px-6 text-sm font-semibold hover:bg-sidebar-foreground/10"
            >
              Je suis déjà abonné
            </a>
          </div>
        </div>

        <div className="relative mx-auto hidden h-[440px] w-full max-w-md sm:block">
          <img
            src={fonioCrevettes}
            alt="Barquettes de fonio aux crevettes"
            className="absolute left-0 top-6 h-80 w-60 -rotate-[5deg] rounded-[2rem] object-cover shadow-2xl ring-4 ring-sidebar-foreground/10"
          />
          <img
            src={platPoisson}
            alt="Barquettes de poisson, riz et alloco"
            loading="lazy"
            className="absolute right-0 top-0 h-56 w-44 rotate-[6deg] rounded-[2rem] object-cover shadow-2xl ring-4 ring-sidebar-foreground/10"
          />
          <img
            src={platPoulet}
            alt="Barquettes de poulet grillé et crudités"
            loading="lazy"
            className="absolute bottom-0 right-6 h-52 w-48 -rotate-[2deg] rounded-[2rem] object-cover shadow-2xl ring-4 ring-sidebar-foreground/10"
          />
          <div className="absolute bottom-10 left-6 flex items-center gap-3 rounded-2xl bg-card px-4 py-3 text-foreground shadow-xl">
            <span className="flex size-10 items-center justify-center rounded-full bg-accent/15 text-accent">
              <UtensilsCrossed className="size-5" />
            </span>
            <span className="text-sm leading-tight">
              <span className="block font-bold">Lundi → vendredi</span>
              <span className="text-xs text-muted-foreground">un plat chaud chaque midi</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    icon: UtensilsCrossed,
    title: "Choisissez votre formule",
    text: "De quelques jours à un mois complet, selon votre rythme.",
  },
  {
    icon: CalendarDays,
    title: "Fixez le jour de départ",
    text: "Le calendrier montre aussitôt vos jours de repas. Les jours de fermeture sont reportés.",
  },
  {
    icon: PhoneCall,
    title: "On vous appelle",
    text: "Nous confirmons avec vous et vous réglez à ce moment-là. Ensuite, il n'y a plus qu'à manger.",
  },
];

function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-center font-display text-3xl font-bold">Comment ça marche</h2>
      <ol className="mt-10 grid gap-6 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="relative rounded-3xl border border-border bg-card p-6">
            <span className="absolute right-5 top-4 font-display text-5xl font-bold text-accent/15">
              {i + 1}
            </span>
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <step.icon className="size-5" />
            </span>
            <h3 className="mt-4 font-semibold">{step.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function StepTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-3 font-display text-xl font-bold">
      <span className="flex size-8 items-center justify-center rounded-full bg-accent text-sm text-accent-foreground">
        {n}
      </span>
      {children}
    </h3>
  );
}

function Builder() {
  const tomorrow = addDays(todayISO(), 1);
  const { data: plans = [], isLoading } = useQuery(plansQuery());
  const { data: startOptions = [] } = useQuery(subscriptionDatesQuery(tomorrow, 10));
  const [planId, setPlanId] = useState("");
  const [start, setStart] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [done, setDone] = useState<Created | null>(null);

  useEffect(() => {
    if (!planId && plans[0]) setPlanId(plans[0].id);
  }, [plans, planId]);
  useEffect(() => {
    if (!start && startOptions[0]) setStart(startOptions[0]);
  }, [startOptions, start]);

  const plan = plans.find((p) => p.id === planId) ?? null;
  const { data: planDates = [] } = useQuery(subscriptionDatesQuery(start, plan?.meals_count ?? 0));
  const bestValueId = useMemo(() => {
    if (plans.length < 2) return null;
    return plans.reduce((best, p) => (perMeal(p) < perMeal(best) ? p : best)).id;
  }, [plans]);

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

  return (
    <section id="formules" className="scroll-mt-24 bg-cream py-16">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-xs font-bold uppercase tracking-widest text-accent">Votre abonnement</p>
        <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
          Composez-le en trois étapes
        </h2>

        {done ? (
          <Confirmation
            result={done}
            onAgain={() => {
              setDone(null);
              setName("");
              setPhone("");
              setAddress("");
            }}
          />
        ) : !isLoading && plans.length === 0 ? (
          <p className="mt-10 rounded-3xl bg-card p-10 text-center text-muted-foreground">
            Les formules d'abonnement arrivent très bientôt.
          </p>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
            <div className="min-w-0 space-y-10">
              <div>
                <StepTitle n={1}>Combien de repas ?</StepTitle>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {plans.map((p) => {
                    const selected = p.id === planId;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setPlanId(p.id)}
                        className={cn(
                          "relative flex flex-col rounded-3xl border-2 bg-card p-5 text-left transition-all",
                          selected
                            ? "border-accent shadow-warm"
                            : "border-transparent hover:border-accent/40",
                        )}
                      >
                        {p.id === bestValueId && (
                          <span className="absolute -top-3 left-5 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
                            <Sparkles className="size-3" /> Meilleur prix par repas
                          </span>
                        )}
                        <span className="flex items-baseline gap-1.5">
                          <span className="font-display text-4xl font-bold">{p.meals_count}</span>
                          <span className="text-sm text-muted-foreground">repas</span>
                        </span>
                        <span className="mt-1 text-sm font-semibold">{p.name}</span>
                        <span className="mt-4 text-lg font-bold">{formatPrice(p.price)}</span>
                        <span className="text-xs text-muted-foreground">
                          soit {formatPrice(perMeal(p))} le repas
                          {p.delivery_included ? ", livré" : ""}
                        </span>
                        {selected && (
                          <Check className="absolute right-4 top-4 size-6 rounded-full bg-accent p-1 text-accent-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <StepTitle n={2}>À partir de quand ?</StepTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  Touchez un jour pour démarrer : vos jours de repas s'allument dans le calendrier.
                </p>
                <MealCalendar
                  startOptions={startOptions}
                  start={start}
                  onStart={setStart}
                  mealDates={planDates}
                />
              </div>

              <div>
                <StepTitle n={3}>Vos coordonnées</StepTitle>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Input
                    className="h-12 bg-card"
                    placeholder="Nom et prénom"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <Input
                    className="h-12 bg-card"
                    placeholder="Téléphone (pour vous rappeler)"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <Input
                    className="h-12 bg-card sm:col-span-2"
                    placeholder="Adresse de livraison : quartier, rue, repère (facultatif)"
                    autoComplete="street-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-3xl bg-sidebar p-6 text-sidebar-foreground shadow-warm">
                <p className="text-xs font-bold uppercase tracking-widest text-accent">
                  Récapitulatif
                </p>
                {plan ? (
                  <>
                    <p className="mt-3 font-display text-2xl font-bold">{plan.name}</p>
                    <dl className="mt-4 space-y-2 text-sm">
                      <Row label="Repas">{plan.meals_count}</Row>
                      <Row label="Premier repas">{start ? formatDay(start) : "—"}</Row>
                      <Row label="Dernier repas">
                        {planDates.length ? formatDay(planDates[planDates.length - 1]!) : "—"}
                      </Row>
                      <Row label="Livraison">{plan.delivery_included ? "Incluse" : "En sus"}</Row>
                      <Row label="Prix par repas">{formatPrice(perMeal(plan))}</Row>
                    </dl>
                    <div className="mt-5 flex items-baseline justify-between gap-3 border-t border-sidebar-foreground/15 pt-4">
                      <span className="text-sm">Total</span>
                      <span className="font-display text-2xl font-bold">
                        {formatPrice(plan.price)}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-sidebar-foreground/70">Choisissez une formule.</p>
                )}
                <button
                  type="button"
                  disabled={!valid || subscribe.isPending}
                  onClick={() => subscribe.mutate()}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  <CalendarCheck className="size-4" />
                  {subscribe.isPending ? "Réservation…" : "Réserver mes repas"}
                </button>
                <p className="mt-3 text-center text-xs text-sidebar-foreground/60">
                  {valid
                    ? "Rien à payer maintenant : nous vous appelons pour confirmer."
                    : "Indiquez votre nom et votre téléphone pour réserver."}
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-sidebar-foreground/60">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

/**
 * Calendrier du lundi au vendredi : jours de départ possibles, jours de repas et jours fermés
 * (un jour ouvré sans repas au milieu de l'abonnement est un jour de fermeture, reporté à la fin).
 */
function MealCalendar({
  startOptions,
  start,
  onStart,
  mealDates,
}: {
  startOptions: string[];
  start: string;
  onStart: (iso: string) => void;
  mealDates: string[];
}) {
  const first = startOptions[0];
  const end = mealDates[mealDates.length - 1];
  const last = [end, startOptions[startOptions.length - 1]].filter(Boolean).sort().pop();
  if (!first || !last) return <div className="mt-4 h-48 animate-pulse rounded-3xl bg-card" />;

  const meals = new Set(mealDates);
  const options = new Set(startOptions);
  const weeks: string[][] = [];
  for (let monday = mondayOf(first); monday <= last; monday = addDays(monday, 7)) {
    weeks.push([0, 1, 2, 3, 4].map((i) => addDays(monday, i)));
  }

  return (
    <div className="mt-4 rounded-3xl bg-card p-4 sm:p-5">
      <div className="grid grid-cols-5 gap-1.5 text-center text-[11px] font-semibold uppercase text-muted-foreground sm:gap-2">
        {["Lun", "Mar", "Mer", "Jeu", "Ven"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="mt-2 space-y-1.5 sm:space-y-2">
        {weeks.map((week) => (
          <div key={week[0]} className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {week.map((iso) => {
              const date = parseDate(iso);
              const isMeal = meals.has(iso);
              const closed = !!end && iso > start && iso < end && !isMeal;
              const selectable = options.has(iso);
              const showMonth = date.getUTCDate() === 1 || iso === weeks[0]![0];
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={!selectable}
                  aria-pressed={iso === start}
                  onClick={() => onStart(iso)}
                  title={closed ? "Fermé : repas reporté" : formatDay(iso)}
                  className={cn(
                    "flex h-12 flex-col items-center justify-center rounded-xl text-sm transition-colors sm:h-14",
                    isMeal
                      ? "bg-accent font-bold text-accent-foreground"
                      : closed
                        ? "bg-muted text-muted-foreground line-through"
                        : selectable
                          ? "border border-border hover:border-accent"
                          : "text-muted-foreground/40",
                    iso === start && "ring-2 ring-primary ring-offset-2 ring-offset-card",
                    !selectable && "cursor-default",
                  )}
                >
                  {showMonth && (
                    <span className="text-[9px] font-semibold uppercase leading-none opacity-70">
                      {SHORT_MONTHS[date.getUTCMonth()]}
                    </span>
                  )}
                  <span>{date.getUTCDate()}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <Legend className="bg-accent" label="Jour de repas" />
        <Legend className="ring-2 ring-primary" label="Départ" />
        <Legend className="bg-muted" label="Fermé, reporté" />
        {end && (
          <span className="font-medium text-foreground sm:ml-auto">
            {mealDates.length} repas, du {shortDay(mealDates[0]!)} au {shortDay(end)}
          </span>
        )}
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-3 rounded", className)} /> {label}
    </span>
  );
}

function Confirmation({ result, onAgain }: { result: Created; onAgain: () => void }) {
  return (
    <div className="mt-10 rounded-3xl bg-card p-8 text-center shadow-warm sm:p-12">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
        <Check className="size-8" />
      </span>
      <h3 className="mt-5 font-display text-3xl font-bold">C'est réservé, merci !</h3>
      <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
        {result.plan_name} · {formatPrice(result.price)}, du {formatDay(result.start_date)} au{" "}
        {formatDay(result.end_date).toLowerCase()}. {CLIENT.name} vous appelle très vite pour
        confirmer et régler.
      </p>
      <div className="mx-auto mt-6 flex max-w-2xl flex-wrap justify-center gap-1.5">
        {result.dates.map((d) => (
          <span
            key={d}
            className="rounded-lg bg-accent/15 px-2 py-1 text-xs font-semibold text-accent"
          >
            {shortDay(d)}
          </span>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a
          href="#suivi"
          className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
        >
          Suivre mes repas
        </a>
        <button
          type="button"
          onClick={onAgain}
          className="inline-flex h-11 items-center rounded-full border border-border px-5 text-sm font-semibold hover:bg-muted"
        >
          Abonner un proche
        </button>
      </div>
    </div>
  );
}

function Tracking() {
  const [phone, setPhone] = useState("");
  const [results, setResults] = useState<MySubscription[] | null>(null);
  const search = useMutation({
    mutationFn: () => lookupSubscriptions(phone),
    onSuccess: setResults,
    onError: (error: Error) => toast.error(error.message),
  });
  const today = todayISO();
  const canSearch = phone.replace(/\D/g, "").length >= 7;

  return (
    <section id="suivi" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-16">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-accent">Déjà abonné ?</p>
        <h2 className="mt-2 font-display text-3xl font-bold">Suivez vos repas</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Entrez le numéro donné à la réservation pour voir vos repas restants et votre prochain
          jour de livraison.
        </p>
      </div>
      <form
        className="mx-auto mt-6 flex max-w-md gap-2 rounded-full border border-border bg-card p-1.5 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSearch) search.mutate();
        }}
      >
        <Input
          className="h-11 min-w-0 border-0 bg-transparent shadow-none focus-visible:ring-0"
          placeholder="Votre numéro de téléphone"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button
          type="submit"
          disabled={!canSearch || search.isPending}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          <Search className="size-4" /> <span className="hidden sm:inline">Rechercher</span>
        </button>
      </form>

      {results !== null && results.length === 0 && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Aucun abonnement trouvé pour ce numéro. Vérifiez qu'il s'agit bien de celui donné à la
          réservation.
        </p>
      )}

      <div className="mt-8 space-y-5">
        {(results ?? []).map((s) => (
          <SubscriptionCard key={s.id} sub={s} today={today} />
        ))}
      </div>
    </section>
  );
}

function SubscriptionCard({ sub, today }: { sub: MySubscription; today: string }) {
  const active = sub.meals.filter((m) => m.status !== "annule");
  const taken = active.filter((m) => m.status === "pris").length;
  const remaining = active.filter((m) => m.status === "prevu" && m.date >= today).length;
  const next = active.find((m) => m.status === "prevu" && m.date >= today);
  const progress = active.length ? Math.round((taken / active.length) * 100) : 0;
  const cancelled = sub.status === "annulee";

  return (
    <article className="rounded-3xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-xl font-bold">{sub.plan_name}</p>
          <p className="text-sm text-muted-foreground">
            {sub.customer_name} · {shortDay(sub.start_date)} → {shortDay(sub.end_date)}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            cancelled
              ? "bg-muted text-muted-foreground"
              : sub.payment_status === "paye"
                ? "bg-success/15 text-success"
                : "bg-amber-100 text-amber-800",
          )}
        >
          {cancelled
            ? "Annulé"
            : sub.payment_status === "paye"
              ? "Réglé"
              : "En attente de notre appel"}
        </span>
      </div>

      <div className="mt-5">
        <div className="flex justify-between text-sm">
          <span>
            <strong>{taken}</strong> repas servi{taken > 1 ? "s" : ""} sur {active.length}
          </span>
          <span className="text-muted-foreground">
            {remaining} restant{remaining > 1 ? "s" : ""}
          </span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {next ? (
        <p className="mt-4 rounded-2xl bg-accent/10 px-4 py-3 text-sm">
          Prochain repas : <strong>{formatDay(next.date)}</strong>
        </p>
      ) : (
        !cancelled && (
          <p className="mt-4 rounded-2xl bg-success/10 px-4 py-3 text-sm">
            Tous vos repas ont été servis. Envie de continuer ?{" "}
            <a href="#formules" className="font-semibold underline">
              Réabonnez-vous
            </a>
          </p>
        )
      )}

      <div className="mt-4 flex flex-wrap gap-1.5">
        {sub.meals.map((m) => (
          <span
            key={m.date}
            title={formatDay(m.date)}
            className={cn(
              "rounded-lg px-2 py-1 text-xs font-semibold",
              m.status === "pris" && "bg-success/15 text-success",
              m.status === "annule" && "bg-muted text-muted-foreground line-through",
              m.status === "prevu" &&
                (m.date < today ? "bg-muted text-muted-foreground" : "bg-accent/15 text-accent"),
            )}
          >
            {shortDay(m.date)}
          </span>
        ))}
      </div>
    </article>
  );
}

function Faq() {
  const items = [
    [
      "Que se passe-t-il si vous êtes fermés un jour ?",
      "Le repas n'est pas perdu : il est reporté au jour ouvré suivant, et la fin de l'abonnement recule d'autant.",
    ],
    [
      "Comment se passe le paiement ?",
      `Rien n'est payé sur le site. Après votre réservation, ${CLIENT.name} vous appelle pour confirmer et convenir du règlement.`,
    ],
    [
      "Quel plat vais-je recevoir ?",
      "Le plat du jour, cuisiné le matin même. Le menu change d'un jour à l'autre.",
    ],
    [
      "Puis-je abonner un collègue ou un proche ?",
      "Oui : faites une nouvelle réservation à son nom, avec son numéro de téléphone.",
    ],
  ] as const;
  return (
    <section className="bg-cream py-16">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="text-center font-display text-3xl font-bold">Questions fréquentes</h2>
        <div className="mt-8 space-y-3">
          {items.map(([q, a]) => (
            <details key={q} className="group rounded-2xl bg-card px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                {q}
                <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

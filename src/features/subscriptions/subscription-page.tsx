import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  CalendarCheck,
  CalendarDays,
  Check,
  ChefHat,
  ChevronDown,
  CreditCard,
  KeyRound,
  PhoneCall,
  Search,
  Sparkles,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { CLIENT } from "@/config/client";
import {
  createSubscription,
  lookupSubscriptions,
  plansQuery,
  subscriptionDatesQuery,
  type MySubscription,
  type PaymentChoice,
  type PaymentMode,
  type SubscriptionPlan,
} from "@/features/subscriptions/api";
import { checkPayment, startSubscriptionPayment } from "@/features/payment/paydunya.functions";
import fonioCrevettes from "@/assets/fonio-crevettes.jpg";
import platPoisson from "@/assets/plat-senegalais-2.jpg";
import platPoulet from "@/assets/plat-senegalais-5.jpg";
import fondComposer from "@/assets/fond-composer-abonnement.jpg";
import suiviRepas from "@/assets/suivi-repas.webp";
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

/** Dernier abonnement créé sur cet appareil : réaffiché (avec le code) au retour du paiement en ligne. */
const LAST_KEY = "traiteur.last_subscription";
function saveLast(created: Created) {
  try {
    window.sessionStorage.setItem(LAST_KEY, JSON.stringify(created));
  } catch {
    /* navigation privée */
  }
}
function loadLast(): Created | null {
  try {
    const raw = window.sessionStorage.getItem(LAST_KEY);
    return raw ? (JSON.parse(raw) as Created) : null;
  } catch {
    return null;
  }
}

function halfPrice(price: number) {
  return Math.ceil(price / 2);
}

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
  { icon: CreditCard, label: "Payé en une ou deux fois" },
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
            Achetez vos repas d'avance. Chaque midi de la semaine, choisissez votre plat chez{" "}
            {CLIENT.name} avec votre numéro et votre code abonné : il est compté sur votre
            abonnement, rien à payer.
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

        <HeroCollage />
      </div>
    </section>
  );
}

const STEPS = [
  {
    icon: UtensilsCrossed,
    title: "Choisissez votre formule",
    text: "De quelques jours à un mois complet, selon votre rythme, et votre jour de départ.",
  },
  {
    icon: CreditCard,
    title: "Réglez comme vous voulez",
    text: "En entier ou la moitié d'abord, en ligne ou quand nous vous appelons.",
  },
  {
    icon: KeyRound,
    title: "Recevez votre code",
    text: "Un code à 4 chiffres, rien qu'à vous : avec votre numéro, il vous fait reconnaître.",
  },
  {
    icon: ChefHat,
    title: "Commandez chaque midi",
    text: "Choisissez le plat du jour qui vous tente, entrez votre code : rien à payer. Un jour sauté est reporté.",
  },
];

/**
 * Composition du haut de page : photo principale en arche sur un disque orangé, deux photos rondes
 * qui la chevauchent, motif de points et deux étiquettes.
 */
function HeroCollage() {
  return (
    <div className="relative mx-auto h-[420px] w-full max-w-[24rem] sm:h-[520px] sm:max-w-lg">
      <div
        aria-hidden="true"
        className="absolute right-0 top-4 h-40 w-40 opacity-25"
        style={{
          backgroundImage: "radial-gradient(currentColor 1.5px, transparent 1.5px)",
          backgroundSize: "16px 16px",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 aspect-square w-[92%] -translate-x-1/2 -translate-y-1/2"
      >
        <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle_at_35%_30%,#f6a26b,var(--accent)_60%,#a8431b)] opacity-90" />
      </div>

      {/* photo principale en arche */}
      <img
        src={fonioCrevettes}
        alt="Barquettes de fonio aux crevettes"
        className="absolute left-1/2 top-1/2 h-[84%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-b-[2rem] rounded-t-full object-cover shadow-2xl ring-[6px] ring-sidebar"
      />
      {/* photos rondes qui chevauchent l'arche */}
      <img
        src={platPoisson}
        alt="Barquettes de poisson, riz et alloco"
        loading="lazy"
        className="absolute left-0 top-[12%] size-32 rounded-full object-cover shadow-xl ring-[5px] ring-sidebar sm:size-44"
      />
      <img
        src={platPoulet}
        alt="Barquettes de poulet grillé et crudités"
        loading="lazy"
        className="absolute bottom-[8%] right-0 size-32 rounded-full object-cover shadow-xl ring-[5px] ring-sidebar sm:size-44"
      />

      <div className="deco-float absolute bottom-2 left-0 flex items-center gap-3 rounded-2xl bg-card px-4 py-3 text-foreground shadow-xl sm:bottom-6">
        <span className="flex size-10 items-center justify-center rounded-full bg-accent/15 text-accent">
          <UtensilsCrossed className="size-5" />
        </span>
        <span className="text-sm leading-tight">
          <span className="block font-bold">Lundi → vendredi</span>
          <span className="text-xs text-muted-foreground">un plat chaud chaque midi</span>
        </span>
      </div>
      <div className="absolute right-2 top-0 flex items-center gap-2 rounded-full bg-card py-1.5 pl-1.5 pr-3 text-xs font-semibold text-foreground shadow-xl sm:right-6">
        <span className="flex size-7 items-center justify-center rounded-full bg-success text-white">
          <Truck className="size-3.5" />
        </span>
        Livré chaque midi
      </div>
    </div>
  );
}

function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-center font-display text-3xl font-bold">Comment ça marche</h2>
      <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>("total");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("en_ligne");
  const [done, setDone] = useState<Created | null>(null);
  const [payStatus, setPayStatus] = useState<string | null>(null);
  const payOnline = useServerFn(startSubscriptionPayment);
  const check = useServerFn(checkPayment);

  // Retour de PayDunya : on réaffiche l'abonnement créé (et son code) avec l'état du paiement.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const cancelled = params.get("paiement") === "annule";
    if (!token && !cancelled) return;
    const last = loadLast();
    if (last) setDone(last);
    if (cancelled) {
      setPayStatus("cancelled");
      return;
    }
    setPayStatus("checking");
    check({ data: { token: token! } })
      .then((r) => setPayStatus(r.status))
      .catch(() => setPayStatus("unknown"));
  }, [check]);

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
        paymentChoice,
        paymentMode,
      }),
    onSuccess: async (result) => {
      saveLast(result);
      if (result.payment_mode === "en_ligne") {
        try {
          const { url } = await payOnline({ data: { subscriptionId: result.id, pin: result.pin } });
          if (url.startsWith("https://app.paydunya.com/")) {
            window.location.href = url;
            return;
          }
        } catch (error) {
          toast.error((error as Error).message);
        }
        setPayStatus("failed");
      }
      setDone(result);
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const dueNow = plan ? (paymentChoice === "moitie" ? halfPrice(plan.price) : plan.price) : 0;

  return (
    <section
      id="formules"
      className="relative scroll-mt-24 overflow-hidden bg-sidebar py-16 text-sidebar-foreground"
    >
      {/* Photo de plats en fond sous un voile brun : les cartes claires ressortent, le texte reste lisible */}
      <img
        src={fondComposer}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="pointer-events-none absolute inset-0 size-full select-none object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-sidebar/95 via-sidebar/85 to-sidebar/95"
      />
      <div className="relative mx-auto max-w-6xl px-4">
        <p className="text-xs font-bold uppercase tracking-widest text-accent">Votre abonnement</p>
        <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
          Composez-le en quatre étapes
        </h2>

        {done ? (
          <Confirmation
            result={done}
            payStatus={payStatus}
            onAgain={() => {
              setDone(null);
              setPayStatus(null);
              setName("");
              setPhone("");
              setAddress("");
            }}
          />
        ) : !isLoading && plans.length === 0 ? (
          <p className="mt-10 rounded-3xl bg-card p-10 text-center text-muted-foreground shadow-warm">
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
                          "relative flex flex-col rounded-3xl border-2 bg-card p-5 text-left text-foreground transition-all",
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
                <p className="mt-2 text-sm text-sidebar-foreground/75">
                  Touchez un jour pour démarrer. Le calendrier montre vos repas si vous mangez
                  chaque jour ouvré ; un jour sans commande est simplement reporté.
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
                    className="h-12 bg-card text-foreground"
                    placeholder="Nom et prénom"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <Input
                    className="h-12 bg-card text-foreground"
                    placeholder="Téléphone (pour vous rappeler)"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <Input
                    className="h-12 bg-card text-foreground sm:col-span-2"
                    placeholder="Adresse de livraison : quartier, rue, repère (facultatif)"
                    autoComplete="street-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <StepTitle n={4}>Le règlement</StepTitle>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Choice
                    selected={paymentChoice === "total"}
                    onClick={() => setPaymentChoice("total")}
                    title="En une fois"
                    text={plan ? formatPrice(plan.price) : ""}
                  />
                  <Choice
                    selected={paymentChoice === "moitie"}
                    onClick={() => setPaymentChoice("moitie")}
                    title="La moitié maintenant"
                    text={
                      plan
                        ? `${formatPrice(halfPrice(plan.price))}, le reste avant votre dernier repas`
                        : ""
                    }
                  />
                  <Choice
                    selected={paymentMode === "en_ligne"}
                    onClick={() => setPaymentMode("en_ligne")}
                    icon={CreditCard}
                    title="Payer en ligne"
                    text="Wave, Orange Money, Free Money ou carte. Abonnement confirmé tout de suite."
                  />
                  <Choice
                    selected={paymentMode === "telephone"}
                    onClick={() => setPaymentMode("telephone")}
                    icon={PhoneCall}
                    title="Être appelé"
                    text={`${CLIENT.name} vous appelle pour confirmer et encaisser.`}
                  />
                </div>
              </div>
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-3xl bg-sidebar/90 p-6 text-sidebar-foreground shadow-warm ring-1 ring-sidebar-foreground/15 backdrop-blur-md">
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
                      <Row label="Règlement">
                        {paymentChoice === "moitie" ? "En deux fois" : "En une fois"}
                      </Row>
                    </dl>
                    <div className="mt-5 flex items-baseline justify-between gap-3 border-t border-sidebar-foreground/15 pt-4">
                      <span className="text-sm">Total</span>
                      <span className="font-display text-2xl font-bold">
                        {formatPrice(plan.price)}
                      </span>
                    </div>
                    {paymentChoice === "moitie" && (
                      <div className="mt-1 flex justify-between gap-3 text-sm text-sidebar-foreground/70">
                        <span>{paymentMode === "en_ligne" ? "Maintenant" : "À l'appel"}</span>
                        <span className="font-semibold text-sidebar-foreground">
                          {formatPrice(dueNow)}
                        </span>
                      </div>
                    )}
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
                  {subscribe.isPending
                    ? "Un instant…"
                    : paymentMode === "en_ligne" && plan
                      ? `Payer ${formatPrice(dueNow)}`
                      : "Réserver mes repas"}
                </button>
                <p className="mt-3 text-center text-xs text-sidebar-foreground/60">
                  {!valid
                    ? "Indiquez votre nom et votre téléphone pour réserver."
                    : paymentMode === "en_ligne"
                      ? "Paiement sécurisé par PayDunya. Votre code abonné s'affiche au retour."
                      : "Rien à payer maintenant : nous vous appelons pour confirmer."}
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}

function Choice({
  selected,
  onClick,
  title,
  text,
  icon: Icon,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  text: string;
  icon?: typeof CreditCard;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-2xl border-2 bg-card p-4 text-left text-foreground transition-colors",
        selected ? "border-accent" : "border-transparent hover:border-accent/40",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2",
          selected ? "border-accent bg-accent text-accent-foreground" : "border-border",
        )}
      >
        {selected && <Check className="size-3" />}
      </span>
      <span>
        <span className="flex items-center gap-1.5 font-semibold">
          {Icon && <Icon className="size-4 text-accent" />} {title}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{text}</span>
      </span>
    </button>
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
    <div className="mt-4 rounded-3xl bg-card p-4 text-foreground sm:p-5">
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
        <Legend className="bg-accent" label="Repas (si vous mangez chaque jour)" />
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

function Confirmation({
  result,
  payStatus,
  onAgain,
}: {
  result: Created;
  payStatus: string | null;
  onAgain: () => void;
}) {
  const online = result.payment_mode === "en_ligne";
  const paid = payStatus === "completed";
  const payFailed =
    online && !!payStatus && !["completed", "checking", "pending"].includes(payStatus);
  return (
    <div className="mt-10 rounded-3xl bg-card p-8 text-center text-foreground shadow-warm sm:p-12">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
        <Check className="size-8" />
      </span>
      <h3 className="mt-5 font-display text-3xl font-bold">
        {paid ? "Paiement reçu, bienvenue !" : "C'est réservé, merci !"}
      </h3>
      <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
        {result.plan_name} · {result.meals_count} repas · {formatPrice(result.price)}, à partir du{" "}
        {formatDay(result.start_date).toLowerCase()}.
      </p>

      {online && payStatus && (
        <p
          className={cn(
            "mx-auto mt-4 max-w-lg rounded-2xl px-4 py-3 text-sm font-medium",
            paid
              ? "bg-success/10 text-success"
              : payFailed
                ? "bg-amber-100 text-amber-900"
                : "bg-muted",
          )}
        >
          {payStatus === "checking"
            ? "Vérification du paiement…"
            : paid
              ? `Paiement de ${formatPrice(result.amount_due)} confirmé : votre abonnement est actif.`
              : payStatus === "pending"
                ? "Paiement en attente de confirmation. Votre abonnement s'activera dès sa réception."
                : `Le paiement n'a pas abouti. Vous pourrez réessayer dans « Suivez vos repas », ou ${CLIENT.name} vous appellera.`}
        </p>
      )}
      {!online && (
        <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground">
          {CLIENT.name} vous appelle très vite pour confirmer et encaisser{" "}
          {result.payment_choice === "moitie"
            ? `la première moitié (${formatPrice(result.amount_due)})`
            : formatPrice(result.amount_due)}
          . Vos repas seront utilisables dès la confirmation.
        </p>
      )}

      <div className="mx-auto mt-8 max-w-sm rounded-3xl border-2 border-dashed border-accent/50 bg-accent/5 p-6">
        <p className="flex items-center justify-center gap-2 text-sm font-semibold text-accent">
          <KeyRound className="size-4" /> Votre code abonné
        </p>
        <p className="mt-2 font-display text-5xl font-bold tracking-[0.3em]">{result.pin}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          Notez-le bien. Chaque midi, choisissez votre plat, puis entrez votre numéro et ce code au
          moment de valider : le repas est compté sur votre abonnement.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a
          href="/#menu"
          className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
        >
          Voir le menu de la semaine
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
    <section
      id="suivi"
      className="mx-auto grid max-w-5xl scroll-mt-24 items-center gap-8 px-4 py-16 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)]"
    >
      {/* Illustration : le tableau « Mon abonnement » et une abonnée qui savoure son repas */}
      <div className="relative mx-auto w-full max-w-[17rem] sm:max-w-xs lg:max-w-none">
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 aspect-square w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10"
        />
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 aspect-square w-[98%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-accent/25"
        />
        <img
          src={suiviRepas}
          alt="Le suivi « Mon abonnement » : repas livrés, repas restants et reste à régler, à côté d'une abonnée qui savoure son repas"
          loading="lazy"
          width={960}
          height={826}
          className="relative w-full drop-shadow-[0_24px_30px_rgba(60,35,15,0.25)]"
        />
      </div>

      <div>
        <div className="text-center lg:text-left">
          <p className="text-xs font-bold uppercase tracking-widest text-accent">Déjà abonné ?</p>
          <h2 className="mt-2 font-display text-3xl font-bold">Suivez vos repas</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground lg:mx-0">
            Entrez votre numéro pour voir combien de repas il vous reste, ceux déjà livrés et ce
            qu'il reste à régler.
          </p>
        </div>
        <form
          className="mx-auto mt-6 flex max-w-md gap-2 rounded-full border border-border bg-card p-1.5 shadow-sm lg:mx-0"
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
      </div>
    </section>
  );
}

function SubscriptionCard({ sub, today }: { sub: MySubscription; today: string }) {
  const delivered = sub.meals.filter((m) => m.status === "pris").length;
  const ordered = sub.meals.length - delivered;
  const used = sub.meals.length;
  const progress = Math.round((used / sub.meals_count) * 100);
  const balance = Math.max(sub.price - sub.amount_paid, 0);
  const next = sub.meals.find((m) => m.status === "prevu" && m.date >= today);
  const pending = sub.status === "en_attente";

  return (
    <article className="rounded-3xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-xl font-bold">{sub.plan_name}</p>
          <p className="text-sm text-muted-foreground">
            {sub.customer_name} · depuis le {shortDay(sub.start_date)}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            pending
              ? "bg-amber-100 text-amber-800"
              : balance === 0
                ? "bg-success/15 text-success"
                : "bg-accent/15 text-accent",
          )}
        >
          {pending ? "En attente de confirmation" : balance === 0 ? "Réglé" : "Acompte versé"}
        </span>
      </div>

      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <p className="font-display text-5xl font-bold leading-none">{sub.remaining}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            repas restant{sub.remaining > 1 ? "s" : ""} sur {sub.meals_count}
          </p>
        </div>
        <p className="text-right text-sm text-muted-foreground">
          {delivered} livré{delivered > 1 ? "s" : ""}
          {ordered > 0 ? ` · ${ordered} commandé${ordered > 1 ? "s" : ""}` : ""}
          {sub.remaining > 0 && sub.end_date && (
            <>
              <br />
              Fin estimée : {shortDay(sub.end_date)}
            </>
          )}
        </p>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
      </div>

      {next && (
        <p className="mt-4 rounded-2xl bg-accent/10 px-4 py-3 text-sm">
          Prochain repas : <strong>{formatDay(next.date)}</strong>
          {next.dish ? ` · ${next.dish}` : ""}
        </p>
      )}
      {sub.remaining === 0 && (
        <p className="mt-4 rounded-2xl bg-success/10 px-4 py-3 text-sm">
          Tous vos repas ont été utilisés. Envie de continuer ?{" "}
          <a href="#formules" className="font-semibold underline">
            Réabonnez-vous
          </a>
        </p>
      )}

      {balance > 0 && sub.status !== "annulee" && <BalanceBox sub={sub} balance={balance} />}

      {sub.meals.length > 0 && (
        <ul className="mt-5 divide-y divide-border text-sm">
          {[...sub.meals].reverse().map((m) => (
            <li key={m.date} className="flex items-center justify-between gap-3 py-2">
              <span>
                <span className="font-medium">{formatDay(m.date)}</span>
                {m.dish && <span className="text-muted-foreground"> · {m.dish}</span>}
              </span>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  m.status === "pris" ? "bg-success/15 text-success" : "bg-accent/15 text-accent",
                )}
              >
                {m.status === "pris" ? "Livré" : "Commandé"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

/** Reste à payer, avec paiement en ligne (le code abonné est demandé). */
function BalanceBox({ sub, balance }: { sub: MySubscription; balance: number }) {
  const [pin, setPin] = useState("");
  const pay = useServerFn(startSubscriptionPayment);
  const mutation = useMutation({
    mutationFn: () => pay({ data: { subscriptionId: sub.id, pin } }),
    onSuccess: ({ url }) => {
      if (url.startsWith("https://app.paydunya.com/")) window.location.href = url;
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const firstPayment = sub.amount_paid === 0;
  return (
    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <p>
        {firstPayment ? (
          <>
            Abonnement pas encore réglé (<strong>{formatPrice(sub.price)}</strong>).
          </>
        ) : (
          <>
            Reste à régler : <strong>{formatPrice(balance)}</strong>
            {sub.remaining <= 3 && sub.remaining > 0
              ? " — à payer avant votre dernier repas, sinon il restera bloqué."
              : ", avant votre dernier repas."}
          </>
        )}
      </p>
      <form
        className="mt-3 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (/^\d{4}$/.test(pin)) mutation.mutate();
        }}
      >
        <Input
          className="h-10 w-36 bg-white"
          placeholder="Code abonné"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
        />
        <button
          type="submit"
          disabled={!/^\d{4}$/.test(pin) || mutation.isPending}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          <CreditCard className="size-4" /> Payer en ligne
        </button>
      </form>
    </div>
  );
}

function Faq() {
  const items = [
    [
      "Comment j'utilise mes repas ?",
      "Commandez sur le site comme d'habitude : choisissez le plat du jour qui vous tente, puis entrez votre numéro et votre code abonné au moment de valider. Le repas est compté sur votre abonnement, rien à payer.",
    ],
    [
      "Et si je ne commande pas un jour ?",
      "Le repas n'est pas perdu : il reste sur votre abonnement et la fin recule d'autant. Les jours de fermeture du restaurant aussi sont reportés.",
    ],
    [
      "Combien de repas par jour ?",
      "Un repas par jour ouvré, du lundi au vendredi. Un deuxième plat, des jus ou une commande le week-end se paient normalement.",
    ],
    [
      "Puis-je payer en deux fois ?",
      "Oui : la moitié à la souscription, le reste avant votre dernier repas (en ligne depuis « Suivez vos repas », ou quand nous vous appelons). Tant que le solde n'est pas réglé, le dernier repas reste bloqué.",
    ],
    [
      "J'ai oublié mon code abonné.",
      `Contactez ${CLIENT.name} : nous vous redonnerons votre code après avoir vérifié votre numéro.`,
    ],
    [
      "Puis-je abonner un collègue ou un proche ?",
      "Oui : faites une nouvelle réservation à son nom, avec son numéro. Il recevra son propre code.",
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

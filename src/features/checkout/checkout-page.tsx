import { useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { KeyRound, Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { Button } from "@ui/components/ui/button";
import { Input } from "@ui/components/ui/input";
import { Label } from "@ui/components/ui/label";
import { Textarea } from "@ui/components/ui/textarea";
import { Checkbox } from "@ui/components/ui/checkbox";
import { useServerFn } from "@tanstack/react-start";
import { DEPOSIT_AMOUNT, placeOrder } from "@/features/checkout/api";
import { JuiceSuggestions } from "@/features/checkout/juice-suggestions";
import { PartnerOrderPanel } from "@/features/checkout/partner-order-panel";
import fondCommande from "@/assets/fond-composer-abonnement.jpg";
import decoAil from "@/assets/deco-ail.webp";
import decoPoivre from "@/assets/deco-poivre.webp";
import { Decoration } from "@/components/decoration";
import { isCancelledError } from "@core/lib/db";
import { publicMenuQuery } from "@core/domain/menu/api";
import { juiceCatalogQuery } from "@core/domain/juices/api";
import { startPayment } from "@/features/payment/paydunya.functions";
import { useCart } from "@/features/cart/cart-context";
import { checkSubscription, type SubscriptionCheck } from "@/features/subscriptions/api";
import { CLIENT } from "@/config/client";
import { formatDay, formatPrice, todayISO } from "@core/lib/format";
import { cn } from "@core/lib/utils";

const customerSchema = z.object({
  first_name: z.string().trim().min(2, "Prénom requis").max(80),
  last_name: z.string().trim().min(2, "Nom requis").max(80),
  phone: z
    .string()
    .trim()
    .min(7, "Numéro de téléphone requis")
    .max(25)
    .regex(/^[0-9+\s.-]+$/, "Numéro de téléphone invalide"),
  address: z.string().trim().min(4, "Adresse de livraison requise").max(300),
  address_extra: z.string().trim().max(200).optional(),
  landmark: z.string().trim().max(200).optional(),
  instructions: z.string().trim().max(500).optional(),
});

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, setQuantity, remove, total, clear } = useCart();
  const { data: menu } = useQuery(publicMenuQuery());
  const { data: juices } = useQuery(juiceCatalogQuery());
  const [accepted, setAccepted] = useState(false);
  // Employé d'une entreprise partenaire : commande facturée à l'entreprise (pas de livraison à saisir, pas de paiement).
  // Sans livraisons individuelles (CLIENT.individualOrders = false), toutes les commandes sont des
  // commandes entreprise.
  const partnerOnly = CLIENT.partners && !CLIENT.individualOrders;
  const [partnerMode, setPartnerMode] = useState<boolean>(partnerOnly);
  // Commande du jour uniquement : le client peut payer à la livraison (les précommandes gardent l'acompte).
  const [payMode, setPayMode] = useState<"en_ligne" | "livraison">("en_ligne");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
    address_extra: "",
    landmark: "",
    instructions: "",
  });

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("paiement") === "annule") {
      toast.info("Paiement annulé. Votre panier est conservé pour réessayer.");
    }
  }, []);

  const today = todayISO();
  const isPreorder = useMemo(
    () => items.some((item) => item.day_date !== null && item.day_date > today),
    [items, today],
  );

  // Abonnés : téléphone + code → un plat par jour ouvré pris en charge (le moins cher du jour,
  // comme côté serveur). Le reste se paie normalement.
  const [subPin, setSubPin] = useState("");
  const [subCheck, setSubCheck] = useState<SubscriptionCheck | null>(null);
  const platPriceByDay = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((item) => {
      if (item.source !== "menu" || item.category !== "plat" || !item.day_date) return;
      const current = map.get(item.day_date);
      if (current === undefined || item.price < current) map.set(item.day_date, item.price);
    });
    return map;
  }, [items]);
  const platDaysKey = [...platPriceByDay.keys()].sort().join(",");
  useEffect(() => setSubCheck(null), [form.phone, platDaysKey]);
  const verifySub = useMutation({
    mutationFn: () =>
      checkSubscription(form.phone, subPin, platDaysKey ? platDaysKey.split(",") : []),
    onSuccess: setSubCheck,
    onError: (error: Error) => toast.error(error.message),
  });
  const coveredDays = useMemo(
    () => (subCheck?.ok ? subCheck.days.filter((d) => d.covered).map((d) => d.date) : []),
    [subCheck],
  );
  const discount = coveredDays.reduce((sum, day) => sum + (platPriceByDay.get(day) ?? 0), 0);
  const payable = total - discount;
  // À payer maintenant (même calcul que la base) : plats du jour en entier, plats des jours suivants
  // 1 500 F chacun ; les jus suivent le premier jour de livraison. Le reste se paie à la livraison.
  const due = useMemo(() => {
    let todayAmount = 0;
    let preorderAmount = 0;
    let preorderPlates = 0;
    let firstDay: string | null = null;
    let juices = 0;
    for (const item of items) {
      if (item.source === "jus") {
        juices += item.price * item.quantity;
        continue;
      }
      if (item.day_date && (!firstDay || item.day_date < firstDay)) firstDay = item.day_date;
      if (item.day_date && item.day_date > today) {
        preorderAmount += Math.min(DEPOSIT_AMOUNT, item.price) * item.quantity;
        preorderPlates += item.quantity;
      } else {
        todayAmount += item.price * item.quantity;
      }
    }
    for (const day of coveredDays) {
      const price = platPriceByDay.get(day) ?? 0;
      if (day > today) {
        preorderAmount -= Math.min(DEPOSIT_AMOUNT, price);
        preorderPlates -= 1;
      } else todayAmount -= price;
    }
    const juicesNow = !firstDay || firstDay <= today ? juices : 0;
    const now =
      payable <= 0
        ? 0
        : isPreorder
          ? Math.max(todayAmount + preorderAmount + juicesNow, Math.min(DEPOSIT_AMOUNT, payable))
          : payable;
    return { now, todayAmount, preorderAmount, preorderPlates, juicesNow, later: payable - now };
  }, [items, coveredDays, platPriceByDay, today, isPreorder, payable]);
  const deposit = isPreorder ? due.now : 0;
  const onDelivery = !isPreorder && payable > 0 && payMode === "livraison";

  // Plats regroupés par jour du menu, puis les jus du catalogue (clé `null`) en dernier.
  const grouped = useMemo(() => {
    const map = new Map<string | null, typeof items>();
    items.forEach((item) => map.set(item.day_date, [...(map.get(item.day_date) ?? []), item]));
    return [...map.entries()].sort(([a], [b]) =>
      a === null ? 1 : b === null ? -1 : a.localeCompare(b),
    );
  }, [items]);

  const unavailable = useMemo(() => {
    return items.filter((item) => {
      if (item.source === "jus") {
        if (!juices) return false;
        const row = juices.find((r) => r.variant_id === item.id);
        return !row || row.state !== "disponible" || row.stock < item.quantity;
      }
      if (!menu) return false;
      const row = menu.find((r) => r.day_product_id === item.id);
      return !row || row.state !== "disponible" || row.stock_left < item.quantity;
    });
  }, [items, menu, juices]);

  const pay = useServerFn(startPayment);
  const mutation = useMutation({
    mutationFn: async (payload: Parameters<typeof placeOrder>[0]) => {
      const fingerprint = JSON.stringify(payload);
      const pendingRaw = window.sessionStorage.getItem("traiteur.pending_payment");
      let pending: {
        fingerprint: string;
        orderId: string;
        reference: string;
        total: number;
        order_type: string;
        deposit_required: number;
      } | null = null;
      try {
        pending = pendingRaw ? JSON.parse(pendingRaw) : null;
      } catch {
        /* ignore expired data */
      }
      const result = pending?.fingerprint === fingerprint ? null : await placeOrder(payload);
      if (result && payload.customer.payment_method === "livraison") {
        // Paiement à la livraison : pas de paiement en ligne, le livreur encaisse.
        window.sessionStorage.setItem(
          "traiteur.last_order",
          JSON.stringify({
            reference: result.reference,
            total: result.total,
            pay_on_delivery: true,
            customer: form,
            items: items.map((i) => ({ ...i })),
            subscription: result.subscription,
          }),
        );
        clear();
        return "/confirmation";
      }
      if (result && result.total === 0) {
        // Entièrement pris en charge par l'abonnement : pas de paiement.
        window.sessionStorage.setItem(
          "traiteur.last_order",
          JSON.stringify({
            reference: result.reference,
            total: 0,
            customer: form,
            items: items.map((i) => ({ ...i })),
            subscription: result.subscription,
          }),
        );
        clear();
        return "/confirmation";
      }
      const orderId = result?.order_id ?? pending?.orderId;
      if (!orderId) throw new Error("Commande introuvable. Réessayez.");
      if (result)
        window.sessionStorage.setItem(
          "traiteur.pending_payment",
          JSON.stringify({
            fingerprint,
            orderId,
            reference: result.reference,
            total: result.total,
            order_type: result.order_type,
            deposit_required: result.deposit_required,
          }),
        );
      const { url } = await pay({ data: { orderId } });
      if (!url.startsWith("https://app.paydunya.com/"))
        throw new Error("Lien de paiement invalide. Réessayez.");
      const payload2 = {
        reference: result?.reference ?? pending?.reference,
        total: result?.total ?? pending?.total ?? total,
        order_type:
          result?.order_type ?? pending?.order_type ?? (isPreorder ? "precommande" : "immediate"),
        deposit_required: result?.deposit_required ?? pending?.deposit_required ?? deposit,
        customer: form,
        items: items.map((i) => ({ ...i })),
        subscription: result?.subscription ?? null,
      };
      window.sessionStorage.setItem("traiteur.last_order", JSON.stringify(payload2));
      clear();
      return url;
    },
    onSuccess: (url) => {
      if (url === "/confirmation") void navigate({ to: "/confirmation" });
      else window.location.href = url;
    },
    onError: (error: Error) => {
      if (isCancelledError(error)) return;
      toast.error(error.message);
    },
  });

  function submit() {
    const parsed = customerSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        fieldErrors[String(issue.path[0])] = issue.message;
      });
      setErrors(fieldErrors);
      toast.error("Veuillez compléter vos informations de livraison.");
      return;
    }
    setErrors({});
    if (!accepted) {
      toast.error("Vous devez accepter la condition de non-remboursement.");
      return;
    }
    if (unavailable.length > 0) {
      toast.error("Certains produits ne sont plus disponibles, mettez le panier à jour.");
      return;
    }
    if (subCheck && !subCheck.ok) {
      toast.error("Code abonné incorrect : corrigez-le ou retirez-le.");
      return;
    }
    mutation.mutate({
      customer: {
        ...parsed.data,
        ...(subCheck?.ok && coveredDays.length > 0 ? { subscription_pin: subPin } : {}),
        ...(onDelivery ? { payment_method: "livraison" } : {}),
      },
      items: items.map((i) =>
        i.source === "jus"
          ? { variant_id: i.id, quantity: i.quantity }
          : { day_product_id: i.id, quantity: i.quantity },
      ),
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader overlay />
      {/* En-tête : photo de plats sous un voile brun, le menu de navigation est posé dessus */}
      <section className="relative overflow-hidden bg-sidebar text-sidebar-foreground">
        <img
          src={fondCommande}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          className="pointer-events-none absolute inset-0 size-full select-none object-cover object-[center_40%]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-sidebar/85 via-sidebar/70 to-sidebar/90"
        />
        <div className="relative mx-auto max-w-5xl px-4 pb-24 pt-36 sm:pt-44">
          <p className="text-xs font-bold uppercase tracking-widest text-accent">Commande</p>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">
            {partnerOnly ? "Mon panier" : "Ma précommande"}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-sidebar-foreground/80">
            {partnerOnly
              ? "Vérifiez vos plats jour par jour, choisissez votre entreprise partenaire et validez : rien à payer."
              : "Vérifiez vos plats, ajoutez un jus si le cœur vous en dit, puis indiquez où livrer."}
          </p>
        </div>
      </section>
      {/* Fond beige décoré (ail et poivre) derrière le panier et le formulaire */}
      <div className="relative -mt-16 overflow-hidden">
        <Decoration
          src={decoPoivre}
          className="-right-12 top-40 hidden w-44 lg:block xl:w-56"
          rotate="12deg"
        />
        <Decoration
          src={decoAil}
          className="-left-10 bottom-10 hidden w-40 lg:block xl:w-52"
          rotate="-10deg"
        />
        <main className="relative mx-auto max-w-6xl px-4 pb-16">
          {items.length === 0 ? (
            <div className="surface-card p-10 text-center">
              <p className="text-muted-foreground">Votre panier est vide.</p>
              <Button asChild className="mt-4">
                <Link to="/">Voir le menu</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
              <div className="min-w-0 space-y-6">
                {grouped.map(([day, dayItems]) => (
                  <section key={day ?? "jus"} className="surface-card p-4">
                    <h2 className="font-display text-lg font-bold text-primary">
                      {day ? formatDay(day) : "Jus"}
                    </h2>
                    <ul className="mt-3 divide-y divide-border">
                      {dayItems.map((item) => (
                        <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                          <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatPrice(item.price)} l'unité
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label="Retirer une unité"
                              onClick={() => setQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="size-4" />
                            </Button>
                            <span className="w-6 text-center font-semibold">{item.quantity}</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label="Ajouter une unité"
                              onClick={() => setQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="size-4" />
                            </Button>
                            <span className="w-24 text-right font-semibold">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label="Supprimer"
                              onClick={() => remove(item.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}

                {!items.some((i) => i.source === "jus") && <JuiceSuggestions />}

                {unavailable.length > 0 && (
                  <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                    Désolé, ces produits ne sont plus disponibles en quantité suffisante :{" "}
                    {unavailable.map((i) => i.name).join(", ")}. Veuillez ajuster votre panier.
                  </div>
                )}

                {CLIENT.partners && !partnerOnly && (
                  <section className="surface-card space-y-3 p-4">
                    <h2 className="font-display text-lg font-bold text-primary">Livraison</h2>
                    <div
                      role="radiogroup"
                      aria-label="Type de livraison"
                      className="grid gap-3 sm:grid-cols-2"
                    >
                      {(
                        [
                          [
                            true,
                            "Mon entreprise est partenaire",
                            "Livré avec mes collègues, facturé à l'entreprise : rien à payer.",
                          ],
                          [
                            false,
                            "Livraison individuelle",
                            "À l'adresse de votre choix, paiement en ligne ou à la livraison.",
                          ],
                        ] as const
                      ).map(([value, title, text]) => (
                        <button
                          key={title}
                          type="button"
                          role="radio"
                          aria-checked={partnerMode === value}
                          onClick={() => setPartnerMode(value)}
                          className={cn(
                            "rounded-xl border p-4 text-left transition-colors",
                            partnerMode === value
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-primary/50",
                          )}
                        >
                          <span className="block font-semibold">{title}</span>
                          <span className="mt-1 block text-sm text-muted-foreground">{text}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {partnerMode ? null : (
                  <>
                    <section className="surface-card space-y-4 p-4">
                      <h2 className="font-display text-lg font-bold text-primary">
                        Informations de livraison
                      </h2>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                          id="last_name"
                          label="Nom *"
                          value={form.last_name}
                          error={errors["last_name"]}
                          onChange={(v) => setForm({ ...form, last_name: v })}
                        />
                        <Field
                          id="first_name"
                          label="Prénom *"
                          value={form.first_name}
                          error={errors["first_name"]}
                          onChange={(v) => setForm({ ...form, first_name: v })}
                        />
                        <Field
                          id="phone"
                          label="Téléphone *"
                          value={form.phone}
                          error={errors["phone"]}
                          onChange={(v) => setForm({ ...form, phone: v })}
                        />
                        <Field
                          id="address"
                          label="Adresse de livraison *"
                          value={form.address}
                          error={errors["address"]}
                          onChange={(v) => setForm({ ...form, address: v })}
                        />
                        <Field
                          id="address_extra"
                          label="Complément d'adresse"
                          value={form.address_extra}
                          onChange={(v) => setForm({ ...form, address_extra: v })}
                        />
                        <Field
                          id="landmark"
                          label="Point de repère"
                          value={form.landmark}
                          onChange={(v) => setForm({ ...form, landmark: v })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="instructions">Instructions de livraison</Label>
                        <Textarea
                          id="instructions"
                          maxLength={500}
                          value={form.instructions}
                          onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                        />
                      </div>
                    </section>

                    {CLIENT.subscriptions && (
                      <section className="surface-card space-y-3 p-4">
                        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-primary">
                          <KeyRound className="size-5" /> Vous êtes abonné ?
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Entrez votre code abonné (avec le téléphone ci-dessus) : un plat par jour,
                          du lundi au vendredi, est compté sur votre abonnement.
                        </p>
                        <form
                          className="flex flex-wrap gap-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (/^\d{4}$/.test(subPin) && form.phone.replace(/\D/g, "").length >= 7)
                              verifySub.mutate();
                          }}
                        >
                          <Input
                            className="w-36"
                            placeholder="Code à 4 chiffres"
                            inputMode="numeric"
                            maxLength={4}
                            value={subPin}
                            onChange={(e) => {
                              setSubPin(e.target.value.replace(/\D/g, ""));
                              setSubCheck(null);
                            }}
                          />
                          <Button
                            type="submit"
                            variant="secondary"
                            disabled={
                              !/^\d{4}$/.test(subPin) ||
                              form.phone.replace(/\D/g, "").length < 7 ||
                              verifySub.isPending
                            }
                          >
                            {verifySub.isPending ? "Vérification…" : "Utiliser mon abonnement"}
                          </Button>
                        </form>
                        {form.phone.replace(/\D/g, "").length < 7 && subPin.length === 4 && (
                          <p className="text-xs text-muted-foreground">
                            Indiquez d'abord votre téléphone dans les informations de livraison.
                          </p>
                        )}
                        {subCheck && !subCheck.ok && (
                          <p className="text-sm text-destructive">{subCheck.error}</p>
                        )}
                        {subCheck?.ok && (
                          <div className="space-y-2 rounded-lg bg-success/10 p-3 text-sm">
                            <p className="font-semibold">
                              {subCheck.customer_name} · {subCheck.plan_name} · {subCheck.remaining}{" "}
                              repas restant{subCheck.remaining > 1 ? "s" : ""}
                            </p>
                            {subCheck.days.length === 0 && (
                              <p>
                                Ajoutez un plat du jour au panier pour utiliser votre abonnement.
                              </p>
                            )}
                            <ul className="space-y-1">
                              {subCheck.days.map((d) => (
                                <li key={d.date}>
                                  {d.covered ? "✅" : "⛔"} {formatDay(d.date)} :{" "}
                                  {d.covered ? "1 plat compté sur l'abonnement" : d.reason}
                                </li>
                              ))}
                            </ul>
                            {coveredDays.length > 0 && (
                              <p className="text-muted-foreground">
                                Après cette commande, il vous restera {subCheck.remaining_after}{" "}
                                repas.
                              </p>
                            )}
                          </div>
                        )}
                      </section>
                    )}
                  </>
                )}
              </div>

              {partnerMode && (
                <aside className="lg:sticky lg:top-24 lg:self-start">
                  <PartnerOrderPanel items={items} onDone={clear} />
                </aside>
              )}
              {!partnerMode && (
                <aside className="lg:sticky lg:top-24 lg:self-start">
                  <div className="surface-card space-y-5 p-5 sm:p-7">
                    <h2 className="font-display text-2xl font-bold text-primary">Récapitulatif</h2>
                    <ul className="space-y-2.5 text-base">
                      {items.map((item) => (
                        <li key={item.id} className="flex justify-between gap-3">
                          <span className="text-muted-foreground">
                            {item.quantity} × {item.name}
                          </span>
                          <span className="font-medium">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-success">
                        <span>Abonnement ({coveredDays.length} repas)</span>
                        <span className="font-medium">− {formatPrice(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-border pt-4 text-2xl font-bold">
                      <span>Total</span>
                      <span>{formatPrice(payable)}</span>
                    </div>

                    {!isPreorder && payable > 0 && (
                      <div role="radiogroup" aria-label="Mode de paiement" className="grid gap-2">
                        {(
                          [
                            [
                              "en_ligne",
                              "Payer en ligne",
                              "Wave, Orange Money, Free Money ou carte",
                            ],
                            [
                              "livraison",
                              "Payer à la livraison",
                              "En espèces ou par Wave au livreur",
                            ],
                          ] as const
                        ).map(([value, title, text]) => (
                          <button
                            key={value}
                            type="button"
                            role="radio"
                            aria-checked={payMode === value}
                            onClick={() => setPayMode(value)}
                            className={cn(
                              "flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-colors",
                              payMode === value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/40",
                            )}
                          >
                            <span
                              className={cn(
                                "mt-0.5 size-4 shrink-0 rounded-full border-2",
                                payMode === value ? "border-primary bg-primary" : "border-border",
                              )}
                            />
                            <span>
                              <span className="block text-sm font-semibold">{title}</span>
                              <span className="block text-xs text-muted-foreground">{text}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {payable === 0 ? (
                      <div className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm font-semibold text-success">
                        Rien à payer : votre commande est entièrement comptée sur votre abonnement.
                      </div>
                    ) : onDelivery ? (
                      <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="font-semibold text-primary">À payer à la livraison</span>
                          <span className="text-2xl font-bold text-primary">
                            {formatPrice(payable)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Rien à payer maintenant : vous réglez le livreur à la réception.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="font-semibold text-primary">À payer maintenant</span>
                          <span className="text-2xl font-bold text-primary">
                            {formatPrice(due.now)}
                          </span>
                        </div>
                        {isPreorder && (
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {due.todayAmount > 0 && (
                              <li className="flex justify-between gap-3">
                                <span>Plats d'aujourd'hui (en entier)</span>
                                <span>{formatPrice(due.todayAmount)}</span>
                              </li>
                            )}
                            {due.preorderPlates > 0 && (
                              <li className="flex justify-between gap-3">
                                <span>
                                  Acompte précommande : {due.preorderPlates} plat
                                  {due.preorderPlates > 1 ? "s" : ""} ×{" "}
                                  {formatPrice(DEPOSIT_AMOUNT)}
                                </span>
                                <span>{formatPrice(due.preorderAmount)}</span>
                              </li>
                            )}
                            {due.juicesNow > 0 && (
                              <li className="flex justify-between gap-3">
                                <span>Jus (livrés aujourd'hui)</span>
                                <span>{formatPrice(due.juicesNow)}</span>
                              </li>
                            )}
                            <li className="flex justify-between gap-3 border-t border-border pt-1 font-semibold text-foreground">
                              <span>Reste à payer à la livraison</span>
                              <span>{formatPrice(due.later)}</span>
                            </li>
                          </ul>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Paiement sécurisé par PayDunya : Wave, Orange Money, Free Money ou carte
                          bancaire.
                          {isPreorder && " L'acompte n'est pas remboursable."}
                        </p>
                      </div>
                    )}

                    <div className="rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">
                      <strong>Important :</strong> toute commande validée est non remboursable.
                    </div>

                    <label className="flex items-start gap-3 text-sm">
                      <Checkbox
                        checked={accepted}
                        onCheckedChange={(checked) => setAccepted(checked === true)}
                        className="mt-0.5"
                      />
                      <span>
                        J'ai pris connaissance et j'accepte que ma commande (et l'acompte de{" "}
                        {formatPrice(DEPOSIT_AMOUNT)} par plat précommandé) soit non remboursable.
                      </span>
                    </label>

                    <Button
                      className="w-full"
                      size="lg"
                      disabled={!accepted || mutation.isPending}
                      onClick={submit}
                    >
                      {mutation.isPending
                        ? payable === 0 || onDelivery
                          ? "Validation…"
                          : "Redirection vers le paiement…"
                        : payable === 0 || onDelivery
                          ? "Valider ma commande"
                          : `Payer ${formatPrice(due.now)}`}
                    </Button>
                  </div>
                </aside>
              )}
            </div>
          )}
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} maxLength={300} onChange={(e) => onChange(e.target.value)} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

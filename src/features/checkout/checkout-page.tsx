import { useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
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
import { isCancelledError } from "@core/lib/db";
import { publicMenuQuery } from "@core/domain/menu/api";
import { juiceCatalogQuery } from "@core/domain/juices/api";
import { startPayment } from "@/features/payment/paydunya.functions";
import { useCart } from "@/features/cart/cart-context";
import { formatDay, formatPrice, todayISO } from "@core/lib/format";

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
        deposit_required:
          result?.deposit_required ??
          pending?.deposit_required ??
          (isPreorder ? DEPOSIT_AMOUNT : 0),
        customer: form,
        items: items.map((i) => ({ ...i })),
      };
      window.sessionStorage.setItem("traiteur.last_order", JSON.stringify(payload2));
      clear();
      return url;
    },
    onSuccess: (url) => {
      window.location.href = url;
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
    mutation.mutate({
      customer: parsed.data,
      items: items.map((i) =>
        i.source === "jus"
          ? { variant_id: i.id, quantity: i.quantity }
          : { day_product_id: i.id, quantity: i.quantity },
      ),
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold">Ma précommande</h1>

        {items.length === 0 ? (
          <div className="surface-card mt-8 p-10 text-center">
            <p className="text-muted-foreground">Votre panier est vide.</p>
            <Button asChild className="mt-4">
              <Link to="/">Voir le menu</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-6">
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

              {unavailable.length > 0 && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                  Désolé, ces produits ne sont plus disponibles en quantité suffisante :{" "}
                  {unavailable.map((i) => i.name).join(", ")}. Veuillez ajuster votre panier.
                </div>
              )}

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
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="surface-card space-y-4 p-5">
                <h2 className="font-display text-lg font-bold text-primary">Récapitulatif</h2>
                <ul className="space-y-2 text-sm">
                  {items.map((item) => (
                    <li key={item.id} className="flex justify-between gap-3">
                      <span className="text-muted-foreground">
                        {item.quantity} × {item.name}
                      </span>
                      <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between border-t border-border pt-3 text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>

                <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
                  <p className="font-semibold text-primary">
                    {isPreorder
                      ? `À payer maintenant : acompte de ${formatPrice(DEPOSIT_AMOUNT)}`
                      : `À payer maintenant : ${formatPrice(total)}`}
                  </p>
                  <p className="text-muted-foreground">
                    Paiement sécurisé par PayDunya : Wave, Orange Money, Free Money ou carte
                    bancaire.
                    {isPreorder &&
                      " L'acompte de 1 500 FCFA n'est pas remboursable ; le reste est réglé à la livraison."}
                  </p>
                </div>

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
                    J'ai pris connaissance et j'accepte que ma commande (et l'acompte de 1 500 FCFA
                    pour une précommande) soit non remboursable.
                  </span>
                </label>

                <Button
                  className="w-full"
                  size="lg"
                  disabled={!accepted || mutation.isPending}
                  onClick={submit}
                >
                  {mutation.isPending ? "Redirection vers le paiement…" : "Payer avec PayDunya"}
                </Button>
              </div>
            </aside>
          </div>
        )}
      </main>
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

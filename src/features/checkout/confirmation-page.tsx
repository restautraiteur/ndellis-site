import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { Button } from "@ui/components/ui/button";
import { formatDay, formatPrice } from "@core/lib/format";
import { useServerFn } from "@tanstack/react-start";
import { checkPayment } from "@/features/payment/paydunya.functions";
import { CLIENT } from "@/config/client";

type StoredOrder = {
  reference: string;
  total: number;
  order_type?: string;
  /** Paiement à la livraison (commande du jour) : rien payé en ligne. */
  pay_on_delivery?: boolean;
  /** Commande d'employé : facturée à cette entreprise partenaire. */
  partner?: string;
  /** Précommande : somme payée maintenant (le reste à la livraison). */
  deposit_required?: number;
  customer: {
    first_name: string;
    last_name: string;
    phone: string;
    address: string;
    address_extra?: string;
    landmark?: string;
    instructions?: string;
  };
  items: { name: string; quantity: number; price: number; day_date: string | null }[];
  subscription?: { covered_days: string[]; discount: number; remaining: number } | null;
};

export function ConfirmationPage() {
  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [payStatus, setPayStatus] = useState<string | null>(null);
  const check = useServerFn(checkPayment);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem("traiteur.last_order");
      if (raw) setOrder(JSON.parse(raw) as StoredOrder);
    } catch {
      /* ignore */
    }
    const token = new URLSearchParams(window.location.search).get("token");
    if (token) {
      setPayStatus("checking");
      check({ data: { token } })
        .then((r) => {
          setPayStatus(r.status);
          if (r.status === "completed")
            window.sessionStorage.removeItem("traiteur.pending_payment");
        })
        .catch(() => setPayStatus("unknown"));
    }
  }, [check]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        {!order ? (
          <div className="surface-card p-10 text-center">
            <h1 className="font-display text-2xl font-bold">Aucune précommande récente</h1>
            <Button asChild className="mt-4">
              <Link to="/">Retour au menu</Link>
            </Button>
          </div>
        ) : (
          <div className="surface-card p-6 sm:p-10">
            <div className="flex items-center gap-3 text-success">
              <CheckCircle2 className="size-8" />
              <h1 className="font-display text-2xl font-bold text-foreground">
                Précommande enregistrée
              </h1>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Votre référence de commande :</p>
            <p className="font-display text-3xl font-bold text-accent">{order.reference}</p>
            {payStatus && (
              <p className="mt-4 rounded-lg border border-border p-3 text-sm font-medium">
                {payStatus === "checking"
                  ? "Vérification du paiement en cours…"
                  : payStatus === "completed"
                    ? "Paiement PayDunya confirmé. Merci !"
                    : payStatus === "pending"
                      ? "Paiement en attente de confirmation. Nous vous tiendrons informé."
                      : `Le paiement n'a pas abouti. Contactez-nous sur WhatsApp au ${CLIENT.whatsappDisplay}.`}
              </p>
            )}

            {order.subscription && (
              <div className="mt-4 rounded-lg border border-success/30 bg-success/10 p-4 text-sm">
                <p className="font-semibold text-success">
                  {order.subscription.covered_days.length} repas compté
                  {order.subscription.covered_days.length > 1 ? "s" : ""} sur votre abonnement (−{" "}
                  {formatPrice(order.subscription.discount)}).
                </p>
                <p className="mt-1">
                  Il vous reste <strong>{order.subscription.remaining}</strong> repas.
                </p>
              </div>
            )}

            <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              <Info
                label="Nom"
                value={`${order.customer.last_name} ${order.customer.first_name}`}
              />
              <Info label="Téléphone" value={order.customer.phone} />
              <Info
                label="Adresse"
                value={[order.customer.address, order.customer.address_extra]
                  .filter(Boolean)
                  .join(" — ")}
              />
              <Info label="Statut" value="Nouvelle" />
            </dl>

            <h2 className="mt-8 font-display text-lg font-bold text-primary">Détail</h2>
            <ul className="mt-3 divide-y divide-border text-sm">
              {order.items.map((item, index) => (
                <li key={index} className="flex justify-between gap-3 py-2">
                  <span>
                    {item.quantity} × {item.name}{" "}
                    {item.day_date && (
                      <span className="text-muted-foreground">({formatDay(item.day_date)})</span>
                    )}
                  </span>
                  <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t border-border pt-3 text-lg font-bold">
              <span>{order.subscription ? "Total payé" : "Total"}</span>
              <span>{formatPrice(order.total)}</span>
            </div>
            {order.partner && (
              <p className="mt-2 rounded-lg bg-success/10 p-3 text-sm font-medium text-success">
                Facturé à {order.partner} : rien à payer. Livraison à votre entreprise.
              </p>
            )}
            {order.pay_on_delivery && (
              <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm font-medium text-amber-900">
                À payer à la livraison : {formatPrice(order.total)} (espèces ou Wave au livreur).
              </p>
            )}
            {order.order_type === "precommande" && (order.deposit_required ?? 0) > 0 && (
              <dl className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Payé maintenant</dt>
                  <dd className="font-medium">{formatPrice(order.deposit_required ?? 0)}</dd>
                </div>
                <div className="flex justify-between font-semibold">
                  <dt>Reste à payer à la livraison</dt>
                  <dd>{formatPrice(order.total - (order.deposit_required ?? 0))}</dd>
                </div>
              </dl>
            )}

            <p className="mt-6 rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">
              Rappel : cette précommande est non remboursable. Nous vous contacterons au numéro
              indiqué pour la livraison.
            </p>

            <Button asChild className="mt-6" variant="secondary">
              <Link to="/">Retour au menu</Link>
            </Button>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

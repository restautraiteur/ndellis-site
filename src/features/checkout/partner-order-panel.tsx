import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, queryOptions } from "@tanstack/react-query";
import { Building2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@ui/components/ui/button";
import { Input } from "@ui/components/ui/input";
import { Label } from "@ui/components/ui/label";
import type { CartItem } from "@/features/cart/cart-context";
import { db } from "@core/lib/db";
import { formatDay, formatPrice } from "@core/lib/format";
import { cn } from "@core/lib/utils";

export const partnersQuery = () =>
  queryOptions({
    queryKey: ["partners", "public"],
    queryFn: async () => {
      const { data, error } = await db.rpc("list_partners");
      if (error) throw new Error(error.message);
      return (data ?? []) as { id: string; name: string }[];
    },
  });

/**
 * Récapitulatif d'une commande entreprise : l'employé choisit son entreprise partenaire, donne son
 * nom et son téléphone, et valide. Rien à payer : livraison avec ses collègues, facturé à l'entreprise.
 */
export function PartnerOrderPanel({
  items,
  onDone,
  onRemove,
}: {
  items: CartItem[];
  onDone: () => void;
  onRemove: (id: string) => void;
}) {
  const navigate = useNavigate();
  const { data: partners = [] } = useQuery(partnersQuery());
  const [partnerId, setPartnerId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const partner = partners.find((p) => p.id === partnerId);
  // Jours dont l'heure limite de l'entreprise est passée (calculé par le serveur, heure de Dakar).
  const menuDays = [...new Set(items.filter((i) => i.day_date).map((i) => i.day_date!))].sort();
  const { data: closedDays = [] } = useQuery({
    queryKey: ["partner_closed_days", partnerId, menuDays.join(",")],
    enabled: !!partnerId && menuDays.length > 0,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await db.rpc("partner_closed_days", {
        p_partner: partnerId,
        p_days: menuDays,
      });
      if (error) throw new Error(error.message);
      return (data ?? []) as { day_date: string; deadline: string }[];
    },
  });
  const closedSet = new Set(closedDays.map((d) => d.day_date));
  const closedItems = items.filter((i) => i.day_date && closedSet.has(i.day_date));
  const valid =
    !!partnerId &&
    fullName.trim().length >= 2 &&
    phone.replace(/\D/g, "").length >= 7 &&
    closedItems.length === 0;

  // Plats classés par jour (les jus, sans jour, à la fin).
  const byDay = new Map<string, CartItem[]>();
  for (const item of items) {
    const key = item.day_date ?? "";
    byDay.set(key, [...(byDay.get(key) ?? []), item]);
  }
  const days = [...byDay].sort(([a], [b]) => (a || "9999").localeCompare(b || "9999"));

  const order = useMutation({
    mutationFn: async () => {
      const { data, error } = await db.rpc("place_partner_order_simple", {
        p_partner: partnerId,
        p_full_name: fullName,
        p_phone: phone,
        p_items: items.map((i) =>
          i.source === "jus"
            ? { variant_id: i.id, quantity: i.quantity }
            : { day_product_id: i.id, quantity: i.quantity },
        ),
      });
      if (error) throw new Error(error.message);
      const result = data as {
        ok: boolean;
        error?: string;
        reference?: string;
        total?: number;
        partner?: string;
        employee?: string;
      };
      if (!result.ok) throw new Error(result.error ?? "Commande impossible.");
      return result;
    },
    onSuccess: (result) => {
      window.sessionStorage.setItem(
        "traiteur.last_order",
        JSON.stringify({
          reference: result.reference,
          total: result.total,
          partner: result.partner,
          customer: {
            first_name: result.employee,
            last_name: "",
            phone,
            address: result.partner,
          },
          items: items.map((i) => ({ ...i })),
        }),
      );
      onDone();
      void navigate({ to: "/confirmation" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="surface-card space-y-5 p-5 sm:p-7">
      <h2 className="font-display text-2xl font-bold text-primary">Récapitulatif</h2>

      <ul className="space-y-3">
        {days.map(([day, dayItems]) => (
          <li
            key={day || "jus"}
            className={cn(
              "rounded-xl p-3",
              closedSet.has(day) ? "bg-destructive/10 ring-1 ring-destructive/30" : "bg-muted/40",
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {day ? formatDay(day) : "Jus"}
              {closedSet.has(day) && <span className="ml-1 text-destructive">· clos</span>}
            </p>
            <ul className="mt-1.5 space-y-1">
              {dayItems.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 text-sm">
                  <span>
                    {item.quantity > 1 ? `${item.quantity} × ` : ""}
                    {item.name}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      {partners.length === 0 ? (
        <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
          Aucune entreprise partenaire pour le moment.
        </p>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid && !order.isPending) order.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="po-partner" className="flex items-center gap-2">
              <Building2 className="size-4 text-primary" /> Votre entreprise partenaire
            </Label>
            <select
              id="po-partner"
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
            >
              <option value="">Choisir votre entreprise…</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="po-name">Nom et prénom</Label>
            <Input
              id="po-name"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="po-phone">Téléphone</Label>
            <Input
              id="po-phone"
              inputMode="tel"
              autoComplete="tel"
              placeholder="77 000 00 00"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {closedItems.length > 0 && (
            <div className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <p className="font-semibold">
                Commandes closes pour {partner?.name ?? "votre entreprise"} :
              </p>
              <ul className="list-disc space-y-0.5 pl-5">
                {closedDays.map((d) => (
                  <li key={d.day_date}>
                    {formatDay(d.day_date)} : heure limite dépassée depuis le {d.deadline}
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-destructive/40 bg-card text-destructive hover:bg-destructive/5"
                onClick={() => closedItems.forEach((i) => onRemove(i.id))}
              >
                Retirer ces plats
              </Button>
            </div>
          )}

          <div className="space-y-1 border-t border-border pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">
                {partner ? `Facturé à ${partner.name}` : "Facturé à votre entreprise"}
              </span>
              <span className="text-lg font-semibold">{formatPrice(total)}</span>
            </div>
            <div className="flex items-center justify-between text-2xl font-bold">
              <span>À payer</span>
              <span className="text-success">0 FCFA</span>
            </div>
          </div>
          <p className="flex gap-2 rounded-lg bg-success/10 p-3 text-sm text-success">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            Rien à payer : vos repas sont livrés à votre entreprise avec ceux de vos collègues.
          </p>
          <Button type="submit" className="w-full" size="lg" disabled={!valid || order.isPending}>
            {order.isPending ? "Validation…" : "Valider ma commande"}
          </Button>
        </form>
      )}
    </div>
  );
}

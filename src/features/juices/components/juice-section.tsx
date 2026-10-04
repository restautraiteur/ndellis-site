import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { GlassWater, Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import fondFruits from "@/assets/fond-fruits.jpg";
import { Skeleton } from "@ui/components/ui/skeleton";
import { SectionPill } from "@/components/section-pill";
import { useCart } from "@/features/cart/cart-context";
import {
  JUICE_SIZES,
  juiceCatalogQuery,
  juiceVolume,
  type JuiceRow,
  type JuiceSize,
} from "@core/domain/juices/api";
import { formatPrice, STATE_LABELS } from "@core/lib/format";
import { cn } from "@core/lib/utils";

type Juice = {
  product_id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  variants: JuiceRow[];
};

export function JuiceSection() {
  const { data, isLoading } = useQuery(juiceCatalogQuery());

  const juices = useMemo(() => {
    const map = new Map<string, Juice>();
    for (const row of data ?? []) {
      if (row.state === "desactive") continue;
      const juice = map.get(row.product_id) ?? {
        product_id: row.product_id,
        name: row.name,
        description: row.description,
        photo_url: row.photo_url,
        variants: [],
      };
      juice.variants.push(row);
      map.set(row.product_id, juice);
    }
    const order = JUICE_SIZES.map((s) => s.size);
    return [...map.values()].map((juice) => ({
      ...juice,
      variants: juice.variants.sort((a, b) => order.indexOf(a.size) - order.indexOf(b.size)),
    }));
  }, [data]);

  if (!isLoading && juices.length === 0) return null;

  return (
    <section
      id="jus"
      className="relative scroll-mt-24 overflow-hidden border-b border-border/70 bg-cream py-16 sm:py-20 [.abo-zone:has(.abo-cta)+&]:pt-[calc(var(--abo-overlap,10rem)+4rem)] sm:[.abo-zone:has(.abo-cta)+&]:pt-[calc(var(--abo-overlap,10rem)+5rem)]"
    >
      {/* fond de fruits : le blanc de la photo se fond dans le crème (multiply), opacité réduite pour la lisibilité.
          Le bandeau abonnement chevauche le haut de la section (moitié menu, moitié jus). */}
      <img
        src={fondFruits}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="pointer-events-none absolute inset-0 size-full select-none object-cover opacity-40 mix-blend-multiply"
      />
      <div className="relative mx-auto max-w-6xl px-4">
        <SectionPill>Jus frais maison</SectionPill>
        <h2 className="mt-3 font-display text-4xl font-bold uppercase leading-none tracking-tight text-primary sm:text-6xl">
          Nos jus
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          Bissap, bouye, gingembre… pressés et préparés chaque jour. Disponibles en petit format
          (250 ml) ou en grand format (1,5 L), à ajouter à votre commande avec vos plats.
        </p>

        {/* Sur mobile : défilement horizontal (on voit le jus suivant), comme les plats du menu. */}
        <div className="-mx-4 mt-10 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-4 scrollbar-hide sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading
            ? [0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-96 w-[78%] shrink-0 rounded-3xl sm:w-auto" />
              ))
            : juices.map((juice) => <JuiceCard key={juice.product_id} juice={juice} />)}
        </div>
      </div>
    </section>
  );
}

function JuiceCard({ juice }: { juice: Juice }) {
  const { items, add, setQuantity } = useCart();
  const firstAvailable = juice.variants.find((v) => v.state === "disponible");
  const [size, setSize] = useState<JuiceSize>((firstAvailable ?? juice.variants[0])!.size);
  const variant = juice.variants.find((v) => v.size === size) ?? juice.variants[0]!;
  const inCart = items.find((i) => i.id === variant.variant_id);
  const available = variant.state === "disponible";
  const soldOut = juice.variants.every((v) => v.state !== "disponible");
  const label = `${juice.name} (${juiceVolume(variant.size)})`;

  const handleAdd = () => {
    add({
      id: variant.variant_id,
      source: "jus",
      name: label,
      category: "jus",
      price: variant.price,
      day_date: null,
    });
    toast.success(`${label} ajouté au panier`);
  };

  const handleIncrement = () => {
    if (!inCart) return;
    if (inCart.quantity >= variant.stock) {
      toast.error(`Il ne reste que ${variant.stock} bouteille(s) de ${label}.`);
      return;
    }
    setQuantity(variant.variant_id, inCart.quantity + 1);
  };

  return (
    <article
      className={cn(
        "group flex w-[78%] shrink-0 snap-start flex-col sm:w-auto",
        soldOut && "opacity-60 grayscale",
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-secondary shadow-card transition-all duration-500 group-hover:-translate-y-1.5 group-hover:shadow-warm">
        {juice.photo_url ? (
          <img
            src={juice.photo_url}
            alt={juice.name}
            loading="lazy"
            className={cn(
              "size-full origin-top transition-transform duration-700 ease-out group-hover:scale-105",
              // Photos de bouteilles (portrait) : cadrées en haut ; illustrations provisoires : entières.
              juice.photo_url.endsWith(".svg") ? "object-contain" : "object-cover object-top",
            )}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <GlassWater className="size-14" aria-hidden="true" />
          </div>
        )}
        {soldOut && (
          <span className="absolute right-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            {STATE_LABELS["epuise"]}
          </span>
        )}
      </div>

      <div className="relative mt-4 flex flex-1 flex-col rounded-2xl border border-border/60 bg-card p-5 shadow-card transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-warm">
        <h3 className="text-lg font-medium text-foreground">{juice.name}</h3>
        {juice.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{juice.description}</p>
        )}

        <div role="radiogroup" aria-label="Format" className="mt-4 grid grid-cols-2 gap-2">
          {juice.variants.map((v) => {
            const selected = v.size === size;
            const out = v.state !== "disponible";
            return (
              <button
                key={v.variant_id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setSize(v.size)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-left transition-colors",
                  selected ? "border-accent bg-accent/10" : "border-border hover:border-accent/60",
                )}
              >
                <span className="block text-sm font-semibold text-foreground">
                  {JUICE_SIZES.find((s) => s.size === v.size)?.label} · {juiceVolume(v.size)}
                </span>
                <span
                  className={cn(
                    "block text-xs",
                    out ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {out ? STATE_LABELS[v.state] : formatPrice(v.price)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto flex items-center justify-between gap-4 pt-5">
          <div>
            <p className="font-bold text-foreground">{formatPrice(variant.price)}</p>
            <p className="text-xs text-muted-foreground">
              {available ? `${variant.stock} restant(s)` : STATE_LABELS[variant.state]}
            </p>
          </div>

          {!available ? (
            <button
              type="button"
              disabled
              aria-label="Indisponible"
              className="flex size-11 items-center justify-center rounded-full text-muted-foreground"
            >
              <ShoppingBag className="size-5" />
            </button>
          ) : inCart ? (
            <div className="flex items-center gap-1 rounded-full bg-secondary p-1">
              <button
                type="button"
                onClick={() => setQuantity(variant.variant_id, inCart.quantity - 1)}
                aria-label="Retirer une bouteille"
                className="flex size-8 items-center justify-center rounded-full text-primary transition-colors hover:bg-card"
              >
                <Minus className="size-4" />
              </button>
              <span
                key={inCart.quantity}
                className="animate-badge-bump w-6 text-center font-bold text-primary"
              >
                {inCart.quantity}
              </span>
              <button
                type="button"
                onClick={handleIncrement}
                aria-label="Ajouter une bouteille"
                className="flex size-8 items-center justify-center rounded-full bg-accent text-accent-foreground transition-transform hover:scale-110"
              >
                <Plus className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              className="flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-all duration-300 hover:scale-105 hover:shadow-warm"
            >
              <ShoppingBag className="size-4" />
              Ajouter
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

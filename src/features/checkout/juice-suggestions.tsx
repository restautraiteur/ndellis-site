import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { GlassWater, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/features/cart/cart-context";
import { juiceCatalogQuery, juiceVolume, type JuiceRow } from "@core/domain/juices/api";
import { formatPrice } from "@core/lib/format";

/** Panier sans jus : propose les jus disponibles (un clic ajoute le format choisi). */
export function JuiceSuggestions() {
  const { data: rows = [] } = useQuery(juiceCatalogQuery());
  const { add } = useCart();
  const juices = useMemo(() => {
    const map = new Map<string, JuiceRow[]>();
    for (const row of rows) {
      if (row.state !== "disponible" || row.stock <= 0) continue;
      map.set(row.product_id, [...(map.get(row.product_id) ?? []), row]);
    }
    return [...map.values()].map((variants) =>
      variants.sort((a, b) => (a.size === "petit" ? -1 : 1) - (b.size === "petit" ? -1 : 1)),
    );
  }, [rows]);

  if (juices.length === 0) return null;

  return (
    <section className="surface-card p-4">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold text-primary">
        <GlassWater className="size-5" /> Un jus frais avec ça ?
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Pressés chaque jour, livrés avec votre commande.
      </p>
      <div className="-mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {juices.map((variants) => {
          const first = variants[0]!;
          return (
            <article
              key={first.product_id}
              className="w-40 shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div className="aspect-[4/3] bg-secondary">
                {first.photo_url ? (
                  <img
                    src={first.photo_url}
                    alt={first.name}
                    loading="lazy"
                    className="size-full object-cover object-top"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground">
                    <GlassWater className="size-8" aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="space-y-1.5 p-2.5">
                <p className="truncate text-sm font-semibold">{first.name}</p>
                {variants.map((v) => (
                  <button
                    key={v.variant_id}
                    type="button"
                    onClick={() => {
                      const label = `${v.name} (${juiceVolume(v.size)})`;
                      add({
                        id: v.variant_id,
                        source: "jus",
                        name: label,
                        category: "jus",
                        price: v.price,
                        day_date: null,
                      });
                      toast.success(`${label} ajouté`);
                    }}
                    className="flex w-full items-center justify-between rounded-lg bg-muted px-2 py-1 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <span>{juiceVolume(v.size)}</span>
                    <span className="flex items-center gap-1">
                      {formatPrice(v.price)} <Plus className="size-3" />
                    </span>
                  </button>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

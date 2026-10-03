import { useState } from "react";
import { Clock, Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@ui/components/ui/badge";
import type { MenuRow } from "@core/domain/menu/api";
import { useCart } from "@/features/cart/cart-context";
import { formatPrice, formatTime, STATE_LABELS, todayISO } from "@core/lib/format";
import { cn } from "@core/lib/utils";

export function ProductCard({ row }: { row: MenuRow }) {
  const { items, add, setQuantity } = useCart();
  const [bump, setBump] = useState(0);
  const inCart = items.find((i) => i.id === row.day_product_id);
  const available = row.state === "disponible";
  const maxQty = row.stock_left;
  const isToday = row.day_date === todayISO();
  const addLabel = isToday ? "Ajouter au panier" : "Précommander";

  const handleAdd = () => {
    add({
      id: row.day_product_id,
      source: "menu",
      name: row.name,
      category: row.category,
      price: row.price,
      day_date: row.day_date,
    });
    setBump((b) => b + 1);
    toast.success(isToday ? `${row.name} ajouté au panier` : `${row.name} ajouté en précommande`);
  };

  const handleIncrement = () => {
    if (!inCart) return;
    if (inCart.quantity >= maxQty) {
      toast.error(`Il ne reste que ${maxQty} portion(s) de ${row.name}.`);
      return;
    }
    setQuantity(row.day_product_id, inCart.quantity + 1);
    setBump((b) => b + 1);
  };

  return (
    <article
      className={cn(
        "group w-[80%] shrink-0 snap-start sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]",
        !available && "opacity-60 grayscale",
      )}
    >
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-secondary shadow-card transition-all duration-500 group-hover:-translate-y-1.5 group-hover:shadow-warm">
        {row.photo_url ? (
          <img
            src={row.photo_url}
            alt={row.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="flex size-full items-center justify-center font-display text-5xl text-muted-foreground">
            {row.name.slice(0, 1)}
          </div>
        )}

        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-1 text-xs font-semibold text-primary shadow-card backdrop-blur">
            <Clock className="size-3.5" aria-hidden="true" />
            {isToday ? "Aujourd'hui" : "Précommande"} · {formatTime(row.close_time)}
          </span>
          {available ? (
            <span className="rounded-full bg-card/90 px-3 py-1 text-xs font-semibold text-primary shadow-card backdrop-blur">
              {row.stock_left} restant(s)
            </span>
          ) : (
            <Badge className="bg-primary text-primary-foreground">{STATE_LABELS[row.state]}</Badge>
          )}
        </div>

        {row.description && (
          <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-sidebar/90 via-sidebar/60 to-transparent px-5 pb-5 pt-12 transition-transform duration-500 ease-out group-hover:translate-y-0 group-focus-within:translate-y-0">
            <p className="line-clamp-3 text-sm text-sidebar-foreground">{row.description}</p>
          </div>
        )}
      </div>

      <div className="relative mt-4 flex items-center gap-4 rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-card transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-warm">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-lg font-medium text-foreground">{row.name}</h4>
          <p className="mt-0.5 font-bold text-foreground">{formatPrice(row.price)}</p>
        </div>
        <span className="h-10 w-px shrink-0 bg-border" aria-hidden="true" />

        <div className="relative shrink-0">
          {!available ? (
            <button
              type="button"
              disabled
              aria-label="Indisponible"
              title="Indisponible"
              className="flex size-11 items-center justify-center rounded-full text-muted-foreground"
            >
              <ShoppingBag className="size-5" />
            </button>
          ) : inCart ? (
            <div className="flex items-center gap-1 rounded-full bg-secondary p-1">
              <button
                type="button"
                onClick={() => setQuantity(row.day_product_id, inCart.quantity - 1)}
                aria-label="Retirer une unité"
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
                aria-label="Ajouter une unité"
                className="flex size-8 items-center justify-center rounded-full bg-accent text-accent-foreground transition-transform hover:scale-110"
              >
                <Plus className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              aria-label={addLabel}
              title={addLabel}
              className="flex size-11 items-center justify-center rounded-full text-primary transition-all duration-300 hover:scale-110 hover:bg-accent hover:text-accent-foreground hover:shadow-warm"
            >
              <ShoppingBag className="size-5" />
            </button>
          )}

          {bump > 0 && (
            <span key={bump} aria-hidden="true" className="pointer-events-none absolute inset-0">
              <span className="animate-cart-ring absolute inset-0 rounded-full bg-accent" />
              <span className="animate-cart-fly absolute left-1/2 top-0 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
                +1
              </span>
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

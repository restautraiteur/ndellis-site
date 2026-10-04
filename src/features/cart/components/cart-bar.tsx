import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { Button } from "@ui/components/ui/button";
import { useCart } from "@/features/cart/cart-context";
import { formatPrice } from "@core/lib/format";

export function CartBar() {
  const { count, total } = useCart();
  if (count === 0) return null;
  return (
    <div className="no-print sticky bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="text-sm">
          <p className="font-semibold">
            {count} article(s) — {formatPrice(total)}
          </p>
          <p className="text-muted-foreground">Précommande non remboursable</p>
        </div>
        <Button asChild>
          <Link to="/commande">
            <ShoppingBag className="mr-2 size-4" />
            Voir le panier
          </Link>
        </Button>
      </div>
    </div>
  );
}

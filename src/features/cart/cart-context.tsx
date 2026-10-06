import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { todayISO } from "@core/lib/format";

export type CartItem = {
  /** `day_product_id` pour un produit du menu, `variant_id` pour un format de jus. */
  id: string;
  source: "menu" | "jus";
  name: string;
  category: string;
  price: number;
  /** Jour du menu ; `null` pour les jus du catalogue (livrés avec la commande). */
  day_date: string | null;
  quantity: number;
};

/** Paniers enregistrés avant l'ajout des jus : `day_product_id` au lieu de `id`. */
type LegacyCartItem = Omit<CartItem, "id" | "source"> & { day_product_id: string };

function normalize(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item: CartItem | LegacyCartItem) =>
    "id" in item ? item : { ...item, id: item.day_product_id, source: "menu" as const },
  );
}

type CartContextValue = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  total: number;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "traiteur.cart.v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  // On n'enregistre qu'après avoir relu le panier : sinon le panier vide du premier affichage
  // écraserait celui que le client avait déjà rempli.
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        // Les plats d'une journée déjà passée ne peuvent plus être commandés : on les retire.
        const all = normalize(JSON.parse(raw));
        const today = todayISO();
        const kept = all.filter((i) => !i.day_date || i.day_date >= today);
        setItems(kept);
        if (kept.length < all.length) {
          toast.info(
            `${all.length - kept.length} plat(s) d'une journée passée retiré(s) de votre panier.`,
          );
        }
      }
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, loaded]);

  const add = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i));
      }
      return [...prev, { ...item, quantity }];
    });
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, quantity } : i)),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      add,
      setQuantity,
      remove,
      clear,
      total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      count: items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    [items, add, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

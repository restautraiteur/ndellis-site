import { db } from "@core/lib/db";
import { CLIENT } from "@/config/client";

export type PlaceOrderPayload = {
  customer: {
    first_name: string;
    last_name: string;
    phone: string;
    address: string;
    address_extra?: string | undefined;
    landmark?: string | undefined;
    instructions?: string | undefined;
    payment_method?: string | undefined;
    payment_reference?: string | undefined;
    /** Code abonné : un plat par jour ouvré est alors pris en charge par l'abonnement. */
    subscription_pin?: string | undefined;
  };
  /** Plat du menu (`day_product_id`) ou format de jus du catalogue (`variant_id`). */
  items: (({ day_product_id: string } | { variant_id: string }) & { quantity: number })[];
};

export async function placeOrder(payload: PlaceOrderPayload) {
  const { data, error } = await db.rpc("place_order", {
    p_customer: payload.customer,
    p_items: payload.items,
  });
  if (error) throw new Error(error.message);
  return data as {
    reference: string;
    total: number;
    order_id: string;
    order_type: string;
    deposit_required: number;
    subscription: { covered_days: string[]; discount: number; remaining: number } | null;
  };
}

export const PAYMENT_NUMBER = CLIENT.whatsappDisplay;

export const DEPOSIT_AMOUNT = 1500;

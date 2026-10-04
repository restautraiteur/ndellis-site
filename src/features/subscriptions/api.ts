import { queryOptions } from "@tanstack/react-query";
import { db, run } from "@core/lib/db";

export type SubscriptionPlan = {
  id: string;
  name: string;
  meals_count: number;
  price: number;
  delivery_included: boolean;
};

/** Repas utilisé : commandé (« prevu »), livré (« pris »). */
export type SubscriptionMeal = { date: string; status: "prevu" | "pris"; dish: string | null };

export type MySubscription = {
  id: string;
  plan_name: string;
  meals_count: number;
  price: number;
  customer_name: string;
  start_date: string;
  /** Fin estimée si l'abonné commande chaque jour ouvré. */
  end_date: string | null;
  status: "en_attente" | "active" | "annulee";
  payment_status: "non_paye" | "acompte" | "paye";
  payment_mode: "telephone" | "en_ligne";
  amount_paid: number;
  remaining: number;
  meals: SubscriptionMeal[];
};

export type PaymentChoice = "total" | "moitie";
export type PaymentMode = "telephone" | "en_ligne";

export type SubscriptionCheck =
  | { ok: false; error: string }
  | {
      ok: true;
      plan_name: string;
      customer_name: string;
      remaining: number;
      remaining_after: number;
      balance: number;
      days: { date: string; covered: boolean; reason: string | null }[];
    };

export const plansQuery = () =>
  queryOptions({
    queryKey: ["subscription_plans"],
    queryFn: () =>
      run<SubscriptionPlan[]>(
        db
          .from("subscription_plans")
          .select("id, name, meals_count, price, delivery_included")
          .eq("active", true)
          .order("sort_order")
          .order("meals_count", { ascending: false }),
      ),
  });

/** Jours de repas à partir d'une date : lundi → vendredi, hors jours fermés (calcul côté serveur). */
export const subscriptionDatesQuery = (start: string, count: number) =>
  queryOptions({
    queryKey: ["subscription_dates", start, count],
    enabled: !!start && count > 0,
    queryFn: async () => {
      const { data, error } = await db.rpc("subscription_dates", {
        p_start: start,
        p_count: count,
      });
      if (error) throw new Error(error.message);
      return (data ?? []) as string[];
    },
  });

export async function createSubscription(input: {
  planId: string;
  start: string;
  name: string;
  phone: string;
  address: string;
  paymentChoice: PaymentChoice;
  paymentMode: PaymentMode;
}) {
  const { data, error } = await db.rpc("create_subscription", {
    p_plan: input.planId,
    p_start: input.start,
    p_customer: {
      name: input.name,
      phone: input.phone,
      address: input.address,
      payment_choice: input.paymentChoice,
      payment_mode: input.paymentMode,
    },
  });
  if (error) throw new Error(error.message);
  return data as {
    id: string;
    plan_name: string;
    price: number;
    meals_count: number;
    /** Code abonné à 4 chiffres, à donner à chaque commande. */
    pin: string;
    payment_choice: PaymentChoice;
    payment_mode: PaymentMode;
    /** Premier versement : total ou moitié. */
    amount_due: number;
    start_date: string;
    end_date: string;
    dates: string[];
  };
}

/** Le panier vérifie quels jours l'abonnement prend en charge (téléphone + code). */
export async function checkSubscription(phone: string, pin: string, days: string[]) {
  const { data, error } = await db.rpc("check_subscription", {
    p_phone: phone,
    p_pin: pin,
    p_days: days,
  });
  if (error) throw new Error(error.message);
  return data as SubscriptionCheck;
}

/** Suivi : téléphone + code abonné (le numéro seul ne suffit pas). */
export async function lookupSubscriptions(phone: string, pin: string) {
  const { data, error } = await db.rpc("lookup_subscriptions", { p_phone: phone, p_pin: pin });
  if (error) throw new Error(error.message);
  const result = data as { ok: boolean; error?: string; subscriptions?: MySubscription[] };
  if (!result.ok) throw new Error(result.error ?? "Abonnement introuvable.");
  return result.subscriptions ?? [];
}

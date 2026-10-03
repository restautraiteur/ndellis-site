import { queryOptions } from "@tanstack/react-query";
import { db, run } from "@core/lib/db";

export type SubscriptionPlan = {
  id: string;
  name: string;
  meals_count: number;
  price: number;
  delivery_included: boolean;
};

export type SubscriptionMeal = { date: string; status: "prevu" | "pris" | "annule" };

export type MySubscription = {
  id: string;
  plan_name: string;
  meals_count: number;
  price: number;
  customer_name: string;
  start_date: string;
  end_date: string;
  status: "en_attente" | "active" | "annulee";
  payment_status: "non_paye" | "paye";
  meals: SubscriptionMeal[];
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
}) {
  const { data, error } = await db.rpc("create_subscription", {
    p_plan: input.planId,
    p_start: input.start,
    p_customer: { name: input.name, phone: input.phone, address: input.address },
  });
  if (error) throw new Error(error.message);
  return data as {
    id: string;
    plan_name: string;
    price: number;
    start_date: string;
    end_date: string;
    dates: string[];
  };
}

export async function lookupSubscriptions(phone: string) {
  const { data, error } = await db.rpc("lookup_subscriptions", { p_phone: phone });
  if (error) throw new Error(error.message);
  return (data ?? []) as MySubscription[];
}

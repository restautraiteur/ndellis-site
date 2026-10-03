import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const startPayment = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@core/integrations/supabase/client.server");
    const { createInvoice, requestOrigin } = await import("./paydunya.server");
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, reference, total, order_type, deposit_required, payment_status")
      .eq("id", data.orderId)
      .maybeSingle();
    if (error || !order) throw new Error("Commande introuvable.");
    if (order.payment_status === "paye" || order.payment_status === "acompte_paye")
      throw new Error("Cette commande est déjà payée.");
    const amount = order.order_type === "precommande" ? order.deposit_required : order.total;
    const origin = requestOrigin();
    const invoice = await createInvoice({
      amount,
      orderId: order.id,
      origin,
      description:
        order.order_type === "precommande"
          ? `Acompte précommande ${order.reference}`
          : `Commande ${order.reference}`,
    });
    const { error: saveError } = await supabaseAdmin
      .from("orders")
      .update({ paydunya_token: invoice.token })
      .eq("id", order.id);
    if (saveError)
      throw new Error("Le paiement n'a pas pu être associé à votre commande. Réessayez.");
    return { url: invoice.url };
  });

/** Paiement en ligne d'un abonnement : premier versement (total ou moitié) puis solde. */
export const startSubscriptionPayment = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ subscriptionId: z.string().uuid(), pin: z.string().regex(/^\d{4}$/) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@core/integrations/supabase/client.server");
    const { createInvoice, requestOrigin } = await import("./paydunya.server");
    const { data: sub, error } = await supabaseAdmin
      .from("subscriptions")
      .select("id, plan_name, price, amount_paid, payment_choice, pin, pin_failures, status")
      .eq("id", data.subscriptionId)
      .maybeSingle();
    if (error || !sub || sub.status === "annulee") throw new Error("Abonnement introuvable.");
    if (sub.pin_failures >= 5)
      throw new Error("Code bloqué après trop d'essais. Contactez le restaurant.");
    if (sub.pin !== data.pin) {
      await supabaseAdmin
        .from("subscriptions")
        .update({ pin_failures: sub.pin_failures + 1 })
        .eq("id", sub.id);
      throw new Error("Code abonné incorrect.");
    }
    const balance = sub.price - sub.amount_paid;
    if (balance <= 0) throw new Error("Cet abonnement est déjà réglé.");
    const amount =
      sub.amount_paid === 0 && sub.payment_choice === "moitie" ? Math.ceil(sub.price / 2) : balance;
    const { data: payment, error: insertError } = await supabaseAdmin
      .from("subscription_payments")
      .insert({ subscription_id: sub.id, amount, method: "paydunya", status: "en_attente" })
      .select("id")
      .single();
    if (insertError || !payment) throw new Error("Le paiement n'a pas pu démarrer. Réessayez.");
    const invoice = await createInvoice({
      amount,
      subscriptionPaymentId: payment.id,
      origin: requestOrigin(),
      description: `Abonnement ${sub.plan_name}${amount < balance ? " (acompte)" : ""}`,
      cancelPath: "/abonnement?paiement=annule#suivi",
      returnPath: "/abonnement",
    });
    await supabaseAdmin
      .from("subscription_payments")
      .update({ paydunya_token: invoice.token })
      .eq("id", payment.id);
    return { url: invoice.url };
  });

export const checkPayment = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string().min(4).max(100) }).parse(d))
  .handler(async ({ data }) => {
    const { syncPayment } = await import("./paydunya.server");
    return syncPayment(data.token);
  });

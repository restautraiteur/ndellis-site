import { getRequest } from "@tanstack/react-start/server";
import { CLIENT } from "@/config/client";

/**
 * Mode PayDunya : « test » (PAYDUNYA_MODE=test, avec les clés de test, aucun vrai argent) ou réel
 * (par défaut). Les clés de test et les clés réelles ne sont pas interchangeables.
 */
const isTestMode = () => (process.env["PAYDUNYA_MODE"] ?? "").toLowerCase() === "test";
const base = () =>
  isTestMode() ? "https://app.paydunya.com/sandbox-api/v1" : "https://app.paydunya.com/api/v1";

/** Clé lue sur Vercel, sans espaces ni retours à la ligne collés par erreur. */
const key = (name: string) => (process.env[name] ?? "").trim();

function headers() {
  return {
    "Content-Type": "application/json",
    "PAYDUNYA-MASTER-KEY": key("PAYDUNYA_MASTER_KEY"),
    "PAYDUNYA-PRIVATE-KEY": key("PAYDUNYA_PRIVATE_KEY"),
    "PAYDUNYA-TOKEN": key("PAYDUNYA_TOKEN"),
  };
}

export async function createInvoice(input: {
  amount: number;
  description: string;
  origin: string;
  /** Commande payée, ou abonnement (`subscriptionPaymentId`). */
  orderId?: string;
  subscriptionPaymentId?: string;
  /** Pages de retour (par défaut : panier et confirmation de commande). */
  cancelPath?: string;
  returnPath?: string;
}) {
  if (!key("PAYDUNYA_MASTER_KEY") || !key("PAYDUNYA_PRIVATE_KEY") || !key("PAYDUNYA_TOKEN")) {
    throw new Error(
      "Le paiement est momentanément indisponible. Contactez-nous pour finaliser votre commande.",
    );
  }
  const res = await fetch(`${base()}/checkout-invoice/create`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      invoice: { total_amount: input.amount, description: input.description },
      store: { name: CLIENT.name },
      actions: {
        cancel_url: `${input.origin}${input.cancelPath ?? "/commande?paiement=annule"}`,
        return_url: `${input.origin}${input.returnPath ?? "/confirmation"}`,
        callback_url: `${input.origin}/api/public/paydunya-ipn`,
      },
      custom_data: input.subscriptionPaymentId
        ? { subscription_payment_id: input.subscriptionPaymentId }
        : { order_id: input.orderId },
    }),
  });
  const json = (await res.json().catch(() => null)) as {
    response_code?: string;
    response_text?: string;
    token?: string;
  } | null;
  if (
    !res.ok ||
    json?.response_code !== "00" ||
    !json.token ||
    !json.response_text?.startsWith("https://app.paydunya.com/")
  ) {
    console.error("PayDunya invoice rejected", {
      status: res.status,
      code: json?.response_code,
      reason: json?.response_text?.slice(0, 250),
    });
    // Clés refusées par PayDunya (mauvaise clé, ou clé réelle en mode test et inversement) : on le
    // dit clairement, sans afficher les clés.
    const keyError = /key|cl[ée]|token|master|private/i.test(json?.response_text ?? "");
    throw new Error(
      keyError
        ? `Le paiement n'a pas pu démarrer : configuration PayDunya incorrecte (${json?.response_code ?? "?"} · ${json?.response_text?.slice(0, 80) ?? ""}, mode ${isTestMode() ? "test" : "réel"}). Votre panier est conservé.`
        : "Le paiement n'a pas pu démarrer. Votre panier est conservé ; réessayez ou contactez-nous.",
    );
  }
  return { url: json.response_text, token: json.token };
}

export async function confirmInvoice(token: string) {
  const res = await fetch(`${base()}/checkout-invoice/confirm/${encodeURIComponent(token)}`, {
    headers: headers(),
  });
  const json = (await res.json()) as {
    status?: string;
    invoice?: { total_amount?: number | string };
    custom_data?: { order_id?: string };
  };
  return {
    status: json.status ?? "unknown",
    amount: Number(json.invoice?.total_amount ?? 0),
    orderId: json.custom_data?.order_id,
  };
}

/** Paiement en ligne d'un abonnement : le paiement passe à « payé » (le montant encaissé et la
 * confirmation de l'abonnement suivent côté base). */
async function syncSubscriptionPayment(token: string) {
  const { supabaseAdmin } = await import("@core/integrations/supabase/client.server");
  const { data: payment } = await supabaseAdmin
    .from("subscription_payments")
    .select("id, status")
    .eq("paydunya_token", token)
    .maybeSingle();
  if (!payment) return { status: "introuvable" as const };
  if (payment.status === "paye") return { status: "completed" as const };
  const result = await confirmInvoice(token);
  if (result.status === "completed") {
    await supabaseAdmin
      .from("subscription_payments")
      .update({ status: "paye", amount: result.amount })
      .eq("id", payment.id);
    return { status: "completed" as const };
  }
  if (result.status === "cancelled" || result.status === "failed") {
    await supabaseAdmin
      .from("subscription_payments")
      .update({ status: "echec" })
      .eq("id", payment.id);
  }
  return { status: result.status };
}

/** Confirms with PayDunya and updates the order. Returns the payment status. */
export async function syncPayment(token: string) {
  const { supabaseAdmin } = await import("@core/integrations/supabase/client.server");
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, order_type, payment_status")
    .eq("paydunya_token", token)
    .maybeSingle();
  if (!order) return syncSubscriptionPayment(token);
  const result = await confirmInvoice(token);
  if (result.status === "completed") {
    const paid = order.order_type === "precommande" ? "acompte_paye" : "paye";
    await supabaseAdmin
      .from("orders")
      .update({ payment_status: paid, paid_amount: result.amount })
      .eq("id", order.id);
    return { status: "completed" as const };
  }
  if (result.status === "cancelled" || result.status === "failed") {
    await supabaseAdmin
      .from("orders")
      .update({ payment_status: "echec_paiement" })
      .eq("id", order.id);
  }
  return { status: result.status };
}

/** Adresse du site d'où vient la demande (pages de retour PayDunya). */
export function requestOrigin() {
  const request = getRequest();
  const requestOrigin = request.headers.get("origin");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const requestHost = forwardedHost ?? request.headers.get("host") ?? new URL(request.url).host;
  const origin =
    requestOrigin && new URL(requestOrigin).host === requestHost
      ? requestOrigin
      : `${request.headers.get("x-forwarded-proto") ?? "https"}://${requestHost}`;
  if (!origin.startsWith("https://") && !origin.startsWith("http://localhost:")) {
    throw new Error("Adresse de paiement invalide. Rechargez la page et réessayez.");
  }
  return origin;
}

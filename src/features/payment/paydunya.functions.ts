import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

export const startPayment = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@core/integrations/supabase/client.server");
    const { createInvoice } = await import("./paydunya.server");
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, reference, total, order_type, deposit_required, payment_status")
      .eq("id", data.orderId)
      .maybeSingle();
    if (error || !order) throw new Error("Commande introuvable.");
    if (order.payment_status === "paye" || order.payment_status === "acompte_paye")
      throw new Error("Cette commande est déjà payée.");
    const amount = order.order_type === "precommande" ? order.deposit_required : order.total;
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

export const checkPayment = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string().min(4).max(100) }).parse(d))
  .handler(async ({ data }) => {
    const { syncPayment } = await import("./paydunya.server");
    return syncPayment(data.token);
  });

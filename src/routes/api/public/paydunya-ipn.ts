import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "crypto";

export const Route = createFileRoute("/api/public/paydunya-ipn")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const form = await request.formData().catch(() => null);
        const hash = form?.get("data[hash]")?.toString() ?? "";
        const token = form?.get("data[invoice][token]")?.toString() ?? "";
        const expected = createHash("sha512")
          .update(process.env["PAYDUNYA_MASTER_KEY"] ?? "")
          .digest("hex");
        if (!hash || hash !== expected || !token) {
          return new Response("Invalid", { status: 401 });
        }
        const { syncPayment } = await import("@/features/payment/paydunya.server");
        // Re-confirm directly with PayDunya rather than trusting the payload
        await syncPayment(token);
        return new Response("ok");
      },
    },
  },
});

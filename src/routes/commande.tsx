import { createFileRoute } from "@tanstack/react-router";

import { CheckoutPage } from "@/features/checkout/checkout-page";

export const Route = createFileRoute("/commande")({
  head: () => ({
    meta: [
      { title: "Ma précommande — Traiteur" },
      {
        name: "description",
        content:
          "Vérifiez votre panier, renseignez vos coordonnées de livraison et validez votre précommande en ligne.",
      },
      { property: "og:title", content: "Ma précommande — Traiteur" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content: "Récapitulatif du panier et validation de la précommande.",
      },
    ],
  }),
  component: CheckoutPage,
});

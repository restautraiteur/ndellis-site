import { createFileRoute } from "@tanstack/react-router";

import { SubscriptionPage } from "@/features/subscriptions/subscription-page";

export const Route = createFileRoute("/abonnement")({
  head: () => ({
    meta: [
      { title: "Abonnement — Mangez ici toute la semaine" },
      {
        name: "description",
        content:
          "Réservez vos repas d'avance avec une formule d'abonnement : choisissez votre formule et votre date de début.",
      },
      { property: "og:title", content: "Abonnement — Mangez ici toute la semaine" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: SubscriptionPage,
});

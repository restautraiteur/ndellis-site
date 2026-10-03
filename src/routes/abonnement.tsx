import { createFileRoute } from "@tanstack/react-router";

import { SubscriptionPage } from "@/features/subscriptions/subscription-page";

export const Route = createFileRoute("/abonnement")({
  head: () => ({
    meta: [
      { title: "Abonnement repas — votre déjeuner réglé d'avance" },
      {
        name: "description",
        content:
          "Abonnez-vous au plat du jour : choisissez un nombre de repas et un jour de départ, le déjeuner est livré chaque midi du lundi au vendredi.",
      },
      { property: "og:title", content: "Abonnement repas — votre déjeuner réglé d'avance" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: SubscriptionPage,
});

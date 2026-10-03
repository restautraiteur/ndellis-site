import { createFileRoute } from "@tanstack/react-router";

import { HomePage } from "@/features/home/home-page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Menu de la semaine — Précommande traiteur à Dakar" },
      {
        name: "description",
        content:
          "Consultez le menu de la semaine, choisissez vos plats et jus, et précommandez en ligne sans créer de compte. Livraison du lundi au vendredi.",
      },
      { property: "og:title", content: "Menu de la semaine — Précommande traiteur" },
      {
        property: "og:description",
        content: "Plats et jus disponibles chaque jour. Précommandez en quelques clics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

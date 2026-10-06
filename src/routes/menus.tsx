import { createFileRoute } from "@tanstack/react-router";

import { MonthMenuPage } from "@/features/menu/month-menu-page";

export const Route = createFileRoute("/menus")({
  head: () => ({
    meta: [
      { title: "Les menus du mois" },
      {
        name: "description",
        content:
          "Tous les plats du mois en calendrier, du lundi au vendredi : choisissez votre plat pour chaque jour.",
      },
      { property: "og:title", content: "Les menus du mois" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: MonthMenuPage,
});

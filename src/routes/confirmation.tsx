import { createFileRoute } from "@tanstack/react-router";

import { ConfirmationPage } from "@/features/checkout/confirmation-page";

export const Route = createFileRoute("/confirmation")({
  head: () => ({
    meta: [
      { title: "Précommande confirmée — Traiteur" },
      {
        name: "description",
        content: "Votre précommande est enregistrée. Retrouvez votre référence et le détail.",
      },
      { property: "og:title", content: "Précommande confirmée — Traiteur" },
      { property: "og:description", content: "Référence et détail de votre précommande." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConfirmationPage,
});

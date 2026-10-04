/**
 * Configuration propre au client. Les fonctionnalités génériques lisent ces valeurs au lieu d'écrire
 * le nom ou les contacts du restaurant en dur : c'est ce fichier qui change d'un client à l'autre
 * (avec le logo `src/core/assets/logo.png`, les couleurs de `src/styles.css` et les photos).
 */
export const CLIENT = {
  /** Nom affiché aux clients (messages, paiement, textes). */
  name: "Ndelli's Traiteur",
  /** Nom complet (pied de page, texte alternatif du logo). */
  legalName: "Le Ndelli's NDS Traiteur",
  /** Numéro WhatsApp au format international, sans « + » ni espaces. */
  whatsapp: "221781867272",
  /** Le même numéro tel qu'affiché sur le site. */
  whatsappDisplay: "78 186 72 72",
  /** Ville ou zone de livraison. */
  city: "Dakar",
  /** Abonnements repas activés sur le site. */
  subscriptions: true,
} as const;

/** Lien WhatsApp du restaurant. */
export const WHATSAPP_URL = `https://wa.me/${CLIENT.whatsapp}`;

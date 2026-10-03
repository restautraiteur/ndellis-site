/**
 * Configuration propre au client. Les fonctionnalités génériques (abonnement…) lisent ces valeurs
 * au lieu d'écrire le nom du restaurant en dur : c'est ce fichier qui change d'un client à l'autre.
 */
export const CLIENT = {
  /** Nom affiché aux clients. */
  name: "Ndelli's Traiteur",
  /** Numéro WhatsApp au format international, sans « + » ni espaces. */
  whatsapp: "221781867272",
  /** Abonnements (« Mangez ici toute la semaine ») activés sur le site. */
  subscriptions: true,
} as const;

# ndellis-site

Ce dépôt contient le **site client** de Ndelli's Traiteur : accueil, menu de la semaine, jus, panier, commande et paiement PayDunya.

Il fait partie de la plateforme **restautraiteur** : chaque client a deux dépôts, `<client>-site` et
`<client>-backoffice`. Le dépôt jumeau est `restautraiteur/ndellis-backoffice`.

## Lancer en local

```bash
npm install      # ou : bun install
npm run dev      # http://localhost:8080
```

Le fichier `.env` (clés publiques uniquement) pointe vers la base Supabase de Ndelli's.

## Organisation

```
src/
├── routes/      une page = un fichier (URL et <head>)
├── features/    le code de chaque fonctionnalité
├── components/  composants propres à ce dépôt
├── core/        commun : accès à la base (@core/lib/db), formats, requêtes du menu et des jus, client Supabase
└── ui/          commun : composants d'interface shadcn (@ui/components/ui/…)
doc/             documentation (sommaire : doc/README.md)
```

`src/core` et `src/ui` sont identiques dans les deux dépôts du client : une correction doit être reportée dans
le dépôt jumeau.

## Variables d'environnement (Vercel)

| Variable | Rôle |
| --- | --- |
| `VITE_SUPABASE_URL`, `SUPABASE_URL` | Adresse de la base Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PUBLISHABLE_KEY` | Clé publique Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé serveur (secrète) |
| `PAYDUNYA_MASTER_KEY`, `PAYDUNYA_PRIVATE_KEY`, `PAYDUNYA_TOKEN` | Paiement PayDunya (production, compte du client) |

Les secrets ne vont jamais dans Git : uniquement dans Vercel, ou dans un fichier `.env` hors dépôt.

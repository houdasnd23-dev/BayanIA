# BayanIA Web 🇲🇦⚖️

Application web de **BayanIA**, l'assistant juridique intelligent dédié au droit
marocain. Développée avec **Next.js** et **React**, elle consomme l'API backend
FastAPI (`bayania-backend`) pour la conversation juridique, la recherche de
sources, l'analyse de documents et l'administration.

---

## 🛠️ Stack technique

- **Framework :** Next.js 15 (App Router, Turbopack)
- **Langage :** TypeScript
- **UI :** React 19
- **Style :** Tailwind CSS
- **Animations :** Framer Motion
- **Icônes :** Lucide React

---

## 📁 Structure du projet

```
bayania-frontend/
├── app/                          # Routes Next.js (App Router)
│   ├── page.tsx                  # Page d'accueil
│   ├── layout.tsx                # Layout racine
│   ├── connexion/
│   │   └── page.tsx              # Authentification
│   ├── inscription/
│   │   └── page.tsx              # Création de compte
│   ├── dashboard/
│   │   ├── page.tsx              # Conversation juridique (chat RAG)
│   │   └── layout.tsx            # Layout de la zone utilisateur connecté
│   ├── search/
│   │   └── page.tsx              # Recherche de sources juridiques
│   ├── history/
│   │   ├── page.tsx              # Historique des questions
│   │   └── layout.tsx
│   ├── analyse/
│   │   └── page.tsx              # Analyse de documents (vue liste)
│   ├── analyse-pdf/
│   │   ├── page.tsx              # Analyse d'un PDF (upload + résultat)
│   │   └── layout.tsx
│   ├── admin/
│   │   ├── page.tsx              # Interface d'administration
│   │   └── layout.tsx            # Layout de la zone admin
│   ├── compte/
│   │   ├── page.tsx              # Profil utilisateur
│   │   └── layout.tsx
│   ├── acces-refuse/
│   │   └── page.tsx              # Page d'erreur 403 (accès non autorisé)
│   └── fonts/                    # Polices locales
├── components/
│   ├── HeroConversation.tsx      # Composant d'accueil (aperçu du chat)
│   ├── HomePreviewSlider.tsx     # Carrousel de la page d'accueil
│   ├── auth/
│   │   ├── AdminRoute.tsx        # Garde de route réservée aux administrateurs
│   │   ├── ProtectedRoute.tsx    # Garde de route réservée aux utilisateurs connectés
│   │   └── registerhero.tsx
│   └── layout/
│       ├── Navbar.tsx
│       └── Footer.tsx
├── src/
│   └── lib/
│       └── api.ts                # Client HTTP unique (token, endpoints, gestion des erreurs)
├── public/                       # Assets statiques (images, icônes)
├── next.config.js                # En-têtes de sécurité (CSP, X-Frame-Options, etc.)
├── tailwind.config.ts            # Palette de couleurs (navy/gold), tokens partagés avec le mobile
└── tsconfig.json
```

> ℹ️ Contrairement au mobile (`bayania-mobile`, un module par domaine dans
> `src/lib/api/`), le client HTTP web est regroupé dans un seul fichier
> `src/lib/api.ts`.

---

## ⚙️ Variables d'environnement

L'application lit l'URL du backend via une variable d'environnement publique
Next.js :

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Créer un fichier `.env.local` à la racine de `bayania-frontend/` avec cette
variable, pointée vers votre backend local (`http://localhost:8000`) ou vers
l'instance déployée sur Railway en production. En son absence, le client API
retombe par défaut sur `http://localhost:8000`.

---

## 🚀 Lancement local

1. Installer les dépendances :
   ```bash
   npm install
   ```
2. S'assurer que le backend BayanIA tourne (voir `bayania-backend/README.md`)
   et que `NEXT_PUBLIC_API_URL` pointe vers celui-ci si différent du défaut.
3. Démarrer le serveur de développement :
   ```bash
   npm run dev
   ```
4. Ouvrir [http://localhost:3000](http://localhost:3000).

### Build de production

```bash
npm run build
npm run start
```

---

## 🔒 En-têtes de sécurité

`next.config.js` configure, via la fonction `headers()`, une politique de
sécurité du contenu (CSP) ainsi que `X-Content-Type-Options`,
`X-Frame-Options`, `Referrer-Policy` et `Permissions-Policy`. La directive
`connect-src` de la CSP doit inclure l'URL du backend en production
(actuellement `https://bayania-production.up.railway.app`) — à mettre à jour si
l'URL Railway change.

---

## 🎨 Thème

La palette de couleurs (navy / gold) est définie dans `tailwind.config.ts` et
partagée en amont sur Figma avec la version mobile (`bayania-mobile`). Toute
modification doit être répercutée côté mobile (`theme.js` et
`components/layout/theme.ts`) pour rester cohérente entre les deux plateformes.

---

## 🔗 Backend

Cette application ne fonctionne pas de manière autonome : elle nécessite l'API
BayanIA (`bayania-backend/`) démarrée et accessible à l'URL renseignée dans
`NEXT_PUBLIC_API_URL`. Voir la documentation technique du dépôt
(`DOCUMENTATION_TECHNIQUE.md`) pour l'architecture globale et les endpoints
exposés.

---

## ☁️ Déploiement

Le frontend est déployé sur **Vercel**. Le déploiement se déclenche
automatiquement sur push vers la branche principale ; penser à renseigner
`NEXT_PUBLIC_API_URL` dans les variables d'environnement du projet Vercel
(pointant vers le backend Railway en production).
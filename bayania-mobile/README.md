# BayanIA Mobile 🇲🇦⚖️

Application mobile de **BayanIA**, l'assistant juridique intelligent dédié au droit
marocain. Développée avec **React Native** et **Expo**, elle consomme la même API
backend FastAPI que l'application web et propose une expérience équivalente
(conversation juridique, historique, analyse de documents, administration).

---

## 🛠️ Stack technique

- **Framework :** React Native + Expo (SDK 57)
- **Routage :** Expo Router (routage par fichiers, identique en esprit à Next.js)
- **Langage :** TypeScript
- **Style :** NativeWind (Tailwind pour React Native)
- **Stockage local :** `@react-native-async-storage/async-storage` (token JWT, préférences)
- **Icônes :** `@expo/vector-icons`

---

## 📁 Structure du projet

```
bayania-mobile/
├── app/                          # Routes Expo Router (file-based routing)
│   ├── index.tsx                 # Écran d'accueil
│   ├── layout.tsx                 # Layout racine (providers globaux)
│   ├── connexion/
│   │   └── index.tsx              # Authentification
│   ├── inscription/
│   │   └── index.tsx              # Création de compte
│   ├── dashboard/
│   │   ├── index.tsx              # Conversation juridique (chat RAG)
│   │   └── layout.tsx             # Layout de la zone utilisateur connecté
│   ├── search/
│   │   └── index.tsx              # Recherche de sources juridiques
│   ├── history/
│   │   └── index.tsx              # Historique des questions
│   ├── analyse/
│   │   └── index.tsx              # Analyse de documents (vue liste)
│   ├── analyse-pdf/
│   │   └── index.tsx              # Analyse d'un PDF (upload + résultat)
│   ├── admin/
│   │   ├── index.tsx              # Interface d'administration
│   │   └── layout.tsx             # Layout de la zone admin
│   └── compte/
│       └── index.tsx              # Profil utilisateur
├── components/
│   ├── HeroConversation.tsx       # Composant d'accueil (aperçu du chat)
│   ├── HomePreviewSlider.tsx      # Carrousel de la page d'accueil
│   ├── auth/
│   │   └── registerhero.tsx
│   └── layout/
│       ├── Navbar.tsx
│       ├── Footer.tsx
│       └── theme.ts               # Constantes de couleurs/typo utilisées par les écrans
├── src/
│   └── lib/
│       ├── api.ts                 # Client HTTP de base (token, gestion des erreurs)
│       └── api/                   # Un module par domaine métier
│           ├── auth.ts
│           ├── questions.ts
│           ├── sources.ts
│           ├── document.ts
│           ├── admin.ts
│           └── users.ts
├── assets/
│   ├── images/
│   ├── features/
│   └── screenshots/
├── scripts/
│   └── reset-project.js
├── theme.js                       # Config NativeWind/Tailwind (palette navy/gold, tokens partagés avec le web)
├── app.json                       # Configuration Expo
├── eas.json                       # Configuration EAS Build
└── babel.config.js
```

> ℹ️ Deux fichiers de thème coexistent : `theme.js` (racine) configure NativeWind
> côté build, tandis que `components/layout/theme.ts` exporte les constantes
> (`colors`, `fonts`) réellement importées dans les écrans — pense à modifier
> les deux si tu changes la palette.

---

## ⚙️ Variables d'environnement

L'application lit l'URL du backend via une variable d'environnement publique Expo :

```
EXPO_PUBLIC_API_URL=http://localhost:8000
```

Créer un fichier `.env` à la racine de `bayania-mobile/` avec cette variable,
pointée vers votre backend local (`http://localhost:8000`) ou vers l'instance
déployée sur Railway en production.

> ⚠️ Sur un émulateur Android, `localhost` doit généralement être remplacé par
> `10.0.2.2`. Sur un appareil physique connecté au même réseau local, utiliser
> l'adresse IP locale de la machine hébergeant le backend (ex. `192.168.1.15`).

---

## 🚀 Lancement local

1. Installer les dépendances :
   ```bash
   npm install
   ```
2. S'assurer que le backend BayanIA tourne (voir `bayania-backend/README.md`)
   et que `EXPO_PUBLIC_API_URL` pointe vers celui-ci.
3. Démarrer le serveur de développement Expo :
   ```bash
   npx expo start
   ```
4. Ouvrir l'application via :
   - **Expo Go** (scan du QR code) pour un test rapide sur un appareil physique ;
   - un **émulateur Android** ou un **simulateur iOS** ;
   - un **development build** pour tester les modules natifs non disponibles dans Expo Go.

---

## 🎨 Thème

La palette de couleurs (navy / gold) est définie en amont sur Figma et déclinée
sur mobile en deux endroits :

- `theme.js` (racine) : configuration NativeWind/Tailwind pour le build ;
- `components/layout/theme.ts` : constantes `colors`/`fonts` réellement
  importées dans les écrans (`app/**`).

Toute modification de palette doit être répercutée dans ces deux fichiers pour
rester cohérente avec la version web (`bayania-frontend`).

---

## 🔗 Backend

Cette application ne fonctionne pas de manière autonome : elle nécessite l'API
BayanIA (`bayania-backend/`) démarrée et accessible à l'URL renseignée dans
`EXPO_PUBLIC_API_URL`. Voir la documentation technique du dépôt
(`DOCUMENTATION_TECHNIQUE.md`) pour l'architecture globale et les endpoints exposés.
# BayanIA — Documentation technique

## 1. Présentation du projet

BayanIA est une plateforme LegalTech destinée à faciliter l'accès au corpus
juridique marocain. Elle permet à un utilisateur de poser une question en
langage naturel et de recevoir une réponse contextualisée à partir des sources
juridiques indexées, accompagnée de références et d'un score de confiance.

Le dépôt est organisé en trois parties :

- `bayania-backend/` : API FastAPI, logique métier, base PostgreSQL, Qdrant,
  ingestion, sécurité et tests ;
- `bayania-frontend/` : application web Next.js / React ;
- `bayania-mobile/` : application mobile React Native / Expo.

**Dépôt GitHub :** https://github.com/houdasnd23-dev/BayanIA

---

## 2. Architecture globale

```
                    Utilisateur
                         |
                 +-------+-------+
                 |               |
                 v               v
          Web Next.js      Mobile Expo
                 |               |
                 +-------+-------+
                         |
                    REST / HTTPS
                         |
                         v
                  +-------------+
                  |   FastAPI   |
                  |   Backend   |
                  +------+------+
                         |
          +--------------+----------------+
          |              |                |
          v              v                v
     PostgreSQL        Qdrant          Gemini API
     données          recherche       embeddings + LLM
     structurées      vectorielle
                         |
                         v
                    Pipeline RAG
```

La séparation entre PostgreSQL et Qdrant permet de conserver les données
relationnelles et les métadonnées dans le SGBD, tout en utilisant une recherche
vectorielle dédiée pour la récupération sémantique.

---

## 3. Stack technique

| Composant | Technologie | Rôle |
|---|---|---|
| Backend | FastAPI / Python | API REST et logique métier |
| ORM | SQLAlchemy Async | Accès à PostgreSQL |
| Migrations | Alembic | Évolution du schéma |
| Base relationnelle | PostgreSQL 15 | Utilisateurs, questions, réponses, sources, métadonnées |
| Base vectorielle | Qdrant | Recherche sémantique |
| Embeddings | Gemini `gemini-embedding-001` | Vectorisation multilingue (768 dimensions) |
| LLM | Gemini `gemini-3.6-flash` (fallback `gemini-3.5-flash`, `gemini-3.0-flash`) | Génération des réponses |
| Frontend | Next.js / React / TypeScript | Application web |
| Mobile | React Native / Expo | Application mobile |
| Sécurité | JWT, bcrypt, rate limiting | Authentification et protection |
| Conteneurisation | Docker / Docker Compose | Environnement local |
| Tests | Pytest / pytest-asyncio / HTTPX | Validation automatisée |

---

## 4. Organisation du dépôt

```
BayanIA/
├── bayania-backend/
│   ├── app/
│   │   ├── core/                 # configuration, sécurité, DB, dépendances
│   │   ├── models/               # modèles SQLAlchemy
│   │   ├── schemas/              # schémas Pydantic
│   │   ├── routers/              # endpoints REST
│   │   ├── services/             # logique métier et RAG
│   │   └── utils/                # fonctions utilitaires
│   ├── alembic/                  # migrations
│   ├── docker/                   # Dockerfile et docker-compose
│   ├── scripts/                  # ingestion et outils de maintenance
│   ├── tests/
│   │   ├── Test unitaire/
│   │   └── Test integration/
│   ├── .env.example
│   ├── requirements.txt
│   └── README.md
├── bayania-frontend/
│   ├── app/                      # routes et pages Next.js
│   ├── components/               # composants réutilisables
│   ├── package.json
│   └── README.md
├── bayania-mobile/
│   ├── app/                      # routes Expo Router
│   ├── components/               # composants mobiles
│   ├── package.json
│   └── README.md
├── README.md
└── DOCUMENTATION_TECHNIQUE.md
```

---

## 5. Backend

### 5.1 Couche `core/`

La couche `core/` centralise les fonctions transverses :

- `config.py` : lecture des variables d'environnement avec Pydantic Settings ;
- `database.py` : moteur et sessions SQLAlchemy asynchrones ;
- `security.py` : hachage des mots de passe et génération/vérification JWT ;
- `dependencies.py` : dépendances FastAPI et récupération de l'utilisateur courant ;
- `rate_limit.py` : limitation du nombre de requêtes ;
- `exceptions.py` : gestion des exceptions applicatives.

### 5.2 Modèles et persistance

PostgreSQL conserve notamment les informations liées aux utilisateurs, profils,
questions, réponses, sources juridiques, pièces jointes, importations de
documents et données sensibles détectées lors de l'anonymisation.

Qdrant conserve les vecteurs utilisés pour la recherche sémantique. Le vecteur
de production est généré avec `gemini-embedding-001` en dimension 768, dans la
collection `sources_juridiques`.

### 5.3 API REST

Les principales familles de routes sont :

- **authentification :** `/auth/register`, `/auth/login` ;
- **questions :** `/questions`, récupération de réponses et pièces jointes ;
- **sources :** consultation et recherche des sources juridiques ;
- **administration :** gestion des utilisateurs et des documents ;
- **analyse documentaire :** analyse de documents juridiques transmis par
  l'utilisateur (`/documents/analyse-pdf`).

La documentation interactive est disponible lorsque l'API est lancée, sur :

http://localhost:8000/docs

---

## 6. Pipeline RAG final

La version actuelle ne repose plus uniquement sur une recherche vectorielle. Le
pipeline final est **hybride**.

```
Question utilisateur
        |
        v
Anonymisation
        |
        +---------------------------+
        |                           |
        v                           v
Embedding Gemini             Extraction de termes
        |                           |
        v                           v
Recherche dense Qdrant       Recherche lexicale PostgreSQL
        |                           |
        +-------------+-------------+
                      |
                      v
             Fusion RRF (k=60)
                      |
                      v
            Sélection finale : 6
                passages maximum
                      |
                      v
              Construction contexte
                      |
                      v
                 Gemini LLM
                      |
                      v
        Réponse + références + confiance
```

### 6.1 Recherche dense

`RAGService` interroge Qdrant avec le vecteur de la question. La recherche
dense récupère jusqu'à 20 candidats et applique un seuil minimal de similarité
de 0.35.

### 6.2 Recherche lexicale

En parallèle, le système recherche les termes importants dans PostgreSQL sur :

- le titre du document ;
- le contenu du texte ;
- le numéro d'article.

Jusqu'à 30 candidats peuvent être récupérés par cette voie.

### 6.3 Fusion RRF

Les deux listes sont fusionnées avec **Reciprocal Rank Fusion (RRF)** :

```
RRF(d) = Σ 1 / (k + rang_i(d))     avec k = 60
```

Un résultat retrouvé par les deux méthodes reçoit également un petit bonus
avant le classement final.

### 6.4 Contexte final

Après fusion, les 6 meilleurs passages sont transmis au service LLM.

### 6.5 Génération Gemini

Le service LLM impose plusieurs règles applicatives :

- répondre uniquement à partir du contexte juridique fourni ;
- ne pas inventer d'article, de sanction, de date ou de référence ;
- répondre dans la langue de la question ;
- conserver les références juridiques ;
- signaler explicitement lorsque le contexte est insuffisant.

Le modèle principal est `gemini-3.6-flash`. Des modèles de secours sont prévus
en cas d'échec : `gemini-3.5-flash`, puis `gemini-3.0-flash`.

Les erreurs serveur Gemini font l'objet de tentatives supplémentaires avec
temporisation exponentielle (`tenacity`) avant le passage au modèle suivant.

### 6.6 Score de confiance

Le score combine trois signaux indépendants :

```
confidence = 0.4 · retrieval + 0.2 · citation + 0.4 · groundedness
```

- **retrieval** : qualité des documents retrouvés (meilleur score + moyenne) ;
- **citation** : proportion de sources dont l'article est explicitement cité ;
- **groundedness** : proximité sémantique (cosinus, seuil 0.6) entre chaque
  phrase de la réponse et les chunks de contexte, signal principal contre
  l'hallucination.

---

## 7. Anonymisation et protection des données

Le module `AnonymisationService` protège les données personnelles avant leur
transmission au LLM.

Les catégories actuellement détectées, **exclusivement par expressions
régulières**, sont notamment :

- adresses e-mail ;
- numéros de téléphone ;
- CIN ;
- adresses ;
- noms détectés dans certaines formulations introductives (« Je m'appelle... »,
  « Mr... », « Mme... »).

Chaque donnée détectée est remplacée par un placeholder du type `[EMAIL_1]`,
`[CIN_1]`, `[TELEPHONE_1]`, `[ADRESSE_1]` ou `[NOM_1]`. Le mapping est conservé
en base afin d'assurer la traçabilité des données sensibles détectées.



---

## 8. Ingestion du corpus juridique

```
Documents officiels
       |
       v
Téléchargement / collecte
       |
       v
Extraction de texte
       |
       v
OCR pour les documents scannés
       |
       v
Nettoyage / normalisation
       |
       v
Découpage par article
       |
       v
Enregistrement PostgreSQL
       |
       v
Embedding Gemini
       |
       v
Indexation Qdrant
```

Pour les documents PDF dont la couche texte est inutilisable, le projet prévoit
des traitements d'OCR (Tesseract, packs arabe et français, via Docling avec
`force_full_page_ocr=True`). Les documents utilisateurs transmis pour analyse
ne sont pas destinés à enrichir automatiquement le corpus partagé.

---

## 9. Analyse de documents

BayanIA propose également une fonctionnalité d'analyse de documents juridiques
via l'endpoint `POST /documents/analyse-pdf`.

```
PDF utilisateur
      |
      v
Extraction du texte
      |
      v
Récupération du contexte juridique pertinent
      |
      v
Gemini
      |
      v
Réponse structurée
```

La réponse est structurée sous forme de données exploitables par l'interface
(sortie structurée `response_schema` de l'API Gemini), notamment pour le
résumé, les clauses à risque, la conformité et les recommandations.

---

## 10. Base de données et migrations

La base relationnelle est PostgreSQL et l'accès applicatif est assuré par
SQLAlchemy Async.

Les évolutions de schéma sont gérées avec Alembic. Les migrations doivent être
exécutées avant l'utilisation de l'API lorsque le schéma n'est pas encore à
jour (exécutées automatiquement au démarrage du conteneur `api`).

---

## 11. Sécurité

Les mesures principales présentes dans le projet sont :

- authentification JWT ;
- contrôle d'accès basé sur les rôles (`normal`, `professionnel`,
  `administrateur`) ;
- hachage des mots de passe avec bcrypt ;
- validation des entrées avec Pydantic ;
- rate limiting ;
- anonymisation avant appel au LLM ;
- utilisation de variables d'environnement pour les secrets ;
- garde-fou empêchant le démarrage en production avec le `JWT_SECRET` par
  défaut ;
- rôle par défaut forcé à `normal` à l'inscription publique (l'auto-attribution
  du rôle administrateur a été corrigée) ;
- en-têtes de sécurité HTTP (CSP, X-Frame-Options, Referrer-Policy,
  Permissions-Policy) côté frontend Vercel ;
- utilisation de l'ORM SQLAlchemy pour les accès à PostgreSQL (aucune requête
  concaténée) ;
- séparation entre les données relationnelles et l'index vectoriel ;
- contrôle des routes d'administration.

Les informations sensibles ne doivent jamais être publiées dans le dépôt. Le
`.gitignore` exclut les fichiers `.env`, les uploads, les dumps et plusieurs
données générées.

---

## 12. Tests

Les tests sont organisés en deux niveaux, sous `bayania-backend/tests/` :

**Tests unitaires** (`Test unitaire/`) — 40 tests couvrant :

- le calcul du score de confiance (12) ;
- l'anonymisation (4) ;
- la sécurité et les JWT (11) ;
- le découpage des documents juridiques (13).

**Tests d'intégration** (`Test integration/`) — 29 tests couvrant les routes
FastAPI et leurs interactions avec les composants simulés. L'environnement
utilise notamment HTTPX (ASGI Transport), une base SQLite en mémoire et des
mocks pour les dépendances externes (Qdrant, embeddings, LLM).

Commandes :

```bash
pytest -v
```

> Le nombre de tests annoncé dans le rapport doit toujours correspondre à la
> dernière exécution réelle du dépôt avant remise finale.

---

## 13. Exécution locale avec Docker

### Prérequis

- Git ;
- Docker et Docker Compose ;
- Node.js / npm pour le frontend et le mobile si ces parties doivent être
  exécutées séparément.

### Clonage

```bash
git clone https://github.com/houdasnd23-dev/BayanIA.git
cd BayanIA
```

### Backend

```bash
cd bayania-backend
cp .env.example .env
```

Renseigner au minimum `GEMINI_API_KEY`, `GEMINI_GENERATION_API_KEY` et
`JWT_SECRET` dans `.env`, sans jamais committer ce fichier. Puis :

```bash
docker compose -f docker/docker-compose.yml --env-file .env up --build
```

L'API est accessible sur http://localhost:8000 et Swagger sur
http://localhost:8000/docs.

### Frontend

```bash
cd bayania-frontend
npm install
npm run dev
```



### Mobile

```bash
cd bayania-mobile
npm install
npx expo start
```

---

## 14. Déploiement

```
Utilisateur
    |
    v
Vercel
Frontend Next.js
    |
    | HTTPS / API
    v
Railway
FastAPI + PostgreSQL
    |
    +-------> Qdrant Cloud
    |
    +-------> Gemini API
```

Le frontend web est déployé sur **Vercel**. Le backend FastAPI et PostgreSQL
sont hébergés sur **Railway**. La base vectorielle de production est hébergée
sur **Qdrant Cloud** et le LLM / embedding repose sur l'API **Gemini**.

---

## 15. Variables d'environnement

Les secrets ne doivent jamais être écrits directement dans le code source. Les
variables principales du backend comprennent notamment :

```
DATABASE_URL=...
JWT_SECRET=...
QDRANT_URL=...
QDRANT_API_KEY=...
GEMINI_API_KEY=...
GEMINI_GENERATION_API_KEY=...
```


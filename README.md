# BayanIA 🇲🇦⚖️

### Assistant juridique intelligent basé sur l'IA pour le droit marocain

BayanIA est une plateforme LegalTech conçue pour faciliter l'accès au corpus juridique marocain grâce à l'intelligence artificielle.

La plateforme permet à l'utilisateur de poser des questions juridiques en langage naturel et d'obtenir une réponse contextualisée à partir d'un corpus juridique marocain, accompagnée des références utilisées.

Le projet met particulièrement l'accent sur la **fiabilité des réponses, la traçabilité des sources et la protection des données personnelles**.

---

## 🎯 Objectifs

BayanIA a été développé avec plusieurs objectifs :

* Faciliter l'accès au droit marocain.
* Permettre la recherche juridique en langage naturel.
* Exploiter un corpus juridique à travers la recherche sémantique.
* Générer des réponses contextualisées grâce à une architecture RAG.
* Fournir les références juridiques utilisées dans les réponses.
* Protéger les données personnelles des utilisateurs.
* Mettre en place une architecture sécurisée et évolutive.

---

## 🏗️ Architecture

BayanIA repose sur une architecture client-serveur composée de plusieurs services :

```text
                    ┌──────────────────────┐
                    │      Utilisateur      │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Next.js / React    │
                    │      Frontend        │
                    └──────────┬───────────┘
                               │ REST API
                               ▼
                    ┌──────────────────────┐
                    │       FastAPI        │
                    │       Backend        │
                    └──────────┬───────────┘
                               │
             ┌─────────────────┼──────────────────┐
             │                 │                  │
             ▼                 ▼                  ▼
      ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
      │ PostgreSQL  │   │   Qdrant    │   │  Gemini API │
      │ Données     │   │ Recherche   │   │     LLM     │
      │ structurées │   │ vectorielle │   │             │
      └─────────────┘   └─────────────┘   └─────────────┘
```

---

## 🧠 Pipeline RAG

Le cœur de BayanIA repose sur une architecture **Retrieval-Augmented Generation (RAG)**.

Lorsqu'un utilisateur pose une question, le traitement suit plusieurs étapes :

```text
Question utilisateur
        │
        ▼
┌─────────────────┐
│  Anonymisation  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Embedding    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Recherche dans  │
│     Qdrant      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Passages        │
│ juridiques      │
│ pertinents      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Construction    │
│ du contexte     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Gemini LLM    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Réponse +       │
│ références +    │
│ score confiance │
└─────────────────┘
```

Cette approche permet de limiter la génération de réponses non fondées sur le corpus juridique disponible.

---

## 🔐 Sécurité

La sécurité constitue un élément central de BayanIA.

Les principaux mécanismes implémentés comprennent :

* 🔑 Authentification basée sur **JWT**.
* 👥 Gestion des rôles et des autorisations.
* 🔒 Hachage sécurisé des mots de passe avec **bcrypt**.
* 🛡️ Anonymisation des données personnelles avant l'appel au LLM.
* 🚦 Rate limiting afin de limiter les abus.
* 🔐 Gestion des secrets via variables d'environnement.
* 🗄️ Sécurisation de l'accès à PostgreSQL.
* 🧩 Séparation entre données relationnelles et données vectorielles.
* 📋 Journalisation et contrôle des opérations sensibles.

### Anonymisation

Avant qu'une question contenant potentiellement des informations personnelles soit transmise au modèle de langage, elle passe par le module d'anonymisation.

Exemple :

```text
Question originale
        ↓
"Je suis [nom], mon email est [email]..."
        ↓
Question anonymisée
        ↓
Traitement RAG
        ↓
LLM
```

L'objectif est de réduire l'exposition de données personnelles auprès des services externes.

---

## 🗂️ Corpus juridique

Le corpus juridique constitue la base documentaire de BayanIA.

Le processus d'intégration des documents suit généralement les étapes suivantes :

```text
Documents juridiques
        ↓
Extraction du texte
        ↓
Nettoyage
        ↓
Découpage en chunks
        ↓
Génération des embeddings
        ↓
Indexation Qdrant
```

Les embeddings sont générés à l'aide de l'**API Gemini** (`gemini-embedding-001`) et les vecteurs sont stockés dans Qdrant afin de permettre une recherche par similarité sémantique.

---

## 🛠️ Technologies

| Composant              | Technologie           |
| ---------------------- | --------------------- |
| Backend                | FastAPI / Python      |
| Frontend               | Next.js / React       |
| Base relationnelle     | PostgreSQL            |
| Base vectorielle       | Qdrant                |
| ORM                    | SQLAlchemy            |
| Embeddings             | Gemini API             |
| LLM                    | Gemini API            |
| Authentification       | JWT                   |
| Sécurité mots de passe | bcrypt                |
| Conteneurisation       | Docker                |
| Tests                  | Pytest                |

---

## 📁 Structure du projet

Une organisation simplifiée du backend :

```text
bayania-backend/
│
├── app/
│   ├── core/
│   │   ├── config.py
│   │   └── ...
│   │
│   ├── models/
│   │   └── ...
│   │
│   ├── schemas/
│   │   └── ...
│   │
│   ├── routers/
│   │   ├── auth.py
│   │   ├── admin.py
│   │   ├── questions.py
│   │   └── ...
│   │
│   ├── services/
│   │   ├── rag_service.py
│   │   ├── embedding_service.py
│   │   ├── qdrant_service.py
│   │   └── llm_service.py
│   │
│   └── ...
│
├── tests/
│   ├── unit/
│   │   ├── test_anonymisation.py
│   │   ├── test_chunking.py
│   │   ├── test_confidence.py
│   │   └── test_security.py
│   │
│   └── integration/
│       ├── test_auth.py
│       ├── ...
│       └── ...
│
├── docker/
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```

---

## 🧪 Tests

La validation de BayanIA est organisée en plusieurs niveaux.

### Tests unitaires

Les tests unitaires permettent de vérifier individuellement certains composants :

* Anonymisation.
* Découpage des documents.
* Calcul du score de confiance.
* Mécanismes de sécurité.

Lancement :

```bash
pytest -m unit -v
```

### Tests d'intégration

Les tests d'intégration permettent de vérifier les interactions entre les différents composants :

* Authentification.
* API.
* Base de données.
* Gestion des rôles.
* Pipeline RAG.
* Services externes.

Lancement :

```bash
pytest -m integration -v
```

### Tous les tests

```bash
pytest -v
```

---

## 🐳 Installation avec Docker

### Prérequis

Avant de lancer le projet, installer :

* Docker Desktop
* Git
* Python 3.13+ si nécessaire pour le développement local

### Cloner le projet

```bash
git clone https://github.com/<username>/<repository>.git
cd <repository>/bayania-backend
```

### Configuration

Créer un fichier `.env` à partir du fichier d'exemple (à la racine de `bayania-backend/`) :

```bash
cp .env.example .env
```

Puis configurer les variables nécessaires dans `bayania-backend/.env` :

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/bayania
JWT_SECRET=...
GEMINI_API_KEY=...
QDRANT_URL=http://qdrant:6333
QDRANT_API_KEY=...
```

⚠️ **Ne jamais publier le fichier `.env` ou les clés API dans le dépôt GitHub.**

### Lancer les services

Le `docker-compose.yml` se trouve dans `bayania-backend/docker/`. Depuis `bayania-backend/` :

```bash
docker compose -f docker/docker-compose.yml --env-file .env up --build
```

Les services principaux (PostgreSQL, Qdrant, API FastAPI) sont alors lancés dans des conteneurs séparés. L'API est ensuite accessible sur `http://localhost:8000`.

Le frontend (`bayania-frontend/`) et l'application mobile (`bayania-mobile/`) se lancent séparément — voir leurs README respectifs.

---

## 🔌 API

Le backend expose une API REST développée avec FastAPI.

Une fois le serveur lancé, la documentation interactive peut être consultée via :

```text
/docs
```

Exemples de fonctionnalités :

```text
POST   /auth/register
POST   /auth/login
GET    /sources/{id}
POST   /questions
POST   /questions/{id}/pieces-jointes
GET    /admin/utilisateurs
```

Les routes protégées nécessitent une authentification et, selon la ressource, les permissions correspondantes.

---

## 📊 Fonctionnalités principales

### 👤 Utilisateur

* Création de compte.
* Authentification.
* Pose de questions juridiques.
* Consultation des réponses.
* Consultation des références juridiques.
* Consultation de l'historique.

### 👨‍💼 Administrateur

* Gestion des utilisateurs.
* Gestion du corpus documentaire.
* Import de documents.
* Supervision des données.
* Gestion des ressources juridiques.

### 🤖 Intelligence artificielle

* Recherche sémantique.
* Retrieval-Augmented Generation.
* Génération de réponses contextualisées.
* Citation des références.
* Calcul d'un score de confiance.
* Anonymisation avant traitement par le LLM.

---

## 🚧 Limites actuelles

La version actuelle constitue une première version fonctionnelle et présente encore certaines limites :

* La qualité des réponses dépend de la qualité du corpus disponible.
* La mise à jour automatique complète du corpus reste perfectible.
* Le score de confiance constitue un indicateur et ne garantit pas l'exactitude juridique absolue.
* Les performances dépendent notamment des services externes utilisés pour la génération.
* Des mécanismes supplémentaires d'évaluation et de supervision peuvent encore être ajoutés.

---

## 🚀 Perspectives — BayanIA V2

Une future version pourrait intégrer :

* 🔄 Mise à jour automatique du corpus juridique.
* 🔎 Recherche hybride lexicale + sémantique.
* 🎯 Reranking des passages récupérés.
* ✅ Validation automatique des références juridiques.
* 📈 Amélioration du système d'évaluation des réponses.
* 🔐 Renforcement de la sécurité et des mécanismes de supervision.
* 📱 Développement complet de l'application mobile.
* ⚡ Optimisation des performances.
* 💰 Réduction des coûts d'exploitation.
* 📊 Monitoring et observabilité.
* 🧪 Tests de sécurité et tests de pénétration réguliers.

---

## 👩‍💻 Projet réalisé dans le cadre d'un stage

**Projet :** BayanIA — Assistant juridique intelligent
**Organisme d'accueil :** IAAI Academy
**Établissement :** École Nationale des Sciences Appliquées d'El Jadida (ENSAJ)
**Filière :** Cybersécurité et Confiance Numérique
**Type de stage :** Stage d'initiation
**Année :** 2026

---

## 📄 Licence

Ce projet a été développé dans un cadre académique.
Les conditions d'utilisation, de modification et de distribution doivent être définies selon les besoins du projet.

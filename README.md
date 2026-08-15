# BayanIA 🇲🇦⚖️

### Assistant juridique intelligent basé sur l'IA pour le droit marocain

BayanIA est une plateforme LegalTech développée dans le cadre d'un stage à
**IAAI Academy**. Elle permet de poser des questions juridiques en langage naturel
et de générer des réponses contextualisées à partir d'un corpus juridique marocain
indexé, avec références et score de confiance.

Le projet met l'accent sur la recherche documentaire, la traçabilité des sources
et la protection des données personnelles.

## Dépôt

https://github.com/houdasnd23-dev/BayanIA

## Structure

```
BayanIA/
├── bayania-backend/   # FastAPI, PostgreSQL, Qdrant, RAG, sécurité, tests
├── bayania-frontend/  # Next.js / React
└── bayania-mobile/    # React Native / Expo
```

## Architecture

```
Web Next.js / Mobile Expo
            |
            v
         FastAPI
        /   |    \
       v    v     v
PostgreSQL Qdrant Gemini
            ^
            |
       Pipeline RAG
```

## RAG hybride

La version actuelle utilise deux mécanismes complémentaires de récupération :

1. recherche dense dans Qdrant à partir des embeddings Gemini ;
2. recherche lexicale dans PostgreSQL sur le titre, le contenu et le numéro d'article.

Les résultats sont fusionnés par **Reciprocal Rank Fusion (RRF)**. Le système
récupère jusqu'à 20 candidats denses et 30 candidats lexicaux, puis conserve au
maximum 6 passages pour construire le contexte transmis à Gemini.

## IA

- Embeddings : `gemini-embedding-001` — 768 dimensions ;
- LLM principal : `gemini-3.6-flash` ;
- modèles de secours : `gemini-3.5-flash`, puis `gemini-3.0-flash` ;
- réponses contraintes au contexte juridique récupéré ;
- fallback en mode test lorsque Gemini n'est pas disponible.

## Sécurité

- JWT pour l'authentification ;
- gestion des rôles ;
- bcrypt pour les mots de passe ;
- validation Pydantic ;
- rate limiting ;
- anonymisation des informations personnelles avant le LLM (par expressions
  régulières) ;
- secrets via variables d'environnement ;
- contrôle des accès aux routes sensibles.

## Installation locale

### 1. Cloner le dépôt

```bash
git clone https://github.com/houdasnd23-dev/BayanIA.git
cd BayanIA
```

### 2. Backend

```bash
cd bayania-backend
cp .env.example .env
```

Configurer au minimum `GEMINI_API_KEY`, `GEMINI_GENERATION_API_KEY` et
`JWT_SECRET` dans `.env`, puis :

```bash
docker compose -f docker/docker-compose.yml --env-file .env up --build
```

- API : http://localhost:8000
- Swagger : http://localhost:8000/docs

### 3. Frontend

```bash
cd bayania-frontend
npm install
npm run dev
```

### 4. Mobile

```bash
cd bayania-mobile
npm install
npx expo start
```

## Tests

Depuis `bayania-backend/` :

```bash
pytest -v
```

Les tests unitaires couvrent notamment l'anonymisation, la sécurité, le chunking
et le score de confiance. Les tests d'intégration couvrent l'API et les
interactions entre composants, avec des dépendances externes simulées (Qdrant,
Gemini).

## Documentation technique

La documentation détaillée de l'architecture, du backend, du pipeline RAG, de la
sécurité, de la base de données, des tests et du déploiement est disponible dans
[`DOCUMENTATION_TECHNIQUE.md`](./DOCUMENTATION_TECHNIQUE.md).

## Déploiement

Architecture de production :

```
Vercel
  |
  v
FastAPI sur Railway
  |\
  | \
  v  v
PostgreSQL  Qdrant Cloud
      \
       v
      Gemini API
```

## Limites

La qualité des réponses dépend de la couverture et de la qualité du corpus
juridique. Le score de confiance constitue un indicateur et ne garantit pas à lui
seul l'exactitude juridique.

## Perspectives — BayanIA V2

- amélioration et automatisation du corpus ;
- reranking des passages après la fusion RRF ;
- validation automatique des références ;
- évaluation plus poussée de la qualité des réponses ;
- renforcement de la sécurité et du monitoring ;
- optimisation des performances et des coûts ;
- amélioration de la couverture des tests (charge, end-to-end, PostgreSQL réel).

> La recherche hybride lexicale + sémantique est **déjà implémentée** dans la
> version actuelle et n'est donc pas listée comme fonctionnalité future.

## Stage

- **Projet :** BayanIA — Assistant juridique intelligent
- **Organisme :** IAAI Academy
- **Établissement :** ENSA El Jadida (Université Chouaïb Doukkali)
- **Filière :** Cybersécurité et Confiance Numérique
- **Année universitaire :** 2025–2026
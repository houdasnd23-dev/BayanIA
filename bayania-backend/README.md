# BayanIA Backend - Plateforme d'Assistance Juridique Intelligente (RAG)
Ce projet fournit le backend complet de la plateforme d'assistance juridique **BayanIA**, basé sur FastAPI, PostgreSQL (avec SQLAlchemy async), Qdrant pour l'indexation vectorielle, sentence-transformers pour les embeddings (`all-MiniLM-L6-v2`), et Docker pour une conteneurisation complète.
---
## 🛠️ Stack Technique
- **Framework :** FastAPI (totalement asynchrone)
- **Base de Données relationnelle :** PostgreSQL + SQLAlchemy async + migrations Alembic
- **Base Vectorielle :** Qdrant
- **Embeddings :** sentence-transformers (`all-MiniLM-L6-v2` - 384 dimensions)
- **Authentification :** JWT (passlib + python-jose)
- **Validation & Schémas :** Pydantic v2 & Pydantic Settings
- **Conteneurisation :** Docker / docker-compose
---
## 📁 Structure du Projet
```
bayania-backend/
├── app/
│   ├── main.py                      # Point d'entrée FastAPI, montage des routeurs, exception handlers
│   ├── core/
│   │   ├── config.py                # Configuration des paramètres (pydantic-settings)
│   │   ├── security.py              # Cryptage des mots de passe (passlib) et gestion JWT
│   │   ├── database.py              # Session factory et engine async SQLAlchemy
│   │   ├── dependencies.py          # get_db, extraction current_user, require_role()
│   │   ├── exceptions.py            # Exceptions custom & exception handlers
│   │   └── rate_limit.py            # Rate limiting basique via slowapi
│   ├── models/                      # Modèles ORM (User, Profil, Question, etc.)
│   ├── schemas/                     # Validation des requêtes/réponses (Pydantic)
│   ├── routers/                     # Routeurs d'API REST
│   ├── services/                    # Logique métier (RAG, Ingestion, Anonymisation...)
│   └── utils/                       # Utilitaires (découpage juridique, stockage fichier)
├── alembic/                         # Dossier contenant l'historique des migrations
├── docker/                          # Fichiers de configuration Docker & Docker Compose
├── scripts/                         # CLI d'ingestion de documents juridiques
├── tests/                           # Tests unitaires Pytest
├── requirements.txt                 # Dépendances Python
└── README.md                        # Ce fichier
```
4. Exécuter automatiquement les migrations Alembic et démarrer le serveur.
5. Se connecter et pré-créer les profils d'utilisateurs (`normal`, `professionnel`, `administrateur`) s'ils n'existent pas.
Une fois démarré, la documentation interactive Swagger UI est accessible sur :
👉 [http://localhost:8000/docs](http://localhost:8000/docs)
---
## 🌐 Endpoints REST Exposés
### Authentification JWT
- `POST /auth/register` : S'enregistrer sur la plateforme (nom, email, mot de passe, type de profil).
- `POST /auth/login` : Se connecter pour obtenir un token JWT.
### Questions & RAG
- `POST /questions` : Poser une question juridique (requiert d'être authentifié).
  - Détecte et anonymise automatiquement les données sensibles (emails, CIN, téléphones, adresses, noms) dans le texte de la question.
  - Enregistre le mapping dans la table `Donnee_Sensible`.
  - Lance la recherche vectorielle (top-k) dans Qdrant.
  - Génère la réponse via le LLM avec le contexte.
  - Sauvegarde la réponse générée, le score de confiance et lie les sources utilisées.
- `GET /questions/{id}/reponse` : Récupère la réponse de l'IA liée à une question et affiche les sources juridiques citées.
- `POST /questions/{id}/pieces-jointes` : Permet d'attacher un fichier (PDF, image, texte) à une question existante (sauvegarde locale + métadonnées DB).
### Sources
- `GET /sources/{id}` : Récupère le texte complet d'un article ou fragment de loi indexé dans le système.
### Administration
- `POST /admin/documents` : Importe, découpe (chunking par article), vectorise et indexe un nouveau document juridique complet (Rôle `administrateur` requis).
- `GET /admin/utilisateurs` : Liste tous les utilisateurs inscrits sur la plateforme (Rôle `administrateur` requis).
---
## ⚙️ Ingestion de Documents via CLI
Si vous préférez exécuter l'ingestion de documents directement depuis la ligne de commande (hors API), vous pouvez utiliser le script CLI prévu :
```bash
python scripts/ingest_documents.py --title "Constitution Marocaine 2011" --type "Constitution" --file /chemin/vers/votre/fichier.txt
```
---
## 🧪 Exécution des Tests
Le projet inclut une suite complète de tests unitaires et d'intégration utilisant une base de données de test SQLite en mémoire et des Mocks pour Qdrant et l'API LLM afin de garantir des tests rapides sans dépendance réseau.
Pour exécuter les tests :
```bash
# Installez les dépendances localement
pip install -r requirements.txt
# Lancez pytest
pytest
```
Les modules testés sont :
1. **L'authentification** (Inscription, connexion, restrictions de rôles et JWT).
2. **L'anonymisation** (Détection par regex/patterns et restauration du texte original).
3. **Le RAG Pipeline** (Le processus d'ingestion de documents et de requêtage vectoriel).
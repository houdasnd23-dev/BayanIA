"""
Découpe le texte des BO en chunks, génère des embeddings (modèle multilingue,
fonctionne bien en arabe) et les envoie dans Qdrant.

Prérequis :
    pip install qdrant-client sentence-transformers tqdm --break-system-packages

Qdrant doit tourner quelque part (local via docker, ou Qdrant Cloud) :
    docker run -p 6333:6333 qdrant/qdrant
"""

import os
import json
import uuid
import time
from tqdm import tqdm
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer

JSONL_PATH = "data/sgg_ar/all_bo_text_merged.jsonl"  # <-- fusionné avec les résultats OCR disponibles
COLLECTION_NAME = "bulletins_officiels_ar"

QDRANT_HOST = os.environ.get("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.environ.get("QDRANT_PORT", "6333"))
QDRANT_API_KEY = os.environ.get("QDRANT_API_KEY", None)  # utile si Qdrant Cloud

# modèle multilingue plus léger et plus rapide (gère bien l'arabe), 384 dimensions
# ~3-4x plus rapide que multilingual-e5-base sur CPU, qualité toujours très correcte
MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"

CHUNK_SIZE = 1000       # caractères par chunk (pas tokens, approximatif)
CHUNK_OVERLAP = 150     # chevauchement pour ne pas couper les idées en plein milieu

ENCODE_BATCH_SIZE = 128  # taille de lot pour l'encodage (plus gros = plus rapide, plus de RAM)
UPSERT_BATCH_SIZE = 64   # plus petit qu'avant : évite les timeouts réseau sur les gros lots
QDRANT_TIMEOUT = 120     # secondes -> laisse à Qdrant le temps de digérer un envoi


def chunk_text(text, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    """Découpe le texte en chunks avec chevauchement, en essayant de couper
    sur un saut de ligne proche pour ne pas trancher une phrase en plein milieu."""
    chunks = []
    start = 0
    length = len(text)

    while start < length:
        end = min(start + chunk_size, length)
        # cherche un saut de ligne proche de la fin pour couper proprement
        if end < length:
            newline_pos = text.rfind("\n", start, end)
            if newline_pos > start:
                end = newline_pos

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        start = end - overlap if end - overlap > start else end

    return chunks


def ensure_collection(client, vector_size):
    existing = [c.name for c in client.get_collections().collections]
    if COLLECTION_NAME not in existing:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
        )
        print(f"Collection '{COLLECTION_NAME}' créée.")
    else:
        print(f"Collection '{COLLECTION_NAME}' déjà existante, on ajoute dedans.")


def main():
    print("Chargement du modèle d'embeddings (peut prendre un moment la 1ère fois)...")
    model = SentenceTransformer(MODEL_NAME)
    vector_size = model.get_sentence_embedding_dimension()

    client = QdrantClient(
        host=QDRANT_HOST,
        port=QDRANT_PORT,
        api_key=QDRANT_API_KEY,
        timeout=QDRANT_TIMEOUT,
    )
    ensure_collection(client, vector_size)

    with open(JSONL_PATH, "r", encoding="utf-8") as f:
        records = [json.loads(line) for line in f]

    # 1. on prépare TOUS les chunks de TOUS les documents dans une seule grande liste
    print("Découpage des documents en chunks...")
    all_chunks = []      # texte brut, pour l'embedding
    all_payloads = []     # métadonnées associées à chaque chunk

    for record in records:
        numero_bo = record["numero_bo"]
        chunks = chunk_text(record["text"])
        for i, chunk in enumerate(chunks):
            all_chunks.append(chunk)
            all_payloads.append({
                "numero_bo": numero_bo,
                "filename": record["filename"],
                "chunk_index": i,
                "n_chunks": len(chunks),
                "lang": record.get("lang", "ar"),
                "text_preview": chunk[:200],  # juste un aperçu pour debug, pas le texte complet
                # -> le texte COMPLET reste dans PostgreSQL (sources_juridiques),
                #    on va le chercher via numero_bo + chunk_index au moment de répondre
                #    -> économise énormément d'espace sur le free tier Qdrant (1GB)
            })

    print(f"{len(all_chunks)} chunks à encoder au total.")

    # 2. encodage en un seul passage, par gros lots -> beaucoup plus rapide que document par document
    embeddings = model.encode(
        all_chunks,
        batch_size=ENCODE_BATCH_SIZE,
        show_progress_bar=True,
        convert_to_numpy=True,
    )

    # 3. envoi vers Qdrant par lots, avec ID déterministe (numero_bo + chunk_index)
    #    -> si on relance le script, ça écrase proprement les mêmes points au lieu
    #       de créer des doublons avec de nouveaux ID aléatoires
    NAMESPACE = uuid.UUID("12345678-1234-5678-1234-567812345678")

    points_batch = []
    for payload, vector in tqdm(zip(all_payloads, embeddings), total=len(all_payloads), desc="Envoi vers Qdrant"):
        point_id = str(uuid.uuid5(NAMESPACE, f"{payload['numero_bo']}-{payload['chunk_index']}"))
        points_batch.append(PointStruct(id=point_id, vector=vector.tolist(), payload=payload))

        if len(points_batch) >= UPSERT_BATCH_SIZE:
            for attempt in range(3):
                try:
                    client.upsert(collection_name=COLLECTION_NAME, points=points_batch)
                    break
                except Exception as e:
                    print(f"\nErreur d'envoi (tentative {attempt+1}/3): {e}")
                    time.sleep(3)
            points_batch = []

    if points_batch:
        for attempt in range(3):
            try:
                client.upsert(collection_name=COLLECTION_NAME, points=points_batch)
                break
            except Exception as e:
                print(f"\nErreur d'envoi (tentative {attempt+1}/3): {e}")
                time.sleep(3)

    print(f"Import terminé dans la collection '{COLLECTION_NAME}'.")


if __name__ == "__main__":
    main()
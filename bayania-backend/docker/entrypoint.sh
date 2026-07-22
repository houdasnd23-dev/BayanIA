#!/bin/sh
# Exit immediately if a command exits with a non-zero status
set -e
echo "Waiting for PostgreSQL database to start..."
# Wait for postgres using a simple python script to ping the port
python -c "
import socket
import time
import os
from urllib.parse import urlparse
db_url = os.environ.get('DATABASE_URL', 'postgresql+asyncpg://postgres:postgres@postgres:5432/bayania')
# Parse the URL (replace asyncpg with standard tcp checks)
parsed = urlparse(db_url.replace('+asyncpg', ''))
host = parsed.hostname or 'postgres'
port = parsed.port or 5432
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
while True:
    try:
        s.connect((host, port))
        s.close()
        break
    except socket.error:
        time.sleep(1)
"
echo "PostgreSQL is up and running!"
echo "Waiting for Qdrant vector database..."
python -c "
import socket
import time
import os
from urllib.parse import urlparse
q_url = os.environ.get('QDRANT_URL', 'http://qdrant:6333')
parsed = urlparse(q_url)
host = parsed.hostname or 'qdrant'
port = parsed.port or 6333
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
while True:
    try:
        s.connect((host, port))
        s.close()
        break
    except socket.error:
        time.sleep(1)
"
echo "Qdrant is up and running!"
# Run migrations
echo "Applying database migrations via Alembic..."
alembic upgrade head
# Start FastAPI application
echo "Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
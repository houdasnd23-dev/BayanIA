# Use a slim Python 3.10 image
FROM python:3.11-slim
# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV HF_HOME=/root/.cache/huggingface
# Set working directory
WORKDIR /workspace
# Install system dependencies (build-essential needed for some packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*
# Copy and install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir torch==2.7.1 --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt
# Pre-download the SentenceTransformer model to save runtime startup time
#RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
# Copy the rest of the application
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini .
COPY docker/entrypoint.sh ./entrypoint.sh
# Make entrypoint script executable
RUN chmod +x ./entrypoint.sh
# Expose port 8000
EXPOSE 8000
# Set entrypoint
ENTRYPOINT ["./entrypoint.sh"]
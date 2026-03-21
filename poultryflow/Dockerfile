FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    POETRY_VERSION=1.6.1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/

RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/

# Expose port
EXPOSE 8000

# Run migrations and start the fastAPI server
CMD ["sh", "-c", "mkdir -p alembic/versions && if [ -z \"$(ls alembic/versions/*.py 2>/dev/null)\" ]; then alembic revision --autogenerate -m 'init'; fi && alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port 8000"]

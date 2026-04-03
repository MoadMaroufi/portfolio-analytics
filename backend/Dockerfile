FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install --no-cache-dir poetry==1.8.2

WORKDIR /app

# Copy dependency files
COPY pyproject.toml poetry.lock* ./

# Configure Poetry and install dependencies
# --no-root: Don't install the project itself (we're running from source)
# --without dev: Skip dev dependencies in production
RUN poetry config virtualenvs.create false \
    && poetry install --no-root --without dev --no-interaction --no-ansi

# Copy application code
COPY main.py config.py models.py exceptions.py ./
COPY services/ ./services/

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

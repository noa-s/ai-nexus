FROM python:3.11.14-slim
WORKDIR /app
ENV PYTHONPATH=/app/src
COPY pyproject.toml ./
COPY src ./src
COPY tests ./tests
CMD ["python", "-m", "ai_nexus_worker.health"]

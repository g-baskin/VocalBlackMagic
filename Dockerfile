FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN adduser --disabled-password --gecos "" appuser && mkdir -p /app/data && chown -R appuser:appuser /app/data
USER appuser
ENV PYTHONUNBUFFERED=1
EXPOSE 8001 8002
CMD ["uvicorn","apps.vocal_fix.app:app","--host","0.0.0.0","--port","8001"]

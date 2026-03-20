## Deployment (Docker Compose)

Overview
- This repository includes Dockerfiles for backend and frontend and a `docker-compose.yml` to run everything locally or on a VM.

Quick start (recommended)
1. Copy example env files to real env files and edit secrets:

```bash
cp backend/.env.production.example backend/.env
cp frontend/.env.production.example frontend/.env
# Edit backend/.env to set a secure JWT_SECRET and production Mongo URI if using Atlas
```

2. Build images and start services:

```bash
docker compose build
docker compose up -d
```

3. Check logs:

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

Running the database seed (optional):

```bash
docker compose run --rm backend npm run seed
```

Notes
- The example env files contain placeholders. Do NOT commit real credentials.
- For production on a server, replace the `env_file` in `docker-compose.yml` with your secure `.env` path or inject secrets via your orchestrator.
- Frontend expects `VITE_API_BASE` to point to the backend (example: `https://api.mydomain.com/api`).

# School Management Systems

Lightweight school management backend and frontend built with Node.js (Express + TypeScript) and React (Vite). This repository includes Dockerfiles and convenience scripts for local development and production deployments (Render for backend, Vercel for frontend).

**Contents**
- **Backend:** [backend](backend) — Express + TypeScript API, MongoDB client, seeds
- **Frontend:** [frontend](frontend) — React + Vite SPA
- Deployment docs: [DEPLOYMENT.md](DEPLOYMENT.md)

**Features**
- User authentication (JWT)
- Student/teacher/class management
- Attendance, grades, schedules, announcements, events
- Seed data for quick local development

## Quick local setup

Prerequisites:
- Node.js (>=18 recommended)
- npm
- MongoDB (local or Atlas)

Backend (local):

1. Install and build

```bash
cd backend
npm install
npm run build
```

2. Configure environment variables

Copy the example and edit secrets (do NOT commit real secrets):

```bash
cp backend/.env.production.example backend/.env
# Edit backend/.env and set MONGO_URI, MONGO_DB_NAME, JWT_SECRET, CORS_ORIGIN
```

3. Run

```bash
npm run start:prod
# or: node dist/index.js
```

Frontend (local):

```bash
cd frontend
npm install
npm run dev
```

The frontend reads `VITE_API_BASE` for the API base URL. See [frontend/.env](frontend/.env) and set `VITE_API_BASE` for production to the deployed backend URL.

## Docker (local multi-service)

This project contains Dockerfiles for backend and frontend and a `docker-compose.yml` for local multi-container runs.

```bash
docker compose build
docker compose up -d
```

Backend seed (optional):

```bash
docker compose run --rm backend npm run seed
```

## Deployment

Backend (Render)
- Root directory: `backend`
- Build command: `npm install && npm run build`
- Start command: `npm run start:prod`
- Environment variables (set in Render service settings): `MONGO_URI`, `MONGO_DB_NAME`, `JWT_SECRET`, `CORS_ORIGIN`
- Use `backend/scripts/test-mongo.js` for connectivity testing on the host environment.

Frontend (Vercel)
- Project root: `frontend`
- Build command: `npm install && npm run build`
- Output directory: `dist`
- Set `VITE_API_BASE` in Vercel Environment to `https://<your-backend>/api` (example: `https://school-management-systems-18w4.onrender.com/api`).
- A `frontend/vercel.json` file is included to ensure static-build output and client-side routing fallback.

Demo access
- Live demo frontend: https://school-management-systems-ebon.vercel.app
- Live demo backend: https://school-management-systems-18w4.onrender.com
- To use the demo accounts from the frontend landing page, open the login page and use the Autofill buttons. Demo names are localized to Ethiopian names for presentation; underlying credentials (seeded emails/passwords) are:
	- Admin (Bekele Tesfaye): `bekele.tesfaye@school.et` / `admin123`
	- Teacher (Almaz Kebede): `almaz.kebede@school.et` / `teacher123`
	- Student (Amanuel Bekele): `amanuel.bekele@student.school.et` / `student123`

See the full deployment guide: [DEPLOYMENT.md](DEPLOYMENT.md)

## CORS and common deployment pitfalls
- The backend supports configuring allowed origins via `CORS_ORIGIN` (comma-separated). Ensure your deployed frontend origin (e.g., `https://school-management-systems-ebon.vercel.app`) is listed.
- If using MongoDB Atlas, ensure the cluster IP access list allows connections from Render (or configure private networking / VPC peering). Temporary 0.0.0.0/0 is for short testing only.

## Security
- Never commit real credentials to the repo. Use `.env.production.example` as a template and set real secrets in the host environment (Render/Vercel).
- Rotate any credentials accidentally committed to a public repo.

## Testing & utilities
- Connectivity test: `node backend/scripts/test-mongo.js` (useful in deploy shell)
- Seed data: `npm run seed` (backend)

## Contributing
- Bug reports and PRs welcome — fork the repo and open a PR.

## License
- MIT

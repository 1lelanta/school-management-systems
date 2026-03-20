# Render Service Setup (Backend)

Use this checklist to configure the Render web service for the backend.

1) Service settings
- **Root Directory:** `backend`
- **Environment:** `Node` (choose Node 20 or Node 22)

2) Build & Start commands
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start:prod`  (or `node dist/index.js`)

3) Environment variables (add these in Render → Environment)
- `MONGO_URI` — MongoDB connection string (use Atlas or your DB host). Example:
  `mongodb+srv://<DB_USER>:<DB_PASS>@cluster0.rceqp06.mongodb.net/<DB_NAME>?retryWrites=true&w=majority`
- `MONGO_DB_NAME` — database name (example: `school_management`)
- `JWT_SECRET` — strong random secret for signing JWTs
- `CORS_ORIGIN` — comma-separated allowed origins. Include your Vercel frontend URL and localhost for testing. Example:
  `http://localhost:5174,https://school-management-systems-ebon.vercel.app`

Notes on `PORT`:
- Render provides a `PORT` environment variable for the process to bind to. Do not hard-code a different port; the app already uses `process.env.PORT || 5000`.

4) Troubleshooting & testing
- After deploying, check service logs for the `[CORS] allowed origins -> ...` line to confirm the env value used.
- To reproduce browser preflight behavior from outside, run locally:
  ```bash
  curl -i -X OPTIONS 'https://<your-backend>/api/auth/login' \
    -H 'Origin: https://<your-vercel>' \
    -H 'Access-Control-Request-Method: POST'
  ```
- To test from Render's network (use the Render shell):
  ```bash
  # open the service shell in the Render dashboard and run:
  curl -i -X OPTIONS 'https://<your-backend>/api/auth/login' \\
    -H 'Origin: https://<your-vercel>' \\
    -H 'Access-Control-Request-Method: POST'
  ```
- If preflight returns `204` with `Access-Control-Allow-Origin` header set to your Vercel origin (or `*`), the CORS check is passing.
- If you still see `500` or missing CORS headers, check logs for `[ERROR HANDLER]` and `[CORS] incoming origin -> ...` and paste them for help.

6) Reseeding demo data
- The seeder supports a forced reseed by setting the env var `FORCE_SEED=true`. When set, the seeder will drop the app collections and insert fresh demo data.
- To perform a forced reseed on Render:
  - Set `FORCE_SEED=true` in the service Environment.
  - Deploy/restart the service so the seeder runs on startup (the app calls `seedDatabase()` during startup).
  - After the seed completes, remove `FORCE_SEED` or set it to false to avoid accidental drops.


5) Security reminders
- Do not commit real credentials. Use `backend/.env.production.example` as a template and set real values in Render.
- Prefer explicit origins over `*` in production.

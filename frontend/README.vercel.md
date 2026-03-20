# Deploying Frontend to Vercel

Steps:

1. Create a new Vercel project and point the root to the `frontend` folder of this repository.
2. Set the Build Command to:

```
npm install && npm run build
```

3. Set the Output Directory to: `dist`

4. Add the environment variable for Production in Vercel project settings:

- `VITE_API_BASE` = `https://school-management-systems-18w4.onrender.com/api`

5. Leave the Framework Preset detection or use `Other` — the included `vercel.json` uses `@vercel/static-build` which runs `npm run build` and serves `dist`.

6. Deploy. Vercel will build and serve the static files; the frontend will call the backend at the `VITE_API_BASE` you set.

Notes:
- Do not commit secrets. Use Vercel's Environment settings to store production values.
- If you need client-side routing to work with refresh, the `vercel.json` routes fallback to `index.html`.

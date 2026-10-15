# WeatherPulse frontend

React + TypeScript + Vite client for the WeatherPulse Django API.

## Run locally

Requires the Django API running on `http://localhost:8000` (see the project root).

```bash
cd frontend
npm install
cp .env.example .env.local   # optional: only if the API URL differs
npm run dev                  # http://localhost:5173
```

## Scripts

- `npm run dev`: dev server with hot module replacement
- `npm run build`: type-check (`tsc`) and production build into `dist/`
- `npm run lint`: lint with oxlint

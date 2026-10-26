# Frontend de WeatherPulse

Cliente en React + TypeScript + Vite para la API de Django de WeatherPulse.

## Ejecución en local

Requiere la API de Django corriendo en `http://localhost:8000` (ver la raíz del proyecto).

```bash
cd frontend
npm install
cp .env.example .env.local   # opcional: solo si la URL de la API es distinta
npm run dev                  # http://localhost:5173
```

## Scripts

- `npm run dev`: servidor de desarrollo con recarga en caliente (HMR)
- `npm run build`: verificación de tipos (`tsc`) y build de producción en `dist/`
- `npm run lint`: análisis estático con oxlint

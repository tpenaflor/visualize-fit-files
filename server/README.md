# fit-to-json-server

Backend server for Gemini analysis

## Setup

1. Copy `.env.example` to `.env` and set your Gemini API key:
   ```sh
   cp .env.example .env
   # Edit .env and set GEMINI_API_KEY
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Run in development:
   ```sh
   npm run dev
   ```

## Endpoints

- `POST /api/analyze` — Accepts `{ metrics }` JSON and returns Gemini analysis.
- `GET /api/health` — Health check.

## Build for production

```sh
npm run build
npm start
```

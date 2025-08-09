import express, { Request, Response, NextFunction } from 'express';
// Security hardening
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
// Behind nginx
app.set('trust proxy', 1);
// Security headers
app.use(helmet());
// Basic rate limiting per IP
app.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 120, // 120 requests/min per IP
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(express.json());

// Allow only same-origin browser requests for state-changing endpoints
app.use((req: Request, res: Response, next: NextFunction) => {
  // Allow health and GETs without strict checks
  const safe = req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS';
  if (safe) return next();

  const host = req.get('host') || '';
  const origin = req.get('origin');
  const referer = req.get('referer');
  const xrw = req.get('x-requested-with');

  // Require browser-like request with our custom header
  if (xrw !== 'XMLHttpRequest') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Basic same-origin check (helps against CSRF and cross-origin fetch in browsers)
  if (origin && !origin.includes(host)) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  if (!origin && referer && !referer.includes(host)) {
    return res.status(403).json({ error: 'Referer not allowed' });
  }

  return next();
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Gemini analysis endpoint (stub for now)
import { analyzeWithGemini } from './gemini.js';

app.post('/api/analyze', async (req: Request, res: Response) => {
  const { metrics, prompt } = req.body as { metrics?: unknown; prompt?: string };
  if (!metrics) {
    return res.status(400).json({ error: 'Missing metrics' });
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key not configured' });
  }
  try {
    const analysis = await analyzeWithGemini(metrics, apiKey, prompt);
    res.json({ analysis });
  } catch (err: any) {
    console.error('Gemini analyze error:', err?.message || err);
    res.status(500).json({ error: err?.message || 'Gemini API error' });
  }
});

const PORT = Number(process.env.PORT) || 3001;
// Bind to localhost so only nginx within the container can reach us
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server listening on http://127.0.0.1:${PORT}`);
});

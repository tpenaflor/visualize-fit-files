import fetch from 'node-fetch';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

type GeminiTextPart = { text: string };
type GeminiContent = { parts?: GeminiTextPart[] };
type GeminiCandidate = { content?: GeminiContent };
type GeminiResponse = { candidates?: GeminiCandidate[] };

export async function analyzeWithGemini(metrics: unknown, apiKey: string, userPrompt?: string): Promise<string> {
  const base = (userPrompt?.trim() || 'Analyze the following activity metrics and provide concise insights (<= 200 words).') + ' When calculating cadence averages, exclude any zero values (coasting/stops) so average cadence reflects pedaling only.';
  const prompt = `${base}\n\nMetrics (JSON):\n${JSON.stringify(metrics, null, 2)}`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }]
  } as const;
  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Gemini API error ${res.status}: ${detail}`);
  }
  const data = (await res.json()) as GeminiResponse;
  // Gemini returns response in data.candidates[0].content.parts[0].text
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No analysis returned.';
}

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Simple LLM stub endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { prompt, metrics, activityType } = req.body || {};
    const metricKeys = metrics ? Object.keys(metrics) : [];

    // Heuristic summary
    const hasPower = metricKeys.includes('power');
    const hasHr = metricKeys.includes('heart_rate') || metricKeys.includes('hr');

    // Compute basic aggregates
    let avgPower = 0;
    if (hasPower && Array.isArray(metrics.power) && metrics.power.length) {
      const vals = metrics.power.filter((n: any) => typeof n === 'number');
      avgPower = vals.length ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : 0;
    }
    let avgHr = 0;
    const hrArr = (metrics.heart_rate || metrics.hr) as any[] | undefined;
    if (hasHr && Array.isArray(hrArr) && hrArr.length) {
      const vals = hrArr.filter((n: any) => typeof n === 'number');
      avgHr = vals.length ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : 0;
    }

    // Mock analysis text
    const lines: string[] = [];
    lines.push(`Activity type: ${activityType}`);
    lines.push(`Metrics included: ${metricKeys.slice(0, 20).join(', ')}${metricKeys.length > 20 ? '…' : ''}`);
    if (hasPower) lines.push(`Avg Power (approx): ${avgPower.toFixed(0)} W`);
    if (hasHr) lines.push(`Avg Heart Rate (approx): ${avgHr.toFixed(0)} bpm`);

    lines.push('');
    lines.push('Assessment:');
    if ((avgHr && avgHr > 160) || (avgPower && avgPower > 250)) {
      lines.push('- This activity appears moderately to highly demanding.');
    } else {
      lines.push('- Effort seems easy to moderate.');
    }

    lines.push('');
    lines.push('Recovery (if needed):');
    lines.push('- 12–24h easy activity, hydration, and adequate sleep.');

    lines.push('');
    lines.push('Areas to improve:');
    lines.push('- Pacing consistency (look at cadence and speed variability).');
    lines.push('- Aerobic base (consider longer easy sessions if HR is high for pace).');

    return res.json({ result: lines.join('\n') });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e?.message || 'Unknown error' });
  }
});

const port = process.env.PORT || 8787;
app.listen(port, () => console.log(`AI stub server listening on http://localhost:${port}`));

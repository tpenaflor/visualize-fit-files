import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.post('/api/analyze', async (req, res) => {
  try {
    const { metrics, activityType } = req.body || {};
    const metricKeys = metrics ? Object.keys(metrics) : [];

    const hasPower = metricKeys.includes('power');
    const hasHr = metricKeys.includes('heart_rate') || metricKeys.includes('hr');

    let avgPower = 0;
    if (hasPower && Array.isArray(metrics.power) && metrics.power.length) {
      const vals = metrics.power.filter((n) => typeof n === 'number');
      avgPower = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    }
    let avgHr = 0;
    const hrArr = metrics?.heart_rate || metrics?.hr;
    if (hasHr && Array.isArray(hrArr) && hrArr.length) {
      const vals = hrArr.filter((n) => typeof n === 'number');
      avgHr = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    }

    const lines = [];
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
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e?.message || 'Unknown error' });
  }
});

const port = process.env.PORT || 8787;
app.listen(port, () => console.log(`AI stub server listening on http://localhost:${port}`));

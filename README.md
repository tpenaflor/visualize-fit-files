# FIT File Analyzer

A TypeScript web application to parse and visualize FIT (Flexible and Interoperable Data Transfer) files with activity-aware metrics and multi-series charts.

## What it does

- 📁 File upload: choose a .fit file and see time-series metrics
- 🧭 Activity detection: detects running vs cycling to pick correct speed/pace units
- 🏭 Manufacturer-aware fields: Garmin, Wahoo, or Generic fallback
- 📈 Multi-metric chart: selecting metrics adds them to a single chart; each series gets its own Y axis group
- ➖ Unmerge quickly: remove any series from the chart via inline “× metric” buttons
- 🧹 Add All / Clear All: one-click to add all available metrics or clear selection
- ✂️ Substantial data filter: only metrics with meaningful data appear in the list

## Supported metrics and units

The app curates visible metrics by manufacturer and activity. Units and labels adjust automatically.

- Garmin (Running)

  - Pace (min/km)
  - Cadence (spm)
  - Heart Rate (bpm)
  - Power (W)
  - Elevation (m)
  - Temperature (°C)
  - Stride Length (cm)
  - Vertical Oscillation (mm)
  - Ground Contact Time (ms)

- Garmin (Cycling)

  - Speed (km/h)
  - Cadence (RPM)
  - Heart Rate (bpm)
  - Power (W)
  - Elevation (m)
  - Temperature (°C)

- Wahoo (Cycling)

  - Speed (km/h)
  - Cadence (RPM)
  - Heart Rate (bpm)
  - Power (W)
  - Elevation (m)
  - Temperature (°C)
  - Pedal Smoothness (%)
  - Torque Effectiveness (%)

- Generic fallback
  - Speed or Pace depending on activity, Heart Rate, Cadence, Power, Elevation, Temperature (when present)

## Quick start

1. Install dependencies

```bash
npm install
```

2. Run the dev server

```bash
npm run dev
```

3. Open http://localhost:5173 and upload a FIT file.

4. (Optional) AI Analyze

- Create a .env file with your key:

```bash
echo "VITE_GEMINI_API_KEY=your_api_key_here" > .env
```

- Click “Analyze Activity” after loading a FIT file.

## How to use

1. Upload a FIT file
2. The left panel lists available metrics (filtered to those with substantial data)
3. Click a metric to add it to the chart (additional metrics merge into the first chart)
4. Use the “× metric” buttons on the chart to remove individual series
5. Use Add All / Clear All to quickly toggle everything

## Tech

- TypeScript, Vite, Chart.js, chartjs-adapter-date-fns, date-fns
- FIT parsing via fit-file-parser (mode: both)
- Activity-aware speed rendering (Pace for running, Speed for cycling)
- Manufacturer mappings for Garmin and Wahoo, with a generic fallback

## Project structure

```
├── index.html
├── src/
│   ├── fit-file-analyzer.ts     # Orchestrates parsing, detection, UI wiring
│   ├── charts/
│   │   ├── multi-chart-manager.ts  # Creates/updates charts, merge/unmerge
│   │   └── chart-manager.ts        # (legacy single-chart flow)
│   ├── manufacturers/           # Garmin/Wahoo/generic field mappings
│   ├── utils/                   # data processing, speed conversion, activity detection
│   └── types/
├── public/
│   └── (static assets)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Limitations

- Only Garmin and Wahoo have curated mappings; other devices use a generic mapping

## Development

```bash
# Install
npm install

# Dev with HMR
npm run dev

# Build
npm run build

# Preview build
npm run preview
```

## Troubleshooting

- If no metrics appear, the substantial-data filter may be hiding sparse metrics
- Ensure the FIT file is valid; try the sample to validate your setup

Built with ❤️ for runners and cyclists.

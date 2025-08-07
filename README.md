# FIT File Analyzer

A TypeScript web application that processes FIT (Flexible and Interoperable Data Transfer) files and provides interactive data visualization and statistics for fitness activities.

## Features

- 📁 **File Upload**: Drag and drop or select FIT files from your device
- 🧪 **Test Mode**: Built-in sample FIT file for quick testing
- 📊 **Data Analysis**: Automatically processes and categorizes fitness data
- 🏭 **Multi-Manufacturer Support**: Works with Garmin, Wahoo, Polar, Suunto, and other FIT devices
- 📈 **Multi-Metric Charts**: Visualize multiple metrics simultaneously with intelligent Y-axis grouping
- 📊 **Real-Time Statistics**: View average and maximum values for selected metrics
- 🎯 **Dynamic Updates**: Charts and statistics update instantly as you select/deselect metrics
- 🏃 **Multi-Sport Support**: Works with running, cycling, swimming, and other activities
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Supported Metrics

- **⚡ Power**: Running/cycling power output in watts
- **🏃 Speed/Pace**:
  - **Running**: Pace in minutes per kilometer (min/km)
  - **Cycling**: Speed in kilometers per hour (km/h)
- **❤️ Heart Rate**: Heart rate in beats per minute
- **👟 Cadence**: Step rate in steps per minute
- **⛰️ Elevation**: Enhanced altitude profile in meters
- **📏 Stride Length**: Stride length in meters
- **📊 Vertical Oscillation**: Vertical movement in millimeters
- **🌡️ Temperature**: Environmental temperature in Celsius
- **🫁 Respiration Rate**: Breathing rate in breaths per minute
- **⏱️ Ground Contact Time**: Ground contact time in milliseconds

## Quick Start

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start development server**:

   ```bash
   npm run dev
   ```

3. **Open your browser** to `http://localhost:5173`

4. **Upload a FIT file** or click "🧪 Test with sample FIT file" to explore fitness data!

## Project Structure

```
├── index.html          # Main HTML file with enhanced UI
├── src/
│   ├── main.ts         # Main application logic with multi-metric support
│   └── types/          # TypeScript type definitions
├── public/
│   └── test-run.fit    # Sample FIT file for testing
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite build configuration
└── README.md           # This file
```

## How to Use

1. **Upload a FIT File**:

   - Click "📁 Choose FIT File" and select a `.fit` file from your fitness device
   - Or click "🧪 Test with sample FIT file" to try it immediately

2. **View File Info**: See basic information about your activity including device and sport type

3. **Select Metrics**: Click on any fitness metrics in the left panel to add them to the chart

   - ✅ Selected metrics show with a checkmark
   - Multiple metrics can be selected simultaneously

4. **Explore Visualizations**:

   - **Chart**: Multi-metric time-series chart with intelligent Y-axis grouping
   - **Statistics**: Average and maximum values displayed below the chart

5. **Clear Selection**: Use "Clear All" button to reset and start over

## Key Features Explained

### Multi-Metric Visualization

- Select multiple metrics to see them plotted together
- Intelligent Y-axis grouping (power, speed, heart rate, etc. on separate axes)
- Real-time chart updates as you select/deselect metrics

### Statistics Dashboard

- **Average Values**: Mean values across the entire activity
- **Maximum Values**: Peak performance metrics
- **Smart Units**: Appropriate units for each metric (W, m/s, bpm, etc.)
- **Dynamic Updates**: Statistics update instantly with metric selection

### Enhanced Data Processing

- **Multi-Manufacturer Support**: Automatically detects and handles field variations from:
  - **Garmin**: Enhanced field support (enhanced_speed, enhanced_altitude)
  - **Wahoo**: Standard and enhanced field mapping
  - **Polar**: Manufacturer-specific field handling
  - **Suunto**: Adaptive field detection
  - **Other devices**: Generic field mapping for unknown manufacturers
- **Smart Speed Interpretation**: Automatically detects activity type and displays:
  - Running activities: Pace in min/km
  - Cycling activities: Speed in km/h
- Comprehensive data validation and error handling

## Technical Details

- **Frontend**: TypeScript, HTML5, CSS3 with modern gradients and animations
- **Build Tool**: Vite 4.4.9 with hot module replacement
- **Charts**: Chart.js 4.3.3 with chartjs-adapter-date-fns for time-based visualization
- **FIT Parser**: fit-file-parser v1.21.0 with 'both' mode configuration
- **Styling**: Modern CSS with responsive design, loading animations, and interactive elements
- **Data Processing**: Enhanced field filtering and multi-metric aggregation

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Development

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## File Handling

The application ignores `.fit` files in version control to protect privacy:

- Sample files are available in the `public/` directory
- Upload your own FIT files for analysis
- All processing happens locally in your browser

## Troubleshooting

**File not parsing**:

- Ensure your file is a valid FIT file from a supported device
- Try the sample file first to verify functionality

**No data showing**:

- The app automatically detects your device manufacturer and maps appropriate fields
- Different manufacturers use different field names (e.g., 'speed' vs 'enhanced_speed')
- The app will show which manufacturer was detected in the file information
- Try files from Garmin, Wahoo, Polar, or Suunto devices

**Chart performance**:

- Large FIT files with many data points may take time to process
- Use the loading indicator to track progress

**Statistics not showing**:

- Statistics only appear when metrics are selected
- Ensure selected metrics contain valid numeric data

---

Built with ❤️ for the fitness community. Perfect for analyzing running, cycling, and other activities from Garmin, Wahoo, and other FIT-compatible devices.

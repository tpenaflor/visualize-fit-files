import FitParser from 'fit-file-parser';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';

import { FitData, ManufacturerInfo, ActivityType } from './types';
import { ManufacturerDetector } from './manufacturers/detector';
import { ActivityDetector } from './utils/activity-detector';
import { MultiChartManager } from './charts/multi-chart-manager';
import { DataProcessor } from './utils/data-processor';

// Register Chart.js components
Chart.register(...registerables);

export class FitFileAnalyzer {
  private fitData: FitData[] = [];
  private activityType: ActivityType = 'unknown';
  private manufacturerInfo: ManufacturerInfo | null = null;
  private readonly multiChartManager: MultiChartManager;

  constructor() {
    this.multiChartManager = new MultiChartManager();
    this.initializeEventListeners();
  }

  private initializeEventListeners(): void {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.addEventListener('change', this.handleFileUpload.bind(this));
    }

  // Test with sample FIT file button removed
  }

  // loadTestFile method removed

  private async handleFileUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      await this.parseFitFile(arrayBuffer);
    } catch (error) {
      console.error('Error processing file:', error);
      this.showError('Error processing FIT file. Please ensure it\'s a valid FIT file.');
    }
  }

  private async parseFitFile(arrayBuffer: ArrayBuffer): Promise<void> {
    try {
      const fitParser = new FitParser({
        force: true,
        speedUnit: 'mps',
        lengthUnit: 'm',
        temperatureUnit: 'celsius',
        elapsedRecordField: true,
        mode: 'both'
      });

      fitParser.parse(arrayBuffer, (error: any, data: any) => {
        if (error) {
          console.error('FIT parsing error:', error);
          this.showError('Failed to parse FIT file: ' + error.message);
          return;
        }

        console.log('Parsed FIT data:', data);
        this.processParsedData(data);
      });
    } catch (error) {
      console.error('Error setting up FIT parser:', error);
      this.showError('Failed to initialize FIT parser.');
    }
  }

  private processParsedData(data: any): void {
    // Detect activity type first
    this.activityType = ActivityDetector.detect(data);
    
    // Then detect manufacturer with activity type context
    this.manufacturerInfo = ManufacturerDetector.detect(data, this.activityType);

    console.log('Detected manufacturer:', this.manufacturerInfo);
    console.log('Detected activity type:', this.activityType);

    // Process and store FIT data
    this.fitData = this.extractFitData(data);
    
    // Process records with manufacturer-specific logic
    this.fitData = DataProcessor.processRecords(this.fitData, this.manufacturerInfo, this.activityType);

    // Set data in MultiChartManager
    this.multiChartManager.setData(this.fitData, this.activityType);

    // Display results
    this.displayResults();
    this.displayManufacturerInfo();
  }

  private extractFitData(data: any): FitData[] {
    const fitData: FitData[] = [];
    
    Object.keys(data).forEach(key => {
      if (Array.isArray(data[key]) && data[key].length > 0) {
        const records = data[key].filter((record: any) => 
          record && typeof record === 'object'
        );

        if (records.length > 0) {
          fitData.push({
            type: key,
            name: this.formatTypeName(key),
            records: records,
            description: this.getTypeDescription(key)
          });
        }
      }
    });

    return fitData;
  }

  private formatTypeName(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private getTypeDescription(type: string): string {
    const descriptions: { [key: string]: string } = {
      'record': 'GPS and sensor data points recorded during the activity',
      'session': 'Summary information about the entire workout session',
      'lap': 'Data for individual laps or segments of the workout',
      'event': 'Specific events that occurred during the workout (start, stop, etc.)',
      'device_info': 'Information about the recording device and connected sensors',
      'file_id': 'Basic file identification and metadata',
      'activity': 'High-level activity information and totals',
      'workout': 'Structured workout data if the activity was based on a workout plan',
      'hrv': 'Heart rate variability measurements',
      'monitoring': 'Background monitoring data (steps, calories, etc.)'
    };
    
    return descriptions[type] || `Data of type: ${type}`;
  }

  private displayResults(): void {
    const container = document.getElementById('dataContainer');
    if (!container || !this.manufacturerInfo) return;

    const availableMetrics = DataProcessor.extractAvailableMetrics(this.fitData, this.manufacturerInfo, this.activityType);
    
    // Show the existing data container
    container.style.display = 'grid';
    
    // Update the data list
    const dataList = document.getElementById('dataList');
    if (dataList) {
      dataList.innerHTML = `
        <div class="metrics-container">
          <h4>Available Metrics</h4>
          <div style="margin-bottom: 15px;">
            <button id="addAllMetrics" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">
              Add All
            </button>
            <button id="clearSelection" style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Clear All
            </button>
          </div>
          <div class="metrics-grid">
            ${availableMetrics.map(metric => `
              <div class="data-item metric-item" data-metric="${metric}" style="cursor: pointer; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; margin: 6px 0; transition: all 0.3s ease; user-select: none;">
                <input type="checkbox" value="${metric}" class="metric-checkbox" style="display: none;">
                <span class="metric-name" style="font-weight: 500; font-size: 14px;">${metric}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    this.attachMetricListeners();
  }

  private attachMetricListeners(): void {
    // Set up click listeners for metric items
    const metricItems = document.querySelectorAll('.metric-item');
    
    metricItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const metric = target.getAttribute('data-metric');
        const checkbox = target.querySelector('.metric-checkbox') as HTMLInputElement;
        
        if (metric && checkbox) {
          // Toggle checkbox state
          checkbox.checked = !checkbox.checked;
          
          // Update visual state
          if (checkbox.checked) {
            target.style.borderColor = '#667eea';
            target.style.backgroundColor = '#f0f4ff';
            target.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.2)';
            this.multiChartManager.addMetric(metric);
          } else {
            target.style.borderColor = '#e0e0e0';
            target.style.backgroundColor = 'white';
            target.style.boxShadow = 'none';
            this.multiChartManager.removeMetric(metric);
          }
          
          // Remove the updateVisualization call as charts auto-update
        }
      });

      // Add hover effects
      item.addEventListener('mouseenter', (e) => {
        const target = e.currentTarget as HTMLElement;
        const checkbox = target.querySelector('.metric-checkbox') as HTMLInputElement;
        if (!checkbox.checked) {
          target.style.borderColor = '#667eea';
          target.style.transform = 'translateY(-1px)';
        }
      });

      item.addEventListener('mouseleave', (e) => {
        const target = e.currentTarget as HTMLElement;
        const checkbox = target.querySelector('.metric-checkbox') as HTMLInputElement;
        if (!checkbox.checked) {
          target.style.borderColor = '#e0e0e0';
          target.style.transform = 'translateY(0)';
        }
      });
    });

    // Set up button listeners for dynamically created buttons
    const clearBtn = document.getElementById('clearSelection') as HTMLButtonElement;
    if (clearBtn) {
      clearBtn.addEventListener('click', this.clearSelection.bind(this));
    }

    const addAllBtn = document.getElementById('addAllMetrics') as HTMLButtonElement;
    if (addAllBtn) {
      addAllBtn.addEventListener('click', this.addAllMetrics.bind(this));
    }
  }

  private displayManufacturerInfo(): void {
    const container = document.getElementById('fileInfo');
    if (!container || !this.manufacturerInfo) return;

    const activityNames: { [key in ActivityType]: string } = {
      'running': 'Running',
      'cycling': 'Cycling',
      'swimming': 'Swimming', 
      'walking': 'Walking',
      'unknown': 'Unknown Activity'
    };

    // Get filename from the last file input if available
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    const fileName = fileInput?.files?.[0]?.name || 'Sample FIT File';

    container.innerHTML = `
      <div class="file-info">
        <h4>� Activity Summary</h4>
        <p><strong>File:</strong> ${fileName}</p>
        <p><strong>Activity:</strong> ${activityNames[this.activityType]}</p>
        <p><strong>Device:</strong> ${this.manufacturerInfo.name}</p>
      </div>
    `;

    // Show the Analyze button
    const analyzeContainer = document.getElementById('analyzeContainer');
    if (analyzeContainer) {
      analyzeContainer.style.display = 'block';
      const analyzeBtn = document.getElementById('analyzeBtn');
      if (analyzeBtn) {
        analyzeBtn.onclick = async () => {
          (analyzeBtn as HTMLButtonElement).disabled = true;
          analyzeBtn.textContent = 'Analyzing...';
          // Extract all metrics and values
          const metricsJson = this.extractMetricsJson();
          // Trigger a download of metrics JSON
          try {
            const blob = new Blob([JSON.stringify(metricsJson, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'activity-metrics.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } catch {}
          // Send to LLM (Gemini) using env-configured API key
          const prompt = `Given the activity metrics, can you give an assessment if the activity is hard. Recommend a recovery plan (if needed). What sections or area seems to need some improvement.`;
          const llmResponse = await this.sendToLLM(metricsJson, prompt);
          // Show response
          let resultDiv = document.getElementById('analyzeResult');
          if (!resultDiv) {
            resultDiv = document.createElement('div');
            resultDiv.id = 'analyzeResult';
            resultDiv.style.margin = '20px auto';
            resultDiv.style.maxWidth = '700px';
            resultDiv.style.background = '#f8f9fa';
            resultDiv.style.borderRadius = '8px';
            resultDiv.style.padding = '18px';
            resultDiv.style.boxShadow = '0 2px 8px rgba(102,126,234,0.08)';
            analyzeContainer.appendChild(resultDiv);
          }
          resultDiv.innerHTML = `<h4>AI Assessment</h4><pre style='white-space:pre-wrap;font-size:1rem;'>${llmResponse}</pre>`;
          (analyzeBtn as HTMLButtonElement).disabled = false;
          analyzeBtn.textContent = '🔎 Analyze Activity';
        };
      }
    }
  }

  private extractMetricsJson(): any {
    // Only include metrics that are available for charting
    if (!this.manufacturerInfo) return {};

    const available = DataProcessor.extractAvailableMetrics(
      this.fitData,
      this.manufacturerInfo,
      this.activityType
    );

    // Build allowed raw field keys from manufacturer mappings
    const allowedFields = new Set<string>();
    for (const displayName of available) {
      const fields = this.manufacturerInfo.fieldMappings[displayName] || [];
      fields.forEach(f => allowedFields.add(f));
      // Handle activity-aware speed label (pace for running, speed for cycling)
      const speedLabel = (displayName === 'Speed' || displayName === 'Pace')
        ? displayName.toLowerCase()
        : null;
      if (speedLabel) allowedFields.add(speedLabel);
    }

    const metrics: Record<string, any[]> = {};
    this.fitData.forEach(data => {
      if (data.type === 'records' || data.type === 'record') {
        data.records.forEach(record => {
          Object.keys(record).forEach(key => {
            if (!allowedFields.has(key)) return;
            const v = record[key];
            // Only collect numeric values to keep the JSON clean for analysis
            if (typeof v === 'number') {
              if (!metrics[key]) metrics[key] = [];
              metrics[key].push(v);
            }
          });
        });
      }
    });
    return metrics;
  }

  private async sendToLLM(metricsJson: any, prompt: string): Promise<string> {
    try {
      // Use Google Gemini in the browser via API key from Vite env
      const apiKey = (window as any)?.VITE_GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error('Missing VITE_GEMINI_API_KEY');

      // Lazy import to avoid bundling if unused
      const mod = await import('@google/generative-ai');
      const genAI = new mod.GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // Compact the payload to reduce token usage
      const summary: any = { activityType: this.activityType };
      const keys = Object.keys(metricsJson);
      for (const k of keys) {
        const vals = metricsJson[k];
        if (!Array.isArray(vals) || vals.length === 0) continue;
        const sample = [vals[0], vals[Math.floor(vals.length/2)], vals[vals.length-1]];
        // add min/max/avg for numeric arrays
        const nums = vals.filter((v: any) => typeof v === 'number');
        let min: number | undefined, max: number | undefined, avg: number | undefined;
        if (nums.length) {
          min = Math.min(...nums);
          max = Math.max(...nums);
          avg = nums.reduce((a: number, b: number) => a + b, 0) / nums.length;
        }
        summary[k] = { count: vals.length, sample, min, max, avg };
      }

      const fullPrompt = `${prompt}\n\nKeep it concise (<= 200 words). Use the provided aggregates.`;
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }, { text: JSON.stringify(summary) }]}]
      });
      return result.response.text();
    } catch (err: any) {
      console.error('Gemini error', err);
      return `AI analysis unavailable. ${err?.message || err}`;
    }
  }

  private clearSelection(): void {
    this.multiChartManager.clearAllMetrics();
    
    const metricItems = document.querySelectorAll('.metric-item');
    metricItems.forEach(item => {
      const checkbox = item.querySelector('.metric-checkbox') as HTMLInputElement;
      const element = item as HTMLElement;
      
      checkbox.checked = false;
      element.style.borderColor = '#e0e0e0';
      element.style.backgroundColor = 'white';
      element.style.boxShadow = 'none';
    });
  }

  private addAllMetrics(): void {
    const metricItems = document.querySelectorAll('.metric-item');
    metricItems.forEach(item => {
      const checkbox = item.querySelector('.metric-checkbox') as HTMLInputElement;
      const element = item as HTMLElement;
      const metric = element.getAttribute('data-metric');
      
      if (metric) {
        checkbox.checked = true;
        element.style.borderColor = '#667eea';
        element.style.backgroundColor = '#f0f4ff';
        element.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.2)';
        this.multiChartManager.addMetric(metric);
      }
    });
  }

  private showError(message: string): void {
    const container = document.getElementById('errorMessage');
    if (container) {
      container.innerHTML = `
        <div class="error">
          <h4>Error</h4>
          <p>${message}</p>
        </div>
      `;
    }
  }
}

import FitParser from 'fit-file-parser';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';

// Register Chart.js components including time scale
Chart.register(...registerables);

interface FitData {
  type: string;
  name: string;
  records: any[];
  description: string;
}

class FitFileAnalyzer {
  private chart: Chart | null = null;
  private fitData: FitData[] = [];
  private selectedMetrics: Set<string> = new Set();

  constructor() {
    this.initializeEventListeners();
  }

  private initializeEventListeners(): void {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.addEventListener('change', this.handleFileUpload.bind(this));
    }

    const testBtn = document.getElementById('testBtn') as HTMLButtonElement;
    if (testBtn) {
      testBtn.addEventListener('click', this.loadTestFile.bind(this));
    }

    const clearBtn = document.getElementById('clearSelection') as HTMLButtonElement;
    if (clearBtn) {
      clearBtn.addEventListener('click', this.clearSelection.bind(this));
    }
  }

  private async loadTestFile(): Promise<void> {
    console.log('Loading test file...');
    
    try {
      // Fetch the test file from the public directory
      const response = await fetch('/test-run.fit');
      if (!response.ok) {
        throw new Error(`Failed to fetch test file: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log('Test file loaded, size:', arrayBuffer.byteLength);
      
      this.showLoading(true, 'Loading test file...');
      this.clearError();
      this.showDataContainer(false);

      this.updateLoadingStatus('Parsing test FIT data...');
      
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
          this.showError(`Error parsing test FIT file: ${error.message}`);
          this.showLoading(false);
          return;
        }

        console.log('Test FIT data parsed successfully:', data);
        this.updateLoadingStatus('Processing test data...');
        
        setTimeout(() => {
          this.processFitData(data, 'test-run.fit');
          this.updateLoadingStatus('Finalizing...');
          
          setTimeout(() => {
            this.showLoading(false);
          }, 300);
        }, 500);
      });
      
    } catch (error) {
      console.error('Error loading test file:', error);
      this.showError(`Error loading test file: ${(error as Error).message}`);
    }
  }

  private async handleFileUpload(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file) return;

    this.showLoading(true, 'Reading file...');
    this.clearError();
    this.showDataContainer(false);

    try {
      const arrayBuffer = await file.arrayBuffer();
      this.updateLoadingStatus('Parsing FIT data...');
      
      const fitParser = new FitParser({
        force: true,
        speedUnit: 'mps',
        lengthUnit: 'm',
        temperatureUnit: 'celsius',
        elapsedRecordField: true,
        mode: 'both'
      });

      // Add a small delay to show the parsing status
      setTimeout(() => {
        fitParser.parse(arrayBuffer, (error: any, data: any) => {
          if (error) {
            console.error('FIT parsing error:', error);
            this.showError(`Error parsing FIT file: ${error.message}`);
            this.showLoading(false);
            return;
          }

          console.log('FIT data parsed successfully:', data);
          this.updateLoadingStatus('Processing data...');
          
          // Add another small delay to show processing status
          setTimeout(() => {
            this.processFitData(data, file.name);
            this.updateLoadingStatus('Finalizing...');
            
            // Final delay before showing results
            setTimeout(() => {
              this.showLoading(false);
            }, 300);
          }, 500);
        });
      }, 300);
    } catch (error) {
      this.showError(`Error reading file: ${(error as Error).message}`);
      this.showLoading(false);
    }
  }

  private processFitData(data: any, fileName: string): void {
    console.log('=== FULL FIT DATA STRUCTURE ===');
    console.log('Raw data:', data);
    console.log('Data type:', typeof data);
    console.log('Is array:', Array.isArray(data));
    console.log('Available keys:', Object.keys(data));
    
    // Check for specific expected running metrics
    const expectedMetrics = [
      'power', 'enhanced_speed', 'heart_rate', 'cadence', 'enhanced_altitude', 
      'stride_length', 'vertical_oscillation', 'temperature',
      'respiration_rate', 'ground_contact_time'
    ];
    
    // Deep inspection of the data structure
    for (const [key, value] of Object.entries(data)) {
      console.log(`${key}:`, {
        type: typeof value,
        isArray: Array.isArray(value),
        length: Array.isArray(value) ? value.length : 'N/A',
        sample: Array.isArray(value) && value.length > 0 ? value[0] : value
      });
      
      // If it's an array, check if any items contain our expected metrics
      if (Array.isArray(value) && value.length > 0) {
        const firstItem = value[0];
        if (firstItem && typeof firstItem === 'object') {
          const itemKeys = Object.keys(firstItem);
          const foundMetrics = expectedMetrics.filter(metric => itemKeys.includes(metric));
          if (foundMetrics.length > 0) {
            console.log(`✅ ${key} contains expected metrics:`, foundMetrics);
          }
        }
      }
    }
    
    this.fitData = [];

    // Display file information
    this.displayFileInfo(data, fileName);

    // More comprehensive data extraction
    this.extractAllPossibleData(data);

    // Display the data list
    console.log('Final fitData array:', this.fitData);
    this.displayDataList();
    this.showDataContainer(true);
  }

  private extractAllPossibleData(data: any): void {
    // Check for standard FIT data structures
    const dataKeys = Object.keys(data);
    
    // Define the expected fitness metrics we want to show
    const expectedFitnessMetrics = [
      'power', 'enhanced_speed', 'heart_rate', 'cadence', 'enhanced_altitude', 
      'stride_length', 'vertical_oscillation', 'temperature',
      'respiration_rate', 'ground_contact_time'
    ];
    
    for (const key of dataKeys) {
      const value = data[key];
      
      if (Array.isArray(value) && value.length > 0) {
        console.log(`Found array data: ${key} with ${value.length} items`);
        
        // Check if items have meaningful fields
        const firstItem = value[0];
        if (firstItem && typeof firstItem === 'object') {
          const itemKeys = Object.keys(firstItem);
          console.log(`${key} item structure:`, itemKeys);
          
          // Find which expected metrics are available in this data
          const availableMetrics = expectedFitnessMetrics.filter(metric => itemKeys.includes(metric));
          
          if (availableMetrics.length > 0) {
            console.log(`✅ ${key} contains expected metrics:`, availableMetrics);
            
            // Create separate entries for each available metric
            for (const metric of availableMetrics) {
              const metricDisplayName = this.getMetricDisplayName(metric);
              const filteredRecords = value.map(record => ({
                timestamp: record.timestamp,
                [metric]: record[metric]
              })).filter(record => record[metric] !== undefined && record[metric] !== null);
              
              if (filteredRecords.length > 0) {
                this.fitData.push({
                  type: metric,
                  name: `${metricDisplayName} (${filteredRecords.length} data points)`,
                  records: filteredRecords,
                  description: this.getMetricDescription(metric)
                });
              }
            }
          }
        }
      }
    }
  }

  private getMetricDisplayName(metric: string): string {
    const displayNames: { [key: string]: string } = {
      'power': '⚡ Power',
      'enhanced_speed': '🏃 Speed',
      'heart_rate': '❤️ Heart Rate',
      'cadence': '👟 Cadence',
      'enhanced_altitude': '⛰️ Elevation',
      'stride_length': '📏 Stride Length',
      'vertical_oscillation': '📊 Vertical Oscillation',
      'temperature': '🌡️ Temperature',
      'respiration_rate': '🫁 Respiration Rate',
      'ground_contact_time': '⏱️ Ground Contact Time'
    };
    return displayNames[metric] || metric;
  }

  private getMetricDescription(metric: string): string {
    const descriptions: { [key: string]: string } = {
      'power': 'Running power output in watts',
      'enhanced_speed': 'Running speed in meters per second',
      'heart_rate': 'Heart rate in beats per minute',
      'cadence': 'Step rate in steps per minute',
      'enhanced_altitude': 'Elevation profile in meters',
      'stride_length': 'Stride length in meters',
      'vertical_oscillation': 'Vertical movement in millimeters',
      'temperature': 'Environmental temperature in Celsius',
      'respiration_rate': 'Breathing rate in breaths per minute',
      'ground_contact_time': 'Ground contact time in milliseconds'
    };
    return descriptions[metric] || `${metric} data`;
  }

  private displayFileInfo(data: any, fileName: string): void {
    const fileInfoElement = document.getElementById('fileInfo');
    if (!fileInfoElement) return;

    const activity = data.activity || {};
    const session = data.sessions?.[0] || {};

    fileInfoElement.innerHTML = `
      <div class="file-info">
        <h4>📄 File Information</h4>
        <p><strong>File:</strong> ${fileName}</p>
        <p><strong>Sport:</strong> ${session.sport || 'Unknown'}</p>
        <p><strong>Sub Sport:</strong> ${session.sub_sport || 'Unknown'}</p>
        <p><strong>Device:</strong> ${data.file_id?.manufacturer || 'Unknown'} ${data.file_id?.product || ''}</p>
        <p><strong>Created:</strong> ${activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Unknown'}</p>
        <p><strong>Total Records:</strong> ${data.records?.length || 0}</p>
      </div>
    `;
  }

  private displayDataList(): void {
    const dataListElement = document.getElementById('dataList');
    if (!dataListElement) return;

    dataListElement.innerHTML = this.fitData.map((data, index) => `
      <div class="data-item" data-index="${index}">
        <h4>${data.name}</h4>
        <p>${data.description}</p>
      </div>
    `).join('');

    // Add click listeners to data items
    dataListElement.addEventListener('click', this.handleDataItemClick.bind(this));
  }

  private handleDataItemClick(event: Event): void {
    const target = event.target as HTMLElement;
    const dataItem = target.closest('.data-item') as HTMLElement;
    
    if (!dataItem) return;

    const index = parseInt(dataItem.dataset.index || '0');
    const selectedData = this.fitData[index];

    // Toggle selection
    if (this.selectedMetrics.has(selectedData.type)) {
      this.selectedMetrics.delete(selectedData.type);
      dataItem.classList.remove('selected');
    } else {
      this.selectedMetrics.add(selectedData.type);
      dataItem.classList.add('selected');
    }

    console.log('Selected metrics:', Array.from(this.selectedMetrics));
    
    // Dynamically update the chart
    this.updateChart();
  }

  private updateChart(): void {
    if (this.selectedMetrics.size === 0) {
      // Clear the chart if no metrics selected
      if (this.chart) {
        this.chart.destroy();
        this.chart = null;
      }
      
      const chartTitle = document.getElementById('chartTitle');
      if (chartTitle) {
        chartTitle.textContent = 'Select metrics to visualize';
      }

      // Hide statistics container
      this.showStatsContainer(false);
      return;
    }

    // Create/update aggregated chart
    this.createAggregatedChart();
    
    // Update statistics
    this.updateStatistics();
  }

  private clearSelection(): void {
    this.selectedMetrics.clear();
    document.querySelectorAll('.data-item').forEach(item => {
      item.classList.remove('selected');
    });
    
    // Update chart (will clear it since no metrics selected)
    this.updateChart();
  }

  private showStatsContainer(show: boolean): void {
    const container = document.getElementById('statsContainer');
    if (container) {
      container.style.display = show ? 'block' : 'none';
    }
  }

  private updateStatistics(): void {
    if (this.selectedMetrics.size === 0) {
      this.showStatsContainer(false);
      return;
    }

    this.showStatsContainer(true);
    
    const selectedData = this.fitData.filter(data => this.selectedMetrics.has(data.type));
    const statsListElement = document.getElementById('statsList');
    
    if (!statsListElement) return;

    const statsHTML = selectedData.map(data => {
      const metricField = data.type;
      const values = data.records
        .map(record => record[metricField])
        .filter(value => value !== undefined && value !== null && !isNaN(value));

      if (values.length === 0) {
        return '';
      }

      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      const maximum = Math.max(...values);
      const unit = this.getStatUnit(metricField);

      return `
        <div class="stat-item">
          <h4>
            ${this.getMetricDisplayName(metricField)}
          </h4>
          <div class="stat-values">
            <div class="stat-value">
              <div class="stat-label">Average</div>
              <div class="stat-number">${average.toFixed(1)}<span class="stat-unit">${unit}</span></div>
            </div>
            <div class="stat-value">
              <div class="stat-label">Maximum</div>
              <div class="stat-number">${maximum.toFixed(1)}<span class="stat-unit">${unit}</span></div>
            </div>
          </div>
        </div>
      `;
    }).filter(html => html !== '').join('');

    statsListElement.innerHTML = statsHTML;
  }

  private getStatUnit(metric: string): string {
    const units: { [key: string]: string } = {
      'power': 'W',
      'enhanced_speed': 'm/s',
      'heart_rate': 'bpm',
      'cadence': 'spm',
      'enhanced_altitude': 'm',
      'stride_length': 'm',
      'vertical_oscillation': 'mm',
      'temperature': '°C',
      'respiration_rate': 'bpm',
      'ground_contact_time': 'ms'
    };
    return units[metric] || '';
  }

  private createAggregatedChart(): void {
    const chartTitle = document.getElementById('chartTitle');
    if (chartTitle) {
      chartTitle.textContent = `📈 Selected Metrics (${this.selectedMetrics.size})`;
    }

    // Destroy existing chart
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = document.getElementById('dataChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Get data for selected metrics
    const selectedData = this.fitData.filter(data => this.selectedMetrics.has(data.type));
    
    if (selectedData.length === 0) return;

    console.log('Creating aggregated chart with data:', selectedData);

    // Create chart configuration for multiple metrics
    const chartConfig = this.createMultiMetricChartConfig(selectedData);
    
    if (chartConfig) {
      this.chart = new Chart(ctx, chartConfig);
      console.log('Aggregated chart created successfully');
    } else {
      console.log('Failed to create aggregated chart config');
    }
  }

  private createMultiMetricChartConfig(dataArray: FitData[]): ChartConfiguration | null {
    if (dataArray.length === 0) return null;

    // Find the dataset with the most records to use as the time baseline
    const baselineData = dataArray.reduce((prev, current) => 
      prev.records.length > current.records.length ? prev : current, 
      dataArray[0]
    );

    console.log('Using baseline data:', baselineData.type, 'with', baselineData.records.length, 'records');

    const chartData: any = {
      labels: baselineData.records.map(record => new Date(record.timestamp)),
      datasets: []
    };

    // Group metrics by similar scales for better visualization
    const powerMetrics = ['power'];
    const speedMetrics = ['enhanced_speed'];
    const distanceMetrics = ['enhanced_altitude', 'stride_length'];
    const timeMetrics = ['ground_contact_time'];
    const smallValueMetrics = ['vertical_oscillation'];
    const temperatureMetrics = ['temperature'];
    const cadenceMetrics = ['cadence'];

    let yAxisIndex = 0;
    const yAxes: any = {};

    for (const data of dataArray) {
      const metricInfo = this.getMetricChartInfo(data.type);
      const metricField = data.type;

      // Determine which Y-axis to use based on metric type
      let yAxisID = 'y';
      if (powerMetrics.includes(metricField)) {
        yAxisID = 'yPower';
      } else if (speedMetrics.includes(metricField)) {
        yAxisID = 'ySpeed';
      } else if (distanceMetrics.includes(metricField)) {
        yAxisID = 'yDistance';
      } else if (timeMetrics.includes(metricField)) {
        yAxisID = 'yTime';
      } else if (smallValueMetrics.includes(metricField)) {
        yAxisID = 'ySmall';
      } else if (temperatureMetrics.includes(metricField)) {
        yAxisID = 'yTemp';
      } else if (cadenceMetrics.includes(metricField)) {
        yAxisID = 'yCadence';
      }
      // heartRateMetrics use default 'y' axis

      // Store axis configuration
      if (!yAxes[yAxisID]) {
        yAxes[yAxisID] = {
          type: 'linear',
          display: yAxisIndex < 2, // Only show first 2 axes to avoid clutter
          position: yAxisIndex % 2 === 0 ? 'left' : 'right',
          title: {
            display: true,
            text: metricInfo.unit
          }
        };
        
        if (yAxisIndex > 0) {
          yAxes[yAxisID].grid = { drawOnChartArea: false };
        }
        
        yAxisIndex++;
      }

      // Add dataset
      chartData.datasets.push({
        label: metricInfo.label,
        data: data.records.map(record => record[metricField]),
        borderColor: metricInfo.borderColor,
        backgroundColor: metricInfo.backgroundColor,
        tension: 0.1,
        fill: false,
        yAxisID: yAxisID
      });
    }

    return {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'minute'
            },
            title: {
              display: true,
              text: 'Time'
            }
          },
          ...yAxes
        },
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        }
      }
    };
  }

  private getMetricChartInfo(metric: string): { label: string, unit: string, borderColor: string, backgroundColor: string } {
    const chartInfo: { [key: string]: { label: string, unit: string, borderColor: string, backgroundColor: string } } = {
      'power': {
        label: 'Power',
        unit: 'Watts (W)',
        borderColor: 'rgb(255, 205, 86)',
        backgroundColor: 'rgba(255, 205, 86, 0.2)'
      },
      'enhanced_speed': {
        label: 'Speed',
        unit: 'Speed (m/s)',
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)'
      },
      'heart_rate': {
        label: 'Heart Rate',
        unit: 'BPM',
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)'
      },
      'cadence': {
        label: 'Cadence',
        unit: 'Steps per minute',
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)'
      },
      'enhanced_altitude': {
        label: 'Elevation',
        unit: 'Meters (m)',
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)'
      },
      'stride_length': {
        label: 'Stride Length',
        unit: 'Meters (m)',
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)'
      },
      'vertical_oscillation': {
        label: 'Vertical Oscillation',
        unit: 'Millimeters (mm)',
        borderColor: 'rgb(201, 203, 207)',
        backgroundColor: 'rgba(201, 203, 207, 0.2)'
      },
      'temperature': {
        label: 'Temperature',
        unit: 'Celsius (°C)',
        borderColor: 'rgb(255, 0, 0)',
        backgroundColor: 'rgba(255, 0, 0, 0.2)'
      },
      'respiration_rate': {
        label: 'Respiration Rate',
        unit: 'Breaths per minute',
        borderColor: 'rgb(128, 0, 128)',
        backgroundColor: 'rgba(128, 0, 128, 0.2)'
      },
      'ground_contact_time': {
        label: 'Ground Contact Time',
        unit: 'Milliseconds (ms)',
        borderColor: 'rgb(255, 99, 255)',
        backgroundColor: 'rgba(255, 99, 255, 0.2)'
      }
    };

    return chartInfo[metric] || {
      label: metric,
      unit: 'Value',
      borderColor: 'rgb(100, 100, 100)',
      backgroundColor: 'rgba(100, 100, 100, 0.2)'
    };
  }

  private showLoading(show: boolean, message?: string): void {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = show ? 'block' : 'none';
      
      if (show && message) {
        this.updateLoadingStatus(message);
      }
    }
  }

  private updateLoadingStatus(message: string): void {
    const loadingText = document.querySelector('.loading-text');
    if (loadingText) {
      const dotsElement = loadingText.querySelector('.loading-dots');
      loadingText.innerHTML = `${message} `;
      if (dotsElement) {
        loadingText.appendChild(dotsElement);
      }
    }
  }

  private showDataContainer(show: boolean): void {
    const container = document.getElementById('dataContainer');
    if (container) {
      container.style.display = show ? 'grid' : 'none';
    }
  }

  private showError(message: string): void {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
      errorElement.innerHTML = `<div class="error">${message}</div>`;
    }
  }

  private clearError(): void {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
      errorElement.innerHTML = '';
    }
  }
}

// Initialize the application
(() => {
  const _app = new FitFileAnalyzer();
  console.log('FIT File Analyzer initialized', _app);
})();

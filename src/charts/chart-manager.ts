import { Chart, ChartConfiguration } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { FitData, ChartDataPoint, MetricGroup, ActivityType } from '../types';
import { SpeedConverter } from '../utils/speed-converter';

export class ChartManager {
  private chart: Chart | null = null;
  private readonly selectedMetrics: Set<string> = new Set();

  getSelectedMetrics(): Set<string> {
    return this.selectedMetrics;
  }

  addMetric(metric: string): void {
    this.selectedMetrics.add(metric);
  }

  removeMetric(metric: string): void {
    this.selectedMetrics.delete(metric);
  }

  clearMetrics(): void {
    this.selectedMetrics.clear();
  }

  private getMetricGroups(): MetricGroup[] {
    return [
      {
        name: 'Heart Rate',
        metrics: ['Heart Rate'],
        yAxisId: 'heartRate',
        color: '#ff6b6b'
      },
      {
        name: 'Speed/Pace',
        metrics: ['Speed', 'Pace'],
        yAxisId: 'speed',
        color: '#4ecdc4'
      },
      {
        name: 'Power',
        metrics: ['Power'],
        yAxisId: 'power',
        color: '#45b7d1'
      },
      {
        name: 'Cadence',
        metrics: ['Cadence'],
        yAxisId: 'cadence',
        color: '#96ceb4'
      },
      {
        name: 'Elevation',
        metrics: ['Altitude', 'Elevation'],
        yAxisId: 'elevation',
        color: '#ffeaa7'
      },
      {
        name: 'Temperature',
        metrics: ['Temperature'],
        yAxisId: 'temperature',
        color: '#fd79a8'
      },
      {
        name: 'Running Dynamics',
        metrics: ['Stride Length', 'Ground Contact Time', 'Respiration Rate'],
        yAxisId: 'dynamics',
        color: '#dda0dd'
      },
      {
        name: 'Other',
        metrics: [], // Will contain all other metrics
        yAxisId: 'other',
        color: '#a29bfe'
      }
    ];
  }

  private findMetricGroup(metric: string): MetricGroup {
    const groups = this.getMetricGroups();
    const group = groups.find(g => g.metrics.includes(metric));
    return group || groups[groups.length - 1]; // Return 'Other' group if not found
  }

  updateChart(fitData: FitData[], activityType: ActivityType): void {
    if (this.selectedMetrics.size === 0) {
      this.destroyChart();
      return;
    }

    const canvas = document.getElementById('dataChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.destroyChart();

    const datasets: any[] = [];
    const scales: any = { 
      x: { 
        type: 'time',
        position: 'bottom',
        time: {
          displayFormats: {
            second: 'HH:mm:ss',
            minute: 'HH:mm',
            hour: 'HH:mm'
          },
          tooltipFormat: 'HH:mm:ss'
        },
        title: {
          display: true,
          text: 'Time'
        }
      } 
    };

    // Store all data points for tooltip functionality
    const allDataPoints: Map<number, { [metric: string]: any }> = new Map();
    // Store metric colors for tooltip
    const metricColors: Map<string, string> = new Map();
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#fd79a8'];

    Array.from(this.selectedMetrics).forEach((selectedMetric, index) => {
      // Store the color for this metric
      metricColors.set(selectedMetric, colors[index % colors.length]);
      const dataType = fitData.find(data => 
        data.records.some(record => 
          Object.keys(record).some(key => {
            const displayName = this.getDisplayName(key, activityType);
            return displayName === selectedMetric;
          })
        )
      );

      if (!dataType) return;

      const points: ChartDataPoint[] = [];
      
      dataType.records.forEach((record) => {
        // Get timestamp for x-axis
        const timestamp = record.timestamp;
        if (!timestamp) return;

        const timeValue = new Date(timestamp);
        const timeKey = timeValue.getTime();

        // Initialize data point storage if not exists
        if (!allDataPoints.has(timeKey)) {
          allDataPoints.set(timeKey, { timestamp: timeValue });
        }

        Object.keys(record).forEach(key => {
          const displayName = this.getDisplayName(key, activityType);
          if (displayName === selectedMetric && record[key] !== null && record[key] !== undefined) {
            let value = record[key];
            
            // Apply speed conversion for speed metrics
            if (key === 'speed' || key === 'enhanced_speed') {
              value = SpeedConverter.convertSpeed(value, activityType);
            }
            
            points.push({
              x: timeValue,
              y: value
            });

            // Store all metrics for tooltip
            allDataPoints.get(timeKey)![displayName] = value;
          }
        });

        // Store all other metrics for tooltip even if not selected
        Object.keys(record).forEach(key => {
          const displayName = this.getDisplayName(key, activityType);
          if (record[key] !== null && record[key] !== undefined && displayName !== selectedMetric) {
            let value = record[key];
            
            // Apply speed conversion for speed metrics
            if (key === 'speed' || key === 'enhanced_speed') {
              value = SpeedConverter.convertSpeed(value, activityType);
            }
            
            allDataPoints.get(timeKey)![displayName] = value;
          }
        });
      });

      if (points.length > 0) {
        const metricGroup = this.findMetricGroup(selectedMetric);
        const metricColor = metricColors.get(selectedMetric) || colors[index % colors.length];
        
        datasets.push({
          label: selectedMetric,
          data: points,
          borderColor: metricColor,
          backgroundColor: metricColor + '20',
          fill: false,
          tension: 0.1,
          yAxisID: metricGroup.yAxisId
        });

        // Add Y-axis for this metric group if not already added
        if (!scales[metricGroup.yAxisId]) {
          scales[metricGroup.yAxisId] = {
            type: 'linear',
            display: true,
            position: Object.keys(scales).length % 2 === 0 ? 'left' : 'right',
            title: {
              display: true,
              text: this.getYAxisLabel(selectedMetric, activityType)
            }
          };
        }
      }
    });

    const config: ChartConfiguration = {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales,
        plugins: {
          title: {
            display: true,
            text: 'FIT File Data Visualization'
          },
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            displayColors: false,
            callbacks: {
              title: (tooltipItems) => {
                if (tooltipItems.length > 0) {
                  const time = tooltipItems[0].parsed.x;
                  return new Date(time).toLocaleTimeString();
                }
                return '';
              },
              label: () => {
                // Return empty string to hide default dataset labels
                return '';
              },
              beforeBody: (tooltipItems) => {
                if (tooltipItems.length > 0) {
                  const time = tooltipItems[0].parsed.x;
                  const dataPoint = allDataPoints.get(time);
                  
                  if (dataPoint) {
                    const lines: string[] = [];
                    // Show selected metrics with color indicators matching chart colors
                    let colorIndex = 0;
                    this.selectedMetrics.forEach(selectedMetric => {
                      if (dataPoint[selectedMetric] !== undefined && typeof dataPoint[selectedMetric] === 'number') {
                        const unit = this.getYAxisLabel(selectedMetric, activityType);
                        const chartColor = colors[colorIndex % colors.length];
                        // Create a color indicator that matches the chart line color
                        const colorIndicator = this.getColorIndicator(chartColor);
                        lines.push(`${colorIndicator} ${selectedMetric}: ${dataPoint[selectedMetric].toFixed(2)} ${unit}`);
                        colorIndex++;
                      }
                    });
                    return lines;
                  }
                }
                return [];
              }
            }
          }
        },
        interaction: {
          mode: 'index',
          intersect: false
        },
        elements: {
          point: {
            radius: 1
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  private getColorIndicator(hexColor: string): string {
    // Map hex colors to appropriate visual indicators
    const colorMap: { [key: string]: string } = {
      '#ff6b6b': '🔴', // Red
      '#4ecdc4': '🟢', // Teal/Green
      '#45b7d1': '🔵', // Blue
      '#96ceb4': '🟩', // Light Green
      '#ffeaa7': '🟡', // Yellow
      '#dda0dd': '🟣', // Purple
      '#fd79a8': '🩷'  // Pink
    };
    
    return colorMap[hexColor] || '⚫'; // Default to black circle if color not found
  }

  private getDisplayName(fieldName: string, activityType?: ActivityType): string {
    const displayNames: { [key: string]: string } = {
      'heart_rate': 'Heart Rate',
      'hr': 'Heart Rate',
      'speed': activityType ? SpeedConverter.getSpeedLabel(activityType) : 'Speed',
      'enhanced_speed': activityType ? SpeedConverter.getSpeedLabel(activityType) : 'Speed',
      'cadence': 'Cadence',
      'power': 'Power',
      'distance': 'Distance',
      'altitude': 'Elevation',
      'enhanced_altitude': 'Elevation',
      'temperature': 'Temperature',
      'calories': 'Calories',
      'grade': 'Grade',
      'position_lat': 'Latitude',
      'position_long': 'Longitude',
      'timestamp': 'Timestamp',
      'left_right_balance': 'Left Right Balance',
      'vertical_oscillation': 'Vertical Oscillation',
      'stance_time': 'Ground Contact Time',
      'stance_time_percent': 'Stance Time Percent',
      'vertical_ratio': 'Vertical Ratio',
      'step_length': 'Stride Length',
      'total_strokes': 'Stroke Rate',
      'stroke_type': 'Stroke Type',
      'respiration_rate': 'Respiration Rate'
    };
    
    return displayNames[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private getYAxisLabel(metric: string, activityType: ActivityType): string {
    const labels: { [key: string]: string } = {
      'Heart Rate': 'BPM',
      'Speed': SpeedConverter.getSpeedUnit(activityType),
      'Pace': SpeedConverter.getSpeedUnit(activityType),
      'Cadence': activityType === 'running' ? 'spm' : 'RPM',
      'Power': 'Watts',
      'Distance': 'Meters',
      'Altitude': 'Meters',
      'Elevation': 'Meters',
      'Temperature': '°C',
      'Calories': 'Calories',
      'Grade': '%',
      'Stride Length': 'cm',
      'Ground Contact Time': 'ms',
      'Respiration Rate': 'breaths/min'
    };
    
    return labels[metric] || metric;
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  destroy(): void {
    this.destroyChart();
  }
}

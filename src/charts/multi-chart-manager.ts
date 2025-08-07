import { Chart, ChartConfiguration } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { FitData, ChartDataPoint, MetricGroup, ActivityType, ManufacturerInfo } from '../types';
import { SpeedConverter } from '../utils/speed-converter';

interface ChartInfo {
  id: string;
  metrics: Set<string>;
  chart: Chart;
  container: HTMLElement;
}

export class MultiChartManager {
  private readonly charts: Map<string, ChartInfo> = new Map();
  private draggedChart: ChartInfo | null = null;
  private chartCounter = 0;
  private fitData: FitData[] = [];
  private activityType: ActivityType = 'unknown';

  constructor() {
    this.setupDragAndDrop();
  }

  setData(fitData: FitData[], activityType: ActivityType): void {
    this.fitData = fitData;
    this.activityType = activityType;
  }





  private setupDragAndDrop(): void {
    document.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    document.addEventListener('drop', (e) => {
      e.preventDefault();
      this.handleDrop(e);
    });
  }

  private handleDrop(e: DragEvent): void {
    if (!this.draggedChart) return;

    const dropTarget = (e.target as HTMLElement).closest('.chart-container');
    if (dropTarget && dropTarget !== this.draggedChart.container) {
      const targetChartId = dropTarget.getAttribute('data-chart-id');
      if (targetChartId) {
        this.mergeCharts(this.draggedChart.id, targetChartId);
      }
    }

    this.cleanupDragState();
  }

  private cleanupDragState(): void {
    if (this.draggedChart) {
      this.draggedChart.container.classList.remove('dragging');
      this.draggedChart = null;
    }

    document.querySelectorAll('.chart-container:not(.overview-chart)').forEach(container => {
      container.classList.remove('drop-target');
    });
  }

  addMetric(metric: string): void {
    console.log('Adding metric:', metric);
    console.log('Available fitData:', this.fitData.length, 'items');
    console.log('Activity type:', this.activityType);
    
    // Create a new chart for this metric
    const chartId = `chart-${++this.chartCounter}`;
    const container = this.createChartContainer(chartId, metric);
    
    const metrics = new Set<string>();
    metrics.add(metric);

    const chart = this.createChart(container, metrics);
    
    const chartInfo: ChartInfo = {
      id: chartId,
      metrics,
      chart,
      container
    };

    this.charts.set(chartId, chartInfo);
    this.updateChartsTitle();
  }

  removeMetric(metric: string): void {
    // Find chart containing this metric
    for (const [chartId, chartInfo] of this.charts) {
      if (chartInfo.metrics.has(metric)) {
        chartInfo.metrics.delete(metric);
        
        if (chartInfo.metrics.size === 0) {
          // Remove empty chart
          this.removeChart(chartId);
        } else {
          // Update chart without this metric
          this.updateChart(chartInfo);
        }
        break;
      }
    }
    this.updateChartsTitle();
  }

  clearAllMetrics(): void {
    this.charts.forEach((chartInfo) => {
      chartInfo.chart.destroy();
      chartInfo.container.remove();
    });
    this.charts.clear();
    this.updateChartsTitle();
  }

  mergeMetrics(metrics: string[]): void {
    if (metrics.length === 0) return;

    // Create a single chart with all metrics
    const chartId = `chart-${++this.chartCounter}`;
    const mergedTitle = metrics.join(', ');
    const container = this.createChartContainer(chartId, mergedTitle);
    
    const metricsSet = new Set<string>(metrics);
    const chart = this.createChart(container, metricsSet);
    
    const chartInfo: ChartInfo = {
      id: chartId,
      metrics: metricsSet,
      chart,
      container
    };

    this.charts.set(chartId, chartInfo);
    this.updateChartsTitle();
    
    // Add unmerge functionality to this chart
    this.addUnmergeButtons(chartInfo);
  }

  private addUnmergeButtons(chartInfo: ChartInfo): void {
    if (chartInfo.metrics.size <= 1) return; // No need for unmerge buttons if only one metric

    console.log('Adding unmerge buttons for chart:', chartInfo.id, 'metrics:', Array.from(chartInfo.metrics));

    const chartContainer = chartInfo.container;
    
    // Check if unmerge buttons already exist
    const existingTitleContainer = chartContainer.querySelector('div[style*="display: flex"]');
    if (existingTitleContainer) {
      console.log('Unmerge buttons already exist, skipping');
      return; // Unmerge buttons already exist, don't add them again
    }
    
    const titleElement = chartContainer.querySelector('h3');
    
    if (titleElement) {
      // Create a container for the title and unmerge buttons
      const titleContainer = document.createElement('div');
      titleContainer.style.display = 'flex';
      titleContainer.style.justifyContent = 'space-between';
      titleContainer.style.alignItems = 'flex-start';
      titleContainer.style.marginBottom = '15px';
      titleContainer.style.flexWrap = 'wrap';
      titleContainer.style.gap = '10px';

      // Create title element
      const newTitle = document.createElement('h3');
      newTitle.textContent = Array.from(chartInfo.metrics).join(', ');
      newTitle.style.margin = '0';
      newTitle.style.flexGrow = '1';
      newTitle.style.minWidth = '200px';

      // Create unmerge buttons container
      const unmergeContainer = document.createElement('div');
      unmergeContainer.style.display = 'flex';
      unmergeContainer.style.flexWrap = 'wrap';
      unmergeContainer.style.gap = '5px';
      unmergeContainer.style.alignItems = 'center';

      // Add unmerge buttons for each metric
      chartInfo.metrics.forEach(metric => {
        const unmergeBtn = document.createElement('button');
        unmergeBtn.textContent = `× ${metric}`;
        unmergeBtn.style.padding = '4px 8px';
        unmergeBtn.style.fontSize = '11px';
        unmergeBtn.style.background = '#dc3545';
        unmergeBtn.style.color = 'white';
        unmergeBtn.style.border = 'none';
        unmergeBtn.style.borderRadius = '4px';
        unmergeBtn.style.cursor = 'pointer';
        unmergeBtn.style.whiteSpace = 'nowrap';
        unmergeBtn.style.transition = 'all 0.2s ease';
        unmergeBtn.style.fontWeight = '500';
        unmergeBtn.title = `Remove ${metric} from this chart`;

        // Add hover effects
        unmergeBtn.addEventListener('mouseenter', () => {
          unmergeBtn.style.background = '#c82333';
          unmergeBtn.style.transform = 'scale(1.05)';
        });

        unmergeBtn.addEventListener('mouseleave', () => {
          unmergeBtn.style.background = '#dc3545';
          unmergeBtn.style.transform = 'scale(1)';
        });

        unmergeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.unmergeMetric(chartInfo.id, metric);
        });

        unmergeContainer.appendChild(unmergeBtn);
      });

      titleContainer.appendChild(newTitle);
      titleContainer.appendChild(unmergeContainer);

      // Replace the original title
      titleElement.replaceWith(titleContainer);
    }
  }

  private unmergeMetric(chartId: string, metric: string): void {
    const chartInfo = this.charts.get(chartId);
    if (!chartInfo) return;

    // Remove the metric from the chart
    chartInfo.metrics.delete(metric);

    if (chartInfo.metrics.size === 0) {
      // If no metrics left, remove the chart entirely
      this.removeChart(chartId);
    } else if (chartInfo.metrics.size === 1) {
      // If only one metric left, update the chart and remove unmerge buttons
      this.updateChart(chartInfo);
      this.removeUnmergeButtons(chartInfo);
    } else {
      // Multiple metrics still remain, update the chart and refresh unmerge buttons
      this.updateChart(chartInfo);
      this.refreshUnmergeButtons(chartInfo);
    }

    // Create a new individual chart for the removed metric
    const newChartId = `chart-${++this.chartCounter}`;
    const container = this.createChartContainer(newChartId, metric);
    
    const metrics = new Set<string>();
    metrics.add(metric);

    const chart = this.createChart(container, metrics);
    
    const newChartInfo: ChartInfo = {
      id: newChartId,
      metrics,
      chart,
      container
    };

    this.charts.set(newChartId, newChartInfo);
    this.updateChartsTitle();
  }

  private removeUnmergeButtons(chartInfo: ChartInfo): void {
    const container = chartInfo.container;
    const titleContainer = container.querySelector('div[style*="display: flex"]');
    
    if (titleContainer) {
      const titleText = Array.from(chartInfo.metrics)[0]; // Single metric remaining
      const newTitle = document.createElement('h3');
      newTitle.textContent = titleText;
      newTitle.style.marginBottom = '20px';
      titleContainer.replaceWith(newTitle);
    }
  }

  private refreshUnmergeButtons(chartInfo: ChartInfo): void {
    // Remove existing title container and recreate with updated buttons
    const container = chartInfo.container;
    const titleContainer = container.querySelector('div[style*="display: flex"]');
    
    if (titleContainer) {
      titleContainer.remove();
      // Re-add the h3 element temporarily so addUnmergeButtons can find it
      const tempTitle = document.createElement('h3');
      tempTitle.textContent = Array.from(chartInfo.metrics).join(', ');
      container.insertBefore(tempTitle, container.firstChild);
      this.addUnmergeButtons(chartInfo);
    }
  }

  private createChartContainer(chartId: string, metric: string): HTMLElement {
    const chartsGrid = document.getElementById('chartsGrid');
    if (!chartsGrid) throw new Error('Charts grid not found');

    const container = document.createElement('div');
    container.className = 'chart-container';
    container.setAttribute('data-chart-id', chartId);
    container.draggable = true;

    container.innerHTML = `
      <h3>${metric}</h3>
      <div class="chart-wrapper">
        <canvas id="chart-${chartId}"></canvas>
      </div>
    `;

    // Add drag event listeners
    container.addEventListener('dragstart', () => {
      const chartInfo = this.charts.get(chartId);
      if (chartInfo) {
        this.draggedChart = chartInfo;
        container.classList.add('dragging');
        
        // Highlight other charts as drop targets
        this.charts.forEach((otherChart) => {
          if (otherChart.id !== chartId) {
            otherChart.container.classList.add('drop-target');
          }
        });
      }
    });

    container.addEventListener('dragend', () => {
      this.cleanupDragState();
    });

    chartsGrid.appendChild(container);
    return container;
  }

  private createChart(container: HTMLElement, metrics: Set<string>): Chart {
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) throw new Error('Canvas not found');

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not found');

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

    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#fd79a8'];
    const allDataPoints: Map<number, { [metric: string]: any }> = new Map();
    let colorIndex = 0;

    Array.from(metrics).forEach((selectedMetric) => {
      console.log('Processing metric:', selectedMetric);
      const dataType = this.fitData.find(data => 
        data.records.some(record => 
          Object.keys(record).some(key => {
            const displayName = this.getDisplayName(key, this.activityType);
            return displayName === selectedMetric;
          })
        )
      );

      console.log('Found dataType for', selectedMetric, ':', dataType ? dataType.type : 'none');
      if (!dataType) return;

      const points: ChartDataPoint[] = [];
      
      dataType.records.forEach((record) => {
        const timestamp = record.timestamp;
        if (!timestamp) return;

        const timeValue = new Date(timestamp);
        const timeKey = timeValue.getTime();

        if (!allDataPoints.has(timeKey)) {
          allDataPoints.set(timeKey, { timestamp: timeValue });
        }

        Object.keys(record).forEach(key => {
          const displayName = this.getDisplayName(key, this.activityType);
          if (displayName === selectedMetric && record[key] !== null && record[key] !== undefined) {
            let value = record[key];
            
            if (key === 'speed' || key === 'enhanced_speed') {
              value = SpeedConverter.convertSpeed(value, this.activityType);
            }
            
            points.push({
              x: timeValue,
              y: value
            });

            allDataPoints.get(timeKey)![displayName] = value;
          }
        });
      });

      if (points.length > 0) {
        const metricGroup = this.findMetricGroup(selectedMetric);
        const metricColor = colors[colorIndex % colors.length];
        
        datasets.push({
          label: selectedMetric,
          data: points,
          borderColor: metricColor,
          backgroundColor: metricColor + '20',
          fill: false,
          tension: 0.1,
          yAxisID: metricGroup.yAxisId
        });

        if (!scales[metricGroup.yAxisId]) {
          scales[metricGroup.yAxisId] = {
            type: 'linear',
            display: true,
            position: colorIndex % 2 === 0 ? 'left' : 'right',
            title: {
              display: true,
              text: this.getYAxisLabel(selectedMetric, this.activityType)
            }
          };
        }

        colorIndex++;
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
          legend: {
            display: metrics.size > 1,
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
              label: () => '',
              beforeBody: (tooltipItems) => {
                if (tooltipItems.length > 0) {
                  const time = tooltipItems[0].parsed.x;
                  const dataPoint = allDataPoints.get(time);
                  
                  if (dataPoint) {
                    const lines: string[] = [];
                    let colorIdx = 0;
                    metrics.forEach(selectedMetric => {
                      if (dataPoint[selectedMetric] !== undefined && typeof dataPoint[selectedMetric] === 'number') {
                        const unit = this.getYAxisLabel(selectedMetric, this.activityType);
                        const colorIndicator = this.getColorIndicator(colors[colorIdx % colors.length]);
                        lines.push(`${colorIndicator} ${selectedMetric}: ${dataPoint[selectedMetric].toFixed(2)} ${unit}`);
                        colorIdx++;
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

    return new Chart(ctx, config);
  }

  private updateChart(chartInfo: ChartInfo): void {
    // Recreate the chart with updated metrics
    chartInfo.chart.destroy();
    
    // Check if this chart has unmerge buttons (multiple metrics)
    const hasUnmergeButtons = chartInfo.metrics.size > 1;
    const existingTitleContainer = chartInfo.container.querySelector('div[style*="display: flex"]');
    
    if (hasUnmergeButtons && existingTitleContainer) {
      // Chart had unmerge buttons, refresh them
      this.refreshUnmergeButtons(chartInfo);
    } else if (!hasUnmergeButtons && existingTitleContainer) {
      // Chart had unmerge buttons but now has single metric, remove them
      this.removeUnmergeButtons(chartInfo);
    } else if (hasUnmergeButtons && !existingTitleContainer) {
      // Chart didn't have unmerge buttons but now needs them
      // First add a basic title
      const title = chartInfo.container.querySelector('h3');
      if (!title) {
        const newTitle = document.createElement('h3');
        newTitle.textContent = Array.from(chartInfo.metrics).join(', ');
        chartInfo.container.insertBefore(newTitle, chartInfo.container.firstChild);
      }
      this.addUnmergeButtons(chartInfo);
    } else {
      // Single metric chart, just update the title
      const title = chartInfo.container.querySelector('h3');
      if (title) {
        title.textContent = Array.from(chartInfo.metrics).join(', ');
      }
    }
    
    // Create new chart with updated metrics
    chartInfo.chart = this.createChart(chartInfo.container, chartInfo.metrics);
  }

  private mergeCharts(sourceChartId: string, targetChartId: string): void {
    const sourceChart = this.charts.get(sourceChartId);
    const targetChart = this.charts.get(targetChartId);

    if (!sourceChart || !targetChart) return;

    console.log('Merging charts:', {
      source: { id: sourceChartId, metrics: Array.from(sourceChart.metrics) },
      target: { id: targetChartId, metrics: Array.from(targetChart.metrics) }
    });

    // Merge metrics from source to target
    sourceChart.metrics.forEach(metric => {
      targetChart.metrics.add(metric);
    });

    console.log('After merge, target metrics:', Array.from(targetChart.metrics));

    // Update target chart (this will handle unmerge buttons automatically)
    this.updateChart(targetChart);

    // Remove source chart
    this.removeChart(sourceChartId);
  }

  private removeChart(chartId: string): void {
    const chartInfo = this.charts.get(chartId);
    if (chartInfo) {
      chartInfo.chart.destroy();
      chartInfo.container.remove();
      this.charts.delete(chartId);
    }
  }

  private updateChartsTitle(): void {
    const title = document.getElementById('chartsTitle');
    const grid = document.getElementById('chartsGrid');
    
    const userChartCount = this.charts.size;
    
    if (userChartCount === 0) {
      if (title) {
        title.textContent = 'Select metrics to visualize';
      }
      if (grid) grid.classList.add('empty');
    } else {
      if (title) {
        title.textContent = `${userChartCount} Chart${userChartCount > 1 ? 's' : ''}`;
      }
      if (grid) grid.classList.remove('empty');
    }
  }

  private getMetricGroups(): MetricGroup[] {
    return [
      { name: 'Heart Rate', metrics: ['Heart Rate'], yAxisId: 'heartRate', color: '#ff6b6b' },
      { name: 'Speed/Pace', metrics: ['Speed', 'Pace'], yAxisId: 'speed', color: '#4ecdc4' },
      { name: 'Power', metrics: ['Power'], yAxisId: 'power', color: '#45b7d1' },
      { name: 'Cadence', metrics: ['Cadence'], yAxisId: 'cadence', color: '#96ceb4' },
      { name: 'Elevation', metrics: ['Altitude', 'Elevation'], yAxisId: 'elevation', color: '#ffeaa7' },
      { name: 'Temperature', metrics: ['Temperature'], yAxisId: 'temperature', color: '#fd79a8' },
      { name: 'Running Dynamics', metrics: ['Stride Length', 'Ground Contact Time', 'Respiration Rate'], yAxisId: 'dynamics', color: '#dda0dd' },
      { name: 'Other', metrics: [], yAxisId: 'other', color: '#a29bfe' }
    ];
  }

  private findMetricGroup(metric: string): MetricGroup {
    const groups = this.getMetricGroups();
    const group = groups.find(g => g.metrics.includes(metric));
    return group || groups[groups.length - 1];
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

  private getColorIndicator(hexColor: string): string {
    const colorMap: { [key: string]: string } = {
      '#ff6b6b': '🔴',
      '#4ecdc4': '🟢',
      '#45b7d1': '🔵',
      '#96ceb4': '🟩',
      '#ffeaa7': '🟡',
      '#dda0dd': '🟣',
      '#fd79a8': '🩷'
    };
    
    return colorMap[hexColor] || '⚫';
  }

  destroy(): void {
    this.clearAllMetrics();
  }
}
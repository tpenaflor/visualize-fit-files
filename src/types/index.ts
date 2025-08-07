export interface FitData {
  type: string;
  name: string;
  records: any[];
  description: string;
}

export interface ManufacturerInfo {
  name: string;
  fieldMappings: { [key: string]: string[] };
}

export interface ChartDataPoint {
  x: number | Date;
  y: number;
}

export interface MetricGroup {
  name: string;
  metrics: string[];
  yAxisId: string;
  color: string;
}

export type ActivityType = 'running' | 'cycling' | 'swimming' | 'walking' | 'unknown';

import { FitData, ManufacturerInfo, ActivityType } from '../types';
import { SpeedConverter } from './speed-converter';

export class DataProcessor {
  static processRecords(
    fitData: FitData[], 
    _manufacturerInfo: ManufacturerInfo, 
    activityType: ActivityType
  ): FitData[] {
    // Note: Gear change event stamping removed per request.

    const processedData = fitData.map(data => ({
      ...data,
      records: data.records.map(record => {
        const processedRecord = { ...record };
        
        // Process speed fields based on activity type
        if (record.speed || record.enhanced_speed) {
          const speedValue = record.enhanced_speed || record.speed;
          if (speedValue && speedValue > 0) {
            const convertedSpeed = SpeedConverter.convertSpeed(speedValue, activityType);
            const speedLabel = SpeedConverter.getSpeedLabel(activityType);
            processedRecord[speedLabel.toLowerCase()] = convertedSpeed;
          }
        }

  // Left/Right Balance support removed
        
        return processedRecord;
      })
    }));
    
    return processedData;
  }

  static extractAvailableMetrics(fitData: FitData[], manufacturerInfo: ManufacturerInfo, _activityType: ActivityType): string[] {
    const fieldMappings = manufacturerInfo.fieldMappings;

    // Focus on time-series records only (avoid sessions/laps inflating counts)
    const recordData = fitData.filter(d => d.type === 'records' || d.type === 'record');
    const totalRecordCount = recordData.reduce((sum, d) => sum + d.records.length, 0);

    // Quick exit if no records
    if (totalRecordCount === 0) return [];

    // Build a set of present fields (non-null in any record)
    const presentFields = new Set<string>();
    recordData.forEach(d => {
      d.records.forEach(r => {
        Object.keys(r).forEach(k => {
          if (r[k] !== null && r[k] !== undefined) presentFields.add(k);
        });
      });
    });

    // Define thresholds for what counts as "substantial" data
    const nonZeroMin = Math.max(3, Math.floor(totalRecordCount * 0.01)); // >=1% or at least 3
    const nonNullMin = Math.max(10, Math.floor(totalRecordCount * 0.02)); // >=2% or at least 10

    const availableMetrics = new Set<string>();

    Object.entries(fieldMappings).forEach(([displayName, possibleFields]) => {
      const include = possibleFields.some(field => {
        if (!presentFields.has(field)) return false;

        let nonNullCount = 0;
        let nonZeroCount = 0;

        for (const d of recordData) {
          for (const r of d.records) {
            const v = r[field];
            if (v !== null && v !== undefined) {
              nonNullCount++;
              if (typeof v === 'number' && v !== 0) nonZeroCount++;
            }
          }
        }

        // A metric is substantial if we have enough non-zero values OR enough non-null (constant but meaningful)
        const substantial = nonZeroCount >= nonZeroMin || nonNullCount >= nonNullMin;
        // Debug line kept light to avoid noise
        // console.debug(`[metric-check] ${displayName}/${field}: nonZero=${nonZeroCount} (>=${nonZeroMin}) nonNull=${nonNullCount} (>=${nonNullMin}) -> ${substantial}`);
        return substantial;
      });

      if (include) availableMetrics.add(displayName);
    });

    return Array.from(availableMetrics).sort((a, b) => a.localeCompare(b));
  }

  static calculateStatistics(fitData: FitData[], selectedMetrics: Set<string>, manufacturerInfo: ManufacturerInfo): { [key: string]: any } {
    const stats: { [key: string]: any } = {};
    const fieldMappings = manufacturerInfo.fieldMappings;
    
    selectedMetrics.forEach(metric => {
      const values = this.extractValuesForMetric(fitData, metric, fieldMappings);
      
      if (values.length > 0) {
        const sortedValues = [...values].sort((a, b) => a - b);
        stats[metric] = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((sum, val) => sum + val, 0) / values.length,
          median: sortedValues[Math.floor(sortedValues.length / 2)],
          count: values.length
        };
      }
    });
    
    return stats;
  }

  private static extractValuesForMetric(fitData: FitData[], metric: string, fieldMappings: { [key: string]: string[] }): number[] {
    const values: number[] = [];
    const fieldsForMetric = fieldMappings[metric] || [];
    
    fitData.forEach(data => {
      data.records.forEach(record => {
        fieldsForMetric.forEach(fieldName => {
          const value = record[fieldName];
          if (value !== null && value !== undefined && !isNaN(Number(value))) {
            values.push(Number(value));
          }
        });
      });
    });
    
    return values;
  }
}

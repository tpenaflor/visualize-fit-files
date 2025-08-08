import { FitData, ManufacturerInfo, ActivityType } from '../types';
import { SpeedConverter } from './speed-converter';

export class DataProcessor {
  static processRecords(
    fitData: FitData[], 
    _manufacturerInfo: ManufacturerInfo, 
    activityType: ActivityType
  ): FitData[] {
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
        
        return processedRecord;
      })
    }));
    
    return processedData;
  }

  static extractAvailableMetrics(fitData: FitData[], manufacturerInfo: ManufacturerInfo, _activityType: ActivityType): string[] {
    const fieldMappings = manufacturerInfo.fieldMappings;
    const availableFields = new Set<string>();
    
    // Collect all available fields from the data
    fitData.forEach(data => {
      data.records.forEach(record => {
        Object.keys(record).forEach(key => {
          if (record[key] !== null && record[key] !== undefined) {
            availableFields.add(key);
          }
        });
      });
    });
    
    console.log('Available fields in data:', Array.from(availableFields));
    console.log('Manufacturer field mappings:', fieldMappings);
    
    // Only include metrics that have actual data
    const availableMetrics = new Set<string>();
    
    Object.entries(fieldMappings).forEach(([displayName, possibleFields]) => {
      const hasDataForAnyField = possibleFields.some(field => {
        const hasField = availableFields.has(field);
        if (hasField) {
          // Check if any record actually has meaningful values for this field
          let hasValidData = false;
          let nonZeroCount = 0;
          let totalCount = 0;
          
          fitData.forEach(data => {
            data.records.forEach(record => {
              if (record[field] !== null && record[field] !== undefined) {
                totalCount++;
                if (record[field] !== 0) {
                  nonZeroCount++;
                  hasValidData = true;
                }
              }
            });
          });
          
          // Include metric if:
          // 1. Has any non-zero values, OR
          // 2. Has consistent zero values (might be valid for some metrics)
          const shouldInclude = hasValidData || (totalCount > 0 && totalCount > 100); // At least 100 data points
          console.log(`Field ${field}: hasValidData=${hasValidData}, nonZeroCount=${nonZeroCount}, totalCount=${totalCount}, shouldInclude=${shouldInclude}`);
          return shouldInclude;
        }
        return false;
      });
      
      if (hasDataForAnyField) {
        // Use the display name from the manufacturer field mappings directly
        availableMetrics.add(displayName);
        console.log(`✓ Including metric: ${displayName} (has data)`);
      } else {
        console.log(`✗ Excluding metric: ${displayName} (no data)`);
      }
    });
    
    const result = Array.from(availableMetrics).sort((a, b) => a.localeCompare(b));
    console.log('Final available metrics:', result);
    return result;
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

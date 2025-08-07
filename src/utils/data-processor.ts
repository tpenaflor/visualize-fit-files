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

  static extractAvailableMetrics(fitData: FitData[], manufacturerInfo: ManufacturerInfo, activityType: ActivityType): string[] {
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
          return hasValidData || (totalCount > 0 && totalCount > 100); // At least 100 data points
        }
        return false;
      });
      
      if (hasDataForAnyField) {
        // Use activity-aware display name by checking the first possible field
        const displayNameFromField = this.getDisplayName(possibleFields[0], activityType);
        availableMetrics.add(displayNameFromField);
        console.log(`✓ Including metric: ${displayNameFromField} (has data)`);
      } else {
        console.log(`✗ Excluding metric: ${displayName} (no data)`);
      }
    });
    
    const result = Array.from(availableMetrics).sort((a, b) => a.localeCompare(b));
    console.log('Final available metrics:', result);
    return result;
  }

  static calculateStatistics(fitData: FitData[], selectedMetrics: Set<string>, activityType: ActivityType): { [key: string]: any } {
    const stats: { [key: string]: any } = {};
    
    selectedMetrics.forEach(metric => {
      const values: number[] = [];
      
      fitData.forEach(data => {
        data.records.forEach(record => {
          Object.keys(record).forEach(key => {
            const displayName = DataProcessor.getDisplayName(key, activityType);
            if (displayName === metric && record[key] !== null && record[key] !== undefined) {
              const value = Number(record[key]);
              if (!isNaN(value)) {
                values.push(value);
              }
            }
          });
        });
      });
      
      if (values.length > 0) {
        const sorted = values.sort((a, b) => a - b);
        stats[metric] = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((sum, val) => sum + val, 0) / values.length,
          median: sorted[Math.floor(sorted.length / 2)],
          count: values.length
        };
      }
    });
    
    return stats;
  }

  private static getDisplayName(fieldName: string, activityType: ActivityType): string {
    const displayNames: { [key: string]: string } = {
      'heart_rate': 'Heart Rate',
      'hr': 'Heart Rate',
      'speed': SpeedConverter.getSpeedLabel(activityType),
      'enhanced_speed': SpeedConverter.getSpeedLabel(activityType),
      'cadence': 'Cadence',
      'power': 'Power',
      'distance': 'Distance',
      'altitude': 'Altitude',
      'enhanced_altitude': 'Altitude',
      'temperature': 'Temperature',
      'calories': 'Calories',
      'grade': 'Grade',
      'position_lat': 'Latitude',
      'position_long': 'Longitude'
    };
    
    return displayNames[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}

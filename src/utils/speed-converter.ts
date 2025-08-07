import { ActivityType } from '../types';

export class SpeedConverter {
  /**
   * Convert speed based on activity type
   * Running/Walking: Convert to pace (min/km or min/mile)
   * Cycling: Keep as speed (km/h or mph)
   */
  static convertSpeed(speedMs: number, activityType: ActivityType, useMetric: boolean = true): number {
    if (speedMs <= 0) return 0;
    
    if (activityType === 'running' || activityType === 'walking') {
      // Convert to pace (minutes per distance unit)
      const kmh = speedMs * 3.6;
      const mph = speedMs * 2.237;
      
      if (useMetric) {
        // Minutes per kilometer
        return kmh > 0 ? 60 / kmh : 0;
      } else {
        // Minutes per mile
        return mph > 0 ? 60 / mph : 0;
      }
    } else {
      // Keep as speed for cycling, swimming, etc.
      if (useMetric) {
        return speedMs * 3.6; // km/h
      } else {
        return speedMs * 2.237; // mph
      }
    }
  }

  static getSpeedUnit(activityType: ActivityType, useMetric: boolean = true): string {
    if (activityType === 'running' || activityType === 'walking') {
      return useMetric ? 'min/km' : 'min/mi';
    } else {
      return useMetric ? 'km/h' : 'mph';
    }
  }

  static getSpeedLabel(activityType: ActivityType): string {
    if (activityType === 'running' || activityType === 'walking') {
      return 'Pace';
    } else {
      return 'Speed';
    }
  }
}

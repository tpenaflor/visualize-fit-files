import { ActivityType } from '../types';

export function getGarminFieldMappings(activityType?: ActivityType): { [key: string]: string[] } {
  // Specific field mappings for running activities
  if (activityType === 'running') {
    return {
      'Stride Length': ['step_length'],
      'Vertical Oscillation': ['vertical_oscillation'],
      'Pace': ['enhanced_speed', 'speed'],
      'Cadence': ['cadence'],
      'Temperature': ['temperature'],
      'Elevation': ['enhanced_altitude', 'altitude'],
      'Power': ['power'],
      'Heart Rate': ['heart_rate', 'hr'],
      'Ground Contact Time': ['stance_time']
    };
  }
  
  // Default mappings for other activities (cycling, etc.)
  return {
    'Power': ['power'],
    'Pace': ['enhanced_speed', 'speed'],
    'Heart Rate': ['heart_rate', 'hr'],
    'Cadence': ['cadence'],
    'Stride Length': ['step_length'],
    'Vertical Oscillation': ['vertical_oscillation'],
    'Temperature': ['temperature'],
    'Ground Contact Time': ['stance_time'],
    'Elevation': ['enhanced_altitude', 'altitude']
  };
}

export function getGarminFieldMappings(): { [key: string]: string[] } {
  return {
    'Power': ['power'],
    'Pace': ['speed', 'enhanced_speed'],
    'Heart Rate': ['heart_rate', 'hr'],
    'Cadence': ['cadence'],
    'Stride Length': ['step_length'],
    'Respiration Rate': ['respiration_rate'],
    'Temperature': ['temperature'],
    'Ground Contact Time': ['stance_time'],
    'Elevation': ['altitude', 'enhanced_altitude']
  };
}

export function getWahooFieldMappings(): { [key: string]: string[] } {
  return {
    'Speed': ['enhanced_speed', 'speed'],
    'Elevation': ['enhanced_altitude', 'altitude'],
    'Heart Rate': ['heart_rate', 'hr'],
    'Cadence': ['cadence'],
    'Power': ['power'],
    'Temperature': ['temperature'],
  // Left/Right Balance removed
    'Pedal Smoothness': ['left_pedal_smoothness', 'right_pedal_smoothness'],
  'Torque Effectiveness': ['left_torque_effectiveness', 'right_torque_effectiveness']
  };
}

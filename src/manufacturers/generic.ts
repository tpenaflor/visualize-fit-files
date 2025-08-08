export function getGenericFieldMappings(): { [key: string]: string[] } {
  return {
    'Heart Rate': ['heart_rate', 'hr'],
    'Speed': ['speed', 'enhanced_speed'],
    'Cadence': ['cadence'],
    'Power': ['power'],
    'Distance': ['distance'],
    'Altitude': ['altitude', 'enhanced_altitude'],
    'Temperature': ['temperature'],
    'Calories': ['calories'],
    'Grade': ['grade'],
    'Position': ['position_lat', 'position_long'],
    'Timestamp': ['timestamp'],
  // Left/Right Balance removed
    'Vertical Oscillation': ['vertical_oscillation'],
    'Stance Time': ['stance_time'],
    'Stance Time Percent': ['stance_time_percent'],
    'Vertical Ratio': ['vertical_ratio'],
    'Step Length': ['step_length'],
    'Stroke Rate': ['total_strokes'],
    'Stroke Type': ['stroke_type'],
    'Training Effect': ['total_training_effect', 'anaerobic_training_effect'],
    'Recovery Time': ['recovery_time'],
    'Training Stress Score': ['training_stress_score'],
    'Power Balance': ['left_power_phase', 'right_power_phase'],
    'Torque Effectiveness': ['left_torque_effectiveness', 'right_torque_effectiveness'],
    'Pedal Smoothness': ['left_pedal_smoothness', 'right_pedal_smoothness'],
    'Platform Center Offset': ['left_platform_center_offset', 'right_platform_center_offset'],
    'Power Phase': ['left_power_phase_start_angle', 'left_power_phase_end_angle', 'right_power_phase_start_angle', 'right_power_phase_end_angle']
  };
}

declare module 'fit-file-parser' {
  interface FitParserOptions {
    force?: boolean;
    speedUnit?: 'mps' | 'kmh' | 'mph';
    lengthUnit?: 'm' | 'km' | 'mi' | 'ft';
    temperatureUnit?: 'celsius' | 'kelvin' | 'fahrenheit';
    elapsedRecordField?: boolean;
    mode?: 'cascade' | 'list' | 'both';
  }

  interface FitRecord {
    timestamp?: Date;
    position_lat?: number;
    position_long?: number;
    distance?: number;
    altitude?: number;
    speed?: number;
    heart_rate?: number;
    cadence?: number;
    power?: number;
    temperature?: number;
    [key: string]: any;
  }

  interface FitLap {
    timestamp?: Date;
    start_time?: Date;
    total_elapsed_time?: number;
    total_timer_time?: number;
    total_distance?: number;
    avg_speed?: number;
    max_speed?: number;
    avg_heart_rate?: number;
    max_heart_rate?: number;
    [key: string]: any;
  }

  interface FitSession {
    timestamp?: Date;
    start_time?: Date;
    sport?: string;
    sub_sport?: string;
    total_elapsed_time?: number;
    total_timer_time?: number;
    total_distance?: number;
    avg_speed?: number;
    max_speed?: number;
    avg_heart_rate?: number;
    max_heart_rate?: number;
    [key: string]: any;
  }

  interface FitEvent {
    timestamp?: Date;
    event?: string;
    event_type?: string;
    data?: number;
    [key: string]: any;
  }

  interface FitActivity {
    timestamp?: Date;
    total_timer_time?: number;
    num_sessions?: number;
    type?: string;
    event?: string;
    [key: string]: any;
  }

  interface FitFileId {
    type?: string;
    manufacturer?: string;
    product?: string;
    serial_number?: number;
    time_created?: Date;
    number?: number;
    [key: string]: any;
  }

  interface ParsedFitData {
    file_id?: FitFileId;
    activity?: FitActivity;
    records?: FitRecord[];
    laps?: FitLap[];
    sessions?: FitSession[];
    events?: FitEvent[];
    hrv?: any[];
    [key: string]: any;
  }

  type ParseCallback = (error: Error | null, data: ParsedFitData) => void;

  class FitParser {
    constructor(options?: FitParserOptions);
    parse(buffer: ArrayBuffer, callback: ParseCallback): void;
  }

  export = FitParser;
}

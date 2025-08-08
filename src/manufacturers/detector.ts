import { ManufacturerInfo, ActivityType } from '../types';
import { getGarminFieldMappings } from './garmin';
import { getWahooFieldMappings } from './wahoo';
import { getGenericFieldMappings } from './generic';

export class ManufacturerDetector {
  static detect(data: any, activityType?: ActivityType): ManufacturerInfo {
    // Try multiple sources for manufacturer information
    let manufacturer = '';
    let productName = '';
    
    // 1. Check file_id first
    const fileId = data.file_id || {};
    if (fileId.manufacturer) {
      manufacturer = (fileId.manufacturer || '').toLowerCase();
      productName = fileId.product || '';
      console.log('Found manufacturer in file_id:', { manufacturer, productName });
    }
    
    // 2. Check device_infos array (main recording device usually has device_index: 0)
    if (!manufacturer && data.device_infos && data.device_infos.length > 0) {
      const mainDevice = data.device_infos.find((device: any) => device.device_index === 0) || 
                         data.device_infos[0];
      if (mainDevice && mainDevice.manufacturer) {
        manufacturer = (mainDevice.manufacturer || '').toLowerCase();
        productName = mainDevice.product_name || '';
        console.log('Found manufacturer in device_infos:', { manufacturer, productName });
      }
    }
    
    // 3. Check devices array as fallback
    if (!manufacturer && data.devices && data.devices.length > 0) {
      const mainDevice = data.devices.find((device: any) => device.device_index === 0) || 
                         data.devices[0];
      if (mainDevice && mainDevice.manufacturer) {
        manufacturer = (mainDevice.manufacturer || '').toLowerCase();
        productName = mainDevice.product_name || '';
        console.log('Found manufacturer in devices:', { manufacturer, productName });
      }
    }
    
    console.log('Final manufacturer detection:', { manufacturer, productName });
    
    // Garmin detection
    if (manufacturer === 'garmin' || manufacturer.includes('garmin') || 
        productName.toLowerCase().includes('garmin')) {
      return {
        name: 'Garmin',
        fieldMappings: getGarminFieldMappings(activityType)
      };
    }
    
    // Wahoo detection  
    if (manufacturer === 'wahoo' || manufacturer.includes('wahoo') || 
        manufacturer === 'wahoo_fitness' || productName.toLowerCase().includes('elemnt') ||
        productName.toLowerCase().includes('kickr')) {
      return {
        name: 'Wahoo',
        fieldMappings: getWahooFieldMappings()
      };
    }
    
    // Default/Unknown manufacturer - use comprehensive field list
    const unknownName = productName ? `Unknown (${productName})` : 'Unknown';
    return {
      name: unknownName,
      fieldMappings: getGenericFieldMappings()
    };
  }
}

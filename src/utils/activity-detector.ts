import { ActivityType } from '../types';

export class ActivityDetector {
  static detect(data: any): ActivityType {
    // Check sessions array (primary source)
    const session = data.sessions?.[0] || {};
    let sport = (session.sport || '').toLowerCase();
    let subSport = (session.sub_sport || '').toLowerCase();
    
    // Fallback to sports array if no session data
    if (!sport && data.sports && data.sports.length > 0) {
      const sportData = data.sports[0];
      sport = (sportData.sport || '').toLowerCase();
      subSport = (sportData.sub_sport || '').toLowerCase();
    }
    
    console.log('Activity detection:', { sport, subSport });
    
    // Running activities
    if (sport === 'running' || sport === 'run' || subSport.includes('running')) {
      return 'running';
    }
    
    // Cycling activities  
    if (sport === 'cycling' || sport === 'bike' || sport === 'biking' ||
        subSport.includes('cycling') || subSport.includes('bike') || 
        subSport === 'road' || subSport === 'indoor_cycling') {
      return 'cycling';
    }
    
    // Swimming activities
    if (sport === 'swimming' || sport === 'swim' || subSport.includes('swimming')) {
      return 'swimming';
    }
    
    // Walking activities
    if (sport === 'walking' || sport === 'walk' || subSport.includes('walking')) {
      return 'walking';
    }
    
    return 'unknown';
  }
}

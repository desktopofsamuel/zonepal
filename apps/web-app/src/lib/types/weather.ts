export interface WeatherData {
  icon: string;
  temperature: number;
  description: string;
  condition: string;
}

export interface WeatherCache {
  [key: string]: {
    data: WeatherData;
    timestamp: number;
  }
} 
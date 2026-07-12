import { useEffect, useState } from 'react';
import type { WeatherData } from '@/lib/types/weather';
import Image from 'next/image';

// Cache weather data in memory
const weatherCache: {
  [key: string]: {
    data: WeatherData;
    timestamp: number;
  }
} = {};

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface WeatherIconProps {
  city: string;
  country: string;
  className?: string;
}

export function WeatherIcon({ city, country, className }: WeatherIconProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      const cacheKey = `${city},${country}`;
      const now = Date.now();

      // Check cache first
      if (weatherCache[cacheKey] && (now - weatherCache[cacheKey].timestamp) < CACHE_DURATION) {
        setWeather(weatherCache[cacheKey].data);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/weather?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch weather data');
        }
        
        const data = await response.json();
        const weatherData: WeatherData = {
          temperature: data.temperature,
          description: data.description || data.condition,
          condition: data.condition,
          icon: data.icon
        };

        // Update cache
        weatherCache[cacheKey] = {
          data: weatherData,
          timestamp: now
        };

        setWeather(weatherData);
      } catch (error) {
        // Silent error handling
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [city, country]);

  if (loading) {
    return (
      <div className={`w-6 h-6 animate-pulse bg-gray-200 rounded-full ${className}`} />
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <div className={`inline-flex items-center gap-1 ${className}`} title={weather.description}>
      <Image 
        src={weather.icon} 
        alt={weather.description}
        width={24}
        height={24}
        className="w-6 h-6"
      />
      <span className="text-sm text-gray-500">{Math.round(weather.temperature)}°C</span>
    </div>
  );
} 
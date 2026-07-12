import { NextResponse } from 'next/server'
import { WeatherData } from '@/lib/types/weather'

// Server-side cache
const weatherCache = new Map<string, { 
  data: WeatherData; 
  timestamp: number;
  updating?: boolean;
}>();

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const REFRESH_THRESHOLD = 23 * 60 * 60 * 1000; // 23 hours - refresh if data is older than this

async function fetchWeatherData(city: string, country: string): Promise<WeatherData> {
  const API_KEY = process.env.WEATHER_API_KEY;
  const response = await fetch(
    `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(city)},${encodeURIComponent(country)}&aqi=no`
  );

  if (!response.ok) {
    throw new Error('Weather API request failed');
  }

  const data = await response.json();
  return {
    icon: data.current.condition.icon.replace('//', 'https://'),
    temperature: data.current.temp_c,
    description: data.current.condition.text,
    condition: data.current.condition.code.toString()
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');
  const country = searchParams.get('country');

  if (!city || !country) {
    return NextResponse.json(
      { error: 'City and country are required' },
      { status: 400 }
    );
  }

  const cacheKey = `${city},${country}`;
  const now = Date.now();
  const cachedData = weatherCache.get(cacheKey);

  // If we have valid cached data
  if (cachedData) {
    // Check if data needs refresh (older than REFRESH_THRESHOLD)
    if (now - cachedData.timestamp > REFRESH_THRESHOLD && !cachedData.updating) {
      // Background refresh
      cachedData.updating = true;
      fetchWeatherData(city, country)
        .then(weatherData => {
          weatherCache.set(cacheKey, {
            data: weatherData,
            timestamp: now
          });
        })
        .catch(error => {
          console.error('Background refresh failed:', error);
        });
    }

    // Return cached data if it's not expired
    if (now - cachedData.timestamp < CACHE_DURATION) {
      return NextResponse.json(cachedData.data);
    }
  }

  try {
    // Fetch new data
    const weatherData = await fetchWeatherData(city, country);

    // Update cache
    weatherCache.set(cacheKey, {
      data: weatherData,
      timestamp: now
    });

    // Clean up old cache entries if cache is too large
    if (weatherCache.size > 1000) {
      // Convert to array for easier filtering
      const entries = Array.from(weatherCache.entries());
      const oldEntries = entries.filter(([, value]) => 
        now - value.timestamp > CACHE_DURATION
      );
      
      oldEntries.forEach(([key]) => weatherCache.delete(key));
    }

    return NextResponse.json(weatherData);
  } catch (error) {
    console.error('Weather API error:', error);
    
    // If fetch fails but we have cached data (even if expired), return it
    if (cachedData) {
      return NextResponse.json(cachedData.data);
    }

    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
} 
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../environments/environment';

// Types matching the backend API schemas
export interface CurrentWeather {
  time: string;
  temperature_2m: number;
  relative_humidity_2m?: number;
  wind_speed_10m: number;
  weather_code: number;
}

export interface HourlyWeather {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  wind_speed_10m: number[];
  weather_code: number[];
}

export interface DailyWeather {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  weather_code: number[];
}

export interface WeatherForecast {
  latitude: number;
  longitude: number;
  elevation?: number;
  timezone: string;
  current: CurrentWeather;
  hourly: HourlyWeather;
  daily: DailyWeather;
}

export interface JobsiteWeatherResponse {
  jobsite_id: number;
  jobsite_name: string;
  address: string;
  forecast: WeatherForecast;
}

// Enhanced class with compatibility properties for existing components
export class WeatherCurrent implements CurrentWeather {
  time: string;
  temperature_2m: number;
  wind_speed_10m: number;
  relative_humidity_2m?: number;
  weather_code: number;
  
  constructor(data: CurrentWeather) {
    this.time = data.time;
    this.temperature_2m = data.temperature_2m;
    this.wind_speed_10m = data.wind_speed_10m;
    this.relative_humidity_2m = data.relative_humidity_2m;
    this.weather_code = data.weather_code;
  }
  
  // Alias properties for compatibility with existing components
  get temperature(): number { return this.temperature_2m; }
  get windSpeed(): number { return this.wind_speed_10m; }
  get humidity(): number { 
    const humidity = this.relative_humidity_2m;
    return humidity || 0; 
  }
  
  // Get weather description based on weather code
  get weatherDescription(): string {
    return getWeatherDescription(this.weather_code);
  }
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  constructor(private http: HttpClient) {}

  /**
   * Get weather forecast for a specific jobsite
   * @param jobsiteId The ID of the jobsite
   * @returns Observable with jobsite weather data
   */
  getJobsiteWeather(jobsiteId: number): Observable<JobsiteWeatherResponse> {
    return this.http.get<JobsiteWeatherResponse>(
      `${environment.baseUrl}/api/weather/${jobsiteId}`
    ).pipe(
      map(data => ({
        ...data,
        forecast: {
          ...data.forecast,
          current: new WeatherCurrent(data.forecast.current)
        }
      }))
    );
  }

  /**
   * Get weather forecast for specific coordinates
   * @param latitude Location latitude
   * @param longitude Location longitude
   * @returns Observable with weather forecast data
   */
  getWeatherForecast(latitude: number, longitude: number): Observable<WeatherForecast> {
    return this.http.get<WeatherForecast>(
      `${environment.baseUrl}/api/weather/coordinates/${latitude}/${longitude}`
    ).pipe(
      map(data => ({
        ...data,
        current: new WeatherCurrent(data.current)
      }))
    );
  }

  /**
   * Get current weather for a specific location
   * @param latitude Location latitude
   * @param longitude Location longitude
   * @returns Observable with current weather data
   */
  getCurrentWeather(latitude: number, longitude: number): Observable<WeatherCurrent> {
    // Use the same endpoint but extract only the current weather
    return this.getWeatherForecast(latitude, longitude).pipe(
      map(forecast => new WeatherCurrent(forecast.current))
    );
  }
}

// Helper function to get weather description from weather code
function getWeatherDescription(code: number): string {
  const weatherCodes: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
  };
  
  return weatherCodes[code] || "Unknown";
} 
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { WeatherService, WeatherForecast, WeatherCurrent } from '../services/weather.service';
import { catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-weather-forecast',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatButtonModule
  ],
  template: `
    <div class="weather-content" [class.expanded]="expanded">
      <!-- Compact View -->
      <div *ngIf="!expanded" class="compact-view">
        <div *ngIf="loading" class="loading-container-compact">
          <mat-spinner diameter="20"></mat-spinner>
        </div>

        <ng-container *ngIf="!loading && !error && currentWeather">
          <div class="compact-weather">
            <div class="compact-emoji">{{ getWeatherEmoji(currentWeather.weather_code) }}</div>
            <div class="compact-temp">{{ currentWeather.temperature_2m }}°C</div>
            <div class="compact-desc" *ngIf="showDescription">{{ currentWeather.weatherDescription }}</div>
            <button mat-icon-button (click)="toggleExpand()" class="expand-button" title="Show detailed forecast">
              <mat-icon>expand_more</mat-icon>
            </button>
          </div>
        </ng-container>

        <div *ngIf="error" class="error-container-compact">
          <mat-icon color="warn">error</mat-icon>
        </div>
      </div>

      <!-- Expanded View -->
      <div *ngIf="expanded" class="expanded-container">
        <div class="title-area">
          <h3>Weather Forecast</h3>
          <div class="title-actions">
            <button mat-icon-button (click)="refreshWeather()" title="Refresh weather data">
              <mat-icon>refresh</mat-icon>
            </button>
            <button mat-icon-button (click)="toggleExpand()" title="Close forecast" class="close-button">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>

        <div *ngIf="loading" class="loading-container">
          <mat-spinner diameter="30"></mat-spinner>
          <p>Loading weather data...</p>
        </div>

        <div *ngIf="error" class="error-container">
          <mat-icon color="warn">error</mat-icon>
          <p>{{ error }}</p>
        </div>

        <ng-container *ngIf="!loading && !error">
          <!-- Current Weather -->
          <div *ngIf="currentWeather" class="current-weather">
            <div class="current-weather-info">
              <div class="current-temp">{{ currentWeather.temperature_2m }}°C</div>
              <div class="current-desc">{{ currentWeather.weatherDescription }}</div>
              <div class="weather-details">
                <div class="detail-item">
                  <mat-icon class="detail-icon">air</mat-icon>
                  <span>{{ currentWeather.wind_speed_10m }} km/h</span>
                </div>
                <div class="detail-item" *ngIf="currentWeather.relative_humidity_2m !== undefined">
                  <mat-icon class="detail-icon">water_drop</mat-icon>
                  <span>{{ currentWeather.relative_humidity_2m }}%</span>
                </div>
              </div>
            </div>
            <div class="current-emoji">{{ getWeatherEmoji(currentWeather.weather_code) }}</div>
          </div>

          <mat-divider *ngIf="weatherForecast"></mat-divider>

          <!-- Hourly Forecast -->
          <div *ngIf="weatherForecast" class="forecast-section">
            <h3 class="forecast-title">Hourly Forecast</h3>
            <div class="forecast-scroll">
              <div *ngFor="let time of weatherForecast.hourly.time | slice:0:24; let i = index" class="forecast-item">
                <div class="forecast-time">{{ formatTime(time) }}</div>
                <div class="forecast-emoji">{{ getWeatherEmoji(weatherForecast.hourly.weather_code[i]) }}</div>
                <div class="forecast-temp">{{ weatherForecast.hourly.temperature_2m[i] }}°C</div>
                <div class="forecast-humidity">
                  <span class="detail-emoji">💧</span>
                  {{ weatherForecast.hourly.relative_humidity_2m[i] }}%
                </div>
                <div class="forecast-wind">
                  <span class="detail-emoji">💨</span>
                  {{ weatherForecast.hourly.wind_speed_10m[i] }} km/h
                </div>
              </div>
            </div>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .weather-content {
      width: 100%;
      transition: all 0.3s ease;
      position: relative;
    }

    .weather-content.expanded {
      width: 100%;
      min-width: 100%;
      transition: all 0.3s ease;
    }

    .expanded-container {
      position: absolute;
      top: 100%;
      right: 0;
      z-index: 1000;
      width: 300px;
      max-width: 90vw;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      margin-top: 8px;
      overflow: hidden;
    }

    /* Compact View Styles */
    .compact-view {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .compact-weather {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px;
    }

    .compact-emoji {
      font-size: 1.5rem;
    }

    .compact-temp {
      font-size: 15px;
      font-weight: 400;
    }

    .compact-desc {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.7);
      margin-left: 2px;
      max-width: 80px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .expand-button {
      margin-left: auto;
      width: 24px;
      height: 24px;
      line-height: 24px;
    }

    .expand-button .mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      line-height: 18px;
    }

    .loading-container-compact {
      display: flex;
      justify-content: center;
      padding: 4px;
    }

    .error-container-compact {
      display: flex;
      justify-content: center;
      color: #f44336;
      padding: 4px;
    }

    /* Expanded View Styles */
    .title-area {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid #eee;
    }

    .title-area h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
      color: #333;
    }

    .title-actions {
      display: flex;
      gap: 4px;
    }

    .close-button {
      color: rgba(0, 0, 0, 0.6);
    }

    .close-button:hover {
      color: rgba(0, 0, 0, 0.9);
    }

    .loading-container, .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px;
      text-align: center;
      font-size: 0.9rem;
    }

    .error-container {
      color: #f44336;
    }

    .current-weather {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: rgba(0, 0, 0, 0.02);
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .current-weather-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .current-temp {
      font-size: 32px;
      font-weight: 500;
      color: #333;
    }

    .current-desc {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.7);
    }

    .current-emoji {
      font-size: 48px;
      line-height: 1;
    }

    .weather-details {
      display: flex;
      gap: 12px;
      margin-top: 8px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: rgba(0, 0, 0, 0.7);
    }

    .detail-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
      color: rgba(0, 0, 0, 0.6);
    }

    .forecast-section {
      padding: 0 16px 16px;
    }

    .forecast-title {
      font-size: 16px;
      font-weight: 500;
      color: #333;
      margin: 0 0 12px 0;
      padding-left: 8px;
      border-left: 3px solid #3f51b5;
    }

    .forecast-scroll {
      display: flex;
      overflow-x: auto;
      gap: 8px;
      padding-bottom: 8px;
      scrollbar-width: thin;
      scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
    }

    .forecast-scroll::-webkit-scrollbar {
      height: 6px;
    }

    .forecast-scroll::-webkit-scrollbar-thumb {
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 3px;
    }

    .forecast-scroll::-webkit-scrollbar-track {
      background-color: transparent;
    }

    .forecast-item {
      min-width: 60px;
      width: calc(25% - 6px);
      flex-shrink: 0;
      padding: 8px;
      border-radius: 6px;
      background-color: rgba(0, 0, 0, 0.03);
      text-align: center;
      transition: background-color 0.2s;
    }

    .forecast-item:hover {
      background-color: rgba(0, 0, 0, 0.06);
    }

    .forecast-time {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.7);
      margin-bottom: 4px;
    }

    .forecast-emoji {
      font-size: 24px;
      margin: 4px 0;
    }

    .forecast-temp {
      font-size: 15px;
      font-weight: 500;
      color: #333;
    }

    .forecast-humidity, .forecast-wind {
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      gap: 2px;
    }

    mat-divider {
      margin: 12px 0;
    }

    /* Responsive adjustments */
    @media (max-width: 400px) {
      .forecast-item {
        width: calc(33.333% - 8px);
      }

      .expanded-container {
        width: 300px;
      }
    }
  `]
})
export class WeatherForecastComponent implements OnInit, OnChanges {
  @Input() latitude?: number;
  @Input() longitude?: number;
  @Input() compact: boolean = true; // Default to compact mode
  @Input() showDescription: boolean = false; // Control whether to show the description in compact mode

  currentWeather?: WeatherCurrent;
  weatherForecast?: WeatherForecast;
  loading = false;
  error?: string;
  expanded = false; // Track expanded/collapsed state

  constructor(private weatherService: WeatherService) {}

  ngOnInit(): void {
    this.expanded = !this.compact; // Initialize expanded state based on compact input
    this.loadWeatherData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reload weather data when latitude or longitude changes
    if ((changes['latitude'] && !changes['latitude'].firstChange) ||
        (changes['longitude'] && !changes['longitude'].firstChange)) {
      this.loadWeatherData();
    }

    // Update expanded state if compact input changes
    if (changes['compact'] && !changes['compact'].firstChange) {
      this.expanded = !this.compact;
    }
  }

  toggleExpand(): void {
    this.expanded = !this.expanded;
  }

  refreshWeather(): void {
    this.loadWeatherData();
  }

  /**
   * Get appropriate weather emoji based on weather code
   */
  getWeatherEmoji(code: number): string {
    // Map weather codes to emojis
    const weatherEmojis: {[key: number]: string} = {
      0: "☀️", // Clear sky
      1: "🌤️", // Mainly clear
      2: "⛅", // Partly cloudy
      3: "☁️", // Overcast
      45: "🌫️", // Fog
      48: "🌫️", // Depositing rime fog
      51: "🌦️", // Light drizzle
      53: "🌦️", // Moderate drizzle
      55: "🌧️", // Dense drizzle
      56: "🌨️", // Light freezing drizzle
      57: "🌨️", // Dense freezing drizzle
      61: "🌧️", // Slight rain
      63: "🌧️", // Moderate rain
      65: "🌧️", // Heavy rain
      66: "🌨️", // Light freezing rain
      67: "🌨️", // Heavy freezing rain
      71: "❄️", // Slight snow fall
      73: "❄️", // Moderate snow fall
      75: "❄️", // Heavy snow fall
      77: "❄️", // Snow grains
      80: "🌦️", // Slight rain showers
      81: "🌧️", // Moderate rain showers
      82: "⛈️", // Violent rain showers
      85: "🌨️", // Slight snow showers
      86: "🌨️", // Heavy snow showers
      95: "⛈️", // Thunderstorm
      96: "⛈️", // Thunderstorm with slight hail
      99: "⛈️", // Thunderstorm with heavy hail
    };

    return weatherEmojis[code] || "🌡️"; // Default emoji if code not found
  }

  private loadWeatherData(): void {
    if (!this.latitude || !this.longitude) {
      this.error = 'Location coordinates are required to fetch weather data.';
      return;
    }

    this.loading = true;
    this.error = undefined;

    // Load weather forecast
    this.weatherService.getWeatherForecast(this.latitude, this.longitude)
      .pipe(
        catchError(error => {
          console.error('Error fetching weather forecast:', error);
          this.error = 'Failed to load weather data. Please try again later.';
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(data => {
        if (data) {
          this.weatherForecast = data;
          // Convert to WeatherCurrent type
          this.currentWeather = data.current instanceof WeatherCurrent
            ? data.current
            : new WeatherCurrent(data.current);
        }
      });
  }

  formatTime(time: string): string {
    const date = new Date(time);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

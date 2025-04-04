import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { DiaryEntryResponse, PhotoResponse } from '../../api/api';

@Component({
  selector: 'app-view-diary-entry-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],
  template: `
    <div class="mat-mdc-dialog-content">
      <h2 mat-dialog-title>Diary Entry Details</h2>
      <mat-dialog-content>
        <div class="entry-details">
          <div class="detail-group">
            <h3>Date & Time</h3>
            <p>{{entry.date | date:'MMM d, y h:mm a'}}</p>
          </div>

          <div class="detail-group" *ngIf="entry.weather">
            <h3>Weather Conditions</h3>
            <p>{{formatWeather(entry.weather)}}</p>
          </div>

          <div class="detail-group">
            <h3>Work Completed</h3>
            <p>{{entry.work_completed}}</p>
          </div>

          <div class="detail-group" *ngIf="entry.delays">
            <h3>Delays</h3>
            <p>{{entry.delays}}</p>
          </div>

          <div class="detail-group" *ngIf="entry.notes">
            <h3>Notes</h3>
            <p>{{entry.notes}}</p>
          </div>

          <div class="detail-group" *ngIf="entry.safety_issues">
            <h3>Safety Issues</h3>
            <p>{{entry.safety_issues}}</p>
          </div>

          <div class="detail-group" *ngIf="photos?.length">
            <h3>Photos</h3>
            <div class="photos-grid">
              <div class="photo-item" *ngFor="let photo of photos">
                <img [src]="photo.blobUrl" [alt]="'Site photo ' + photo.id" class="photo-image">
              </div>
            </div>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onClose()">Close</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .mat-mdc-dialog-content {
      padding: 20px;
      max-width: 800px;
    }

    .entry-details {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .detail-group {
      h3 {
        color: var(--mat-primary-text-color);
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 500;
      }

      p {
        margin: 0;
        white-space: pre-line;
        line-height: 1.5;
      }
    }

    .photos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 8px;
    }

    .photo-item {
      aspect-ratio: 1;
      border-radius: 8px;
      overflow: hidden;
      background: var(--mat-card-background-color);
    }

    .photo-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    @media (max-width: 600px) {
      .photos-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      }
    }
  `]
})
export class ViewDiaryEntryDialogComponent {
  entry: DiaryEntryResponse;
  photos: (PhotoResponse & { blobUrl?: string })[];

  constructor(
    private dialogRef: MatDialogRef<ViewDiaryEntryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: { 
      entry: DiaryEntryResponse,
      photos: (PhotoResponse & { blobUrl?: string })[]
    }
  ) {
    this.entry = data.entry;
    this.photos = data.photos;
  }

  formatWeather(weather: any): string {
    if (!weather) return 'Not recorded';
    
    const parts = [];
    if (weather.conditions) parts.push(weather.conditions);
    if (weather.temperature) parts.push(`${weather.temperature}°C`);
    if (weather.wind_speed) parts.push(`Wind: ${weather.wind_speed}km/h`);
    if (weather.humidity) parts.push(`Humidity: ${weather.humidity}%`);
    
    return parts.length > 0 ? parts.join(', ') : 'Not recorded';
  }

  onClose(): void {
    this.dialogRef.close();
  }
} 
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StatusService } from '../../services/status.service';
import { WeatherService } from '../../services/weather.service';
import { finalize, switchMap, catchError, EMPTY } from 'rxjs';
import { Client, DiaryEntryCreate, ApiException, PhotoResponse } from '../../api/api';
import { DiaryPhotoUploadComponent } from './diary-photo-upload.component';

@Component({
  selector: 'app-create-diary-entry-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    DiaryPhotoUploadComponent
  ],
  providers: [FormBuilder],
  template: `
    <div class="mat-mdc-dialog-content">
      <h2 mat-dialog-title>Create Diary Entry</h2>
      
      <form [formGroup]="diaryForm">
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Entry Date & Time</mat-label>
          <input matInput [value]="entryDate | date:'medium'" readonly>
          <mat-hint>This is when the entry will be recorded</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Work Completed</mat-label>
          <textarea matInput formControlName="work_completed" required></textarea>
          <mat-error *ngIf="diaryForm.get('work_completed')?.hasError('required')">
            Work completed is required
          </mat-error>
        </mat-form-field>

        <!-- Weather fields commented out for now
        <div formGroupName="weather" class="weather-group">
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Temperature (°C)</mat-label>
            <input matInput type="number" formControlName="temperature">
          </mat-form-field>

          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Weather Conditions</mat-label>
            <input matInput formControlName="conditions">
          </mat-form-field>
        </div>

        <div formGroupName="weather" class="weather-group">
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Wind Speed (km/h)</mat-label>
            <input matInput type="number" formControlName="wind_speed">
          </mat-form-field>

          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Humidity (%)</mat-label>
            <input matInput type="number" formControlName="humidity">
          </mat-form-field>
        </div>
        -->

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Delays</mat-label>
          <textarea matInput formControlName="delays"></textarea>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes"></textarea>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Safety Issues</mat-label>
          <textarea matInput formControlName="safety_issues"></textarea>
        </mat-form-field>

        <app-diary-photo-upload
          [entryId]="createdEntryId"
          (photosChanged)="onPhotosChanged($event)"
          (photosPending)="onPhotosPending($event)">
        </app-diary-photo-upload>

        <div *ngIf="error" class="error-message">
          {{ error }}
        </div>
      </form>
    </div>

    <div mat-dialog-actions>
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" 
              (click)="onSave()" 
              [disabled]="!diaryForm.valid">Save</button>
    </div>
  `,
  styles: [`
    .mat-mdc-dialog-content {
      padding: 20px;
      min-width: 400px;
    }
    .full-width {
      width: 100%;
      margin-bottom: 15px;
    }
    .error-message {
      color: red;
      margin-top: 10px;
    }
    .weather-group {
      display: flex;
      gap: 16px;
    }
    .weather-group .full-width {
      flex: 1;
    }
  `]
})
export class CreateDiaryEntryDialogComponent implements OnInit {
  diaryForm: FormGroup;
  error?: string;
  photos: PhotoResponse[] = [];
  entryDate: Date = new Date();
  createdEntryId?: number;
  pendingPhotos: File[] = [];

  constructor(
    private dialogRef: MatDialogRef<CreateDiaryEntryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { siteId: number },
    private client: Client,
    private statusService: StatusService,
    private weatherService: WeatherService,
    private fb: FormBuilder
  ) {
    this.diaryForm = this.fb.group({
      work_completed: ['', Validators.required],
      weather: this.fb.group({
        temperature: [null],
        conditions: [''],
        wind_speed: [null],
        humidity: [null]
      }), // Weather group kept in form but fields commented out in UI
      delays: [''],
      notes: [''],
      safety_issues: ['']
    });
  }

  ngOnInit() {
    // Comment out weather data loading
    // this.loadWeatherData();
  }

  // Weather-related methods kept but not used
  private loadWeatherData() {
    this.statusService.showLoading();
    
    // Get the jobsite data to get the coordinates
    this.client.get_jobsite_api_jobsites__jobsite_id__get(this.data.siteId)
      .pipe(
        switchMap(jobsite => {
          // Extract coordinates from jobsite
          const latitude = this.getLatitudeAsNumber(jobsite.latitude);
          const longitude = this.getLongitudeAsNumber(jobsite.longitude);
          
          if (latitude === null || longitude === null) {
            throw new Error('Jobsite location coordinates not available');
          }
          
          // Call weather service with the coordinates
          return this.weatherService.getCurrentWeather(latitude, longitude);
        }),
        finalize(() => this.statusService.hideLoading()),
        catchError(error => {
          console.error('Error loading weather data:', error);
          this.statusService.showMessage('Could not load weather data');
          return EMPTY;
        })
      )
      .subscribe({
        next: (weather) => {
          if (weather) {
            const weatherForm = this.diaryForm.get('weather');
            if (weatherForm) {
              weatherForm.patchValue({
                temperature: weather.temperature,
                wind_speed: weather.windSpeed,
                humidity: weather.humidity,
                conditions: this.getWeatherCondition(weather)
              });
            }
          }
        },
        error: (error) => {
          console.error('Error loading weather data:', error);
        }
      });
  }
  
  // Helper methods to convert latitude and longitude to numbers
  private getLatitudeAsNumber(latitude: any): number | null {
    if (latitude === undefined || latitude === null) return null;
    return typeof latitude === 'number' ? latitude : Number(latitude);
  }

  private getLongitudeAsNumber(longitude: any): number | null {
    if (longitude === undefined || longitude === null) return null;
    return typeof longitude === 'number' ? longitude : Number(longitude);
  }

  private getWeatherCondition(weather: { temperature: number, windSpeed: number, humidity: number }): string {
    // Basic weather condition determination based on temperature and humidity
    if (weather.humidity > 90) return 'Rainy';
    if (weather.humidity > 80) return 'Cloudy';
    if (weather.temperature > 30) return 'Hot';
    if (weather.temperature < 10) return 'Cold';
    return 'Fair';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (!this.diaryForm.valid) return;

    this.statusService.showLoading();

    const formValue = this.diaryForm.value;
    
    // Only include weather if any weather field is provided
    const weather = formValue.weather.temperature || 
                   formValue.weather.conditions || 
                   formValue.weather.wind_speed || 
                   formValue.weather.humidity
      ? formValue.weather
      : undefined;

    const request = new DiaryEntryCreate({
      site_id: this.data.siteId,
      date: this.entryDate,
      work_completed: formValue.work_completed,
      weather: weather,
      delays: formValue.delays || undefined,
      notes: formValue.notes || undefined,
      safety_issues: formValue.safety_issues || undefined
    });

    this.client.create_diary_entry_api_diary_post(request)
      .pipe(finalize(() => {
        // Only hide loading if we don't have pending photos
        if (this.pendingPhotos.length === 0) {
          this.statusService.hideLoading();
        }
      }))
      .subscribe({
        next: (entry) => {
          this.createdEntryId = entry.id;
          
          // If we have pending photos, trigger their upload
          if (this.pendingPhotos.length > 0) {
            // The photo upload component will handle these automatically
            // once it receives the entryId
          } else {
            // No photos to upload, close immediately
            this.dialogRef.close(entry);
            this.statusService.showMessage('Diary entry created successfully');
            this.statusService.hideLoading();
          }
        },
        error: (error: ApiException) => {
          console.error('Error creating diary entry:', error);
          if (error.response) {
            try {
              const errorDetail = JSON.parse(error.response);
              this.error = errorDetail.detail;
              this.statusService.showMessage(errorDetail.detail);
            } catch {
              this.error = 'Failed to create diary entry';
              this.statusService.showMessage('Failed to create diary entry');
            }
          } else {
            this.error = 'Failed to create diary entry';
            this.statusService.showMessage('Failed to create diary entry');
          }
          this.statusService.hideLoading();
        }
      });
  }

  onPhotosChanged(photos: PhotoResponse[]): void {
    this.photos = photos;
    // If we have a created entry and all photos are uploaded, close the dialog
    if (this.createdEntryId && this.pendingPhotos.length === photos.length) {
      this.dialogRef.close({ id: this.createdEntryId, photos });
      this.statusService.showMessage('Diary entry created successfully');
      this.statusService.hideLoading();
    }
  }

  onPhotosPending(files: File[]): void {
    this.pendingPhotos = files;
  }
}

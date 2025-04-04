import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Client, DiaryEntryResponse, DiaryEntryUpdate, PhotoResponse } from '../../api/api';
import { StatusService } from '../../services/status.service';
import { finalize } from 'rxjs';
import { DiaryPhotoUploadComponent } from './diary-photo-upload.component';

@Component({
  selector: 'app-edit-diary-entry-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    DiaryPhotoUploadComponent
  ],
  providers: [FormBuilder],
  template: `
    <div class="mat-mdc-dialog-content">
      <h2 mat-dialog-title>Edit Diary Entry</h2>
      <mat-dialog-content>
        <form [formGroup]="diaryForm">
          <mat-form-field appearance="outline" class="mat-mdc-form-field full-width">
            <mat-label>Work Completed</mat-label>
            <textarea
              matInput
              formControlName="work_completed"
              required
              rows="3"
            ></textarea>
          </mat-form-field>

          <!-- Weather fields commented out for now
          <div formGroupName="weather" class="weather-group">
            <mat-form-field appearance="outline" class="mat-mdc-form-field full-width">
              <mat-label>Temperature (°C)</mat-label>
              <input matInput type="number" formControlName="temperature">
            </mat-form-field>

            <mat-form-field appearance="outline" class="mat-mdc-form-field full-width">
              <mat-label>Weather Conditions</mat-label>
              <input matInput formControlName="conditions">
            </mat-form-field>
          </div>

          <div formGroupName="weather" class="weather-group">
            <mat-form-field appearance="outline" class="mat-mdc-form-field full-width">
              <mat-label>Wind Speed (km/h)</mat-label>
              <input matInput type="number" formControlName="wind_speed">
            </mat-form-field>

            <mat-form-field appearance="outline" class="mat-mdc-form-field full-width">
              <mat-label>Humidity (%)</mat-label>
              <input matInput type="number" formControlName="humidity">
            </mat-form-field>
          </div>
          -->

          <mat-form-field appearance="outline" class="mat-mdc-form-field full-width">
            <mat-label>Notes</mat-label>
            <textarea
              matInput
              formControlName="notes"
              rows="3"
            ></textarea>
          </mat-form-field>

          <app-diary-photo-upload
            [entryId]="entry.id"
            [existingPhotos]="existingPhotos"
            (photosChanged)="onPhotosChanged($event)"
          ></app-diary-photo-upload>

          <div *ngIf="error" class="error-message">
            {{error}}
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button
          mat-raised-button
          color="primary"
          [disabled]="!diaryForm.valid"
          (click)="onSave()"
        >
          Save Changes
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    mat-dialog-content {
      min-width: 400px;
    }
    .error-message {
      color: var(--mat-red-500);
      margin-top: 8px;
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
export class EditDiaryEntryDialogComponent implements OnInit {
  entry: DiaryEntryResponse;
  diaryForm: FormGroup;
  error?: string;
  existingPhotos: PhotoResponse[] = [];

  constructor(
    private dialogRef: MatDialogRef<EditDiaryEntryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: { entry: DiaryEntryResponse },
    private client: Client,
    private statusService: StatusService,
    private fb: FormBuilder
  ) {
    this.entry = Object.create(
      Object.getPrototypeOf(data.entry),
      Object.getOwnPropertyDescriptors(data.entry)
    );

    // Initialize form with existing data
    this.diaryForm = this.fb.group({
      work_completed: [this.entry.work_completed],
      weather: this.fb.group({
        temperature: [this.entry.weather?.['temperature'] || null],
        conditions: [this.entry.weather?.['conditions'] || ''],
        wind_speed: [this.entry.weather?.['wind_speed'] || null],
        humidity: [this.entry.weather?.['humidity'] || null]
      }), // Weather group kept in form but fields commented out in UI
      notes: [this.entry.notes || '']
    });
  }

  ngOnInit() {
    this.loadExistingPhotos();
  }

  loadExistingPhotos() {
    if (!this.entry.id) return;

    this.statusService.showLoading();
    this.client.get_photos_for_entry_api_photos_entry__entry_id__get(this.entry.id)
      .pipe(finalize(() => this.statusService.hideLoading()))
      .subscribe({
        next: (photos) => {
          this.existingPhotos = photos;
        },
        error: (error) => {
          console.error('Error loading photos:', error);
          this.error = 'Failed to load existing photos';
          this.statusService.showMessage('Failed to load existing photos');
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (!this.entry.id || !this.diaryForm.valid) return;

    this.statusService.showLoading();
    
    const formValue = this.diaryForm.value;
    
    // Only include weather if any weather field is provided
    const weather = formValue.weather.temperature || 
                   formValue.weather.conditions || 
                   formValue.weather.wind_speed || 
                   formValue.weather.humidity
      ? formValue.weather
      : undefined;

    const updateData = new DiaryEntryUpdate({
      work_completed: formValue.work_completed,
      weather: weather,
      notes: formValue.notes || undefined
    });

    this.client.update_diary_entry_api_diary__entry_id__patch(
      this.entry.id,
      updateData
    )
    .pipe(finalize(() => this.statusService.hideLoading()))
    .subscribe({
      next: (updatedEntry) => {
        this.dialogRef.close(updatedEntry);
        this.statusService.showMessage('Diary entry updated successfully');
      },
      error: (error) => {
        console.error('Error updating diary entry:', error);
        this.error = 'Failed to update diary entry';
        this.statusService.showMessage('Failed to update diary entry');
      }
    });
  }

  onPhotosChanged(photos: PhotoResponse[]): void {
    this.existingPhotos = photos;
  }
} 
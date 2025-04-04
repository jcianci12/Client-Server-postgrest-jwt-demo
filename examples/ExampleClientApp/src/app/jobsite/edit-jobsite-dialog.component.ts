import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { StatusService } from '../services/status.service';
import { finalize } from 'rxjs';
import { JobsiteCreate, JobsiteResponse, JobsiteStatus, JobsiteUpdate, Client } from '../api/api';
import { MapPickerComponent, MapLocation } from '../shared/map-picker.component';

@Component({
  selector: 'app-edit-jobsite-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    FormsModule,
    MapPickerComponent
  ],
  template: `
    <div class="mat-mdc-dialog-content">
      <h2 mat-dialog-title>{{isEdit ? 'Edit' : 'Add'}} Jobsite</h2>
      <mat-dialog-content>
        <form #jobsiteForm="ngForm">
          <mat-form-field appearance="outline" class="mat-mdc-form-field full-width">
            <mat-label>Name</mat-label>
            <input matInput [(ngModel)]="name" name="name" required
                   placeholder="Site Name">
          </mat-form-field>

          <mat-form-field appearance="outline" class="mat-mdc-form-field full-width">
            <mat-label>Address</mat-label>
            <textarea matInput [(ngModel)]="address" name="address" required
                      placeholder="Site Address"></textarea>
          </mat-form-field>

          <mat-form-field appearance="outline" class="mat-mdc-form-field full-width">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="status" name="status" required>
              <mat-option [value]="JobsiteStatus.Active">Active</mat-option>
              <mat-option [value]="JobsiteStatus.Inactive">Inactive</mat-option>
              <mat-option [value]="JobsiteStatus.Completed">Completed</mat-option>
            </mat-select>
          </mat-form-field>
          
          <div class="map-section">
            <h3>Set Jobsite Location</h3>
            <p class="map-instructions">Drag the marker or click on the map to set the jobsite location.</p>
            <app-map-picker 
              [initialLocation]="initialLocation" 
              (locationSelected)="onLocationSelected($event)">
            </app-map-picker>
          </div>
        </form>
        <div *ngIf="error" class="error-message">
          {{error}}
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="cancel()">Cancel</button>
        <button mat-raised-button
                color="primary"
                (click)="save()"
                [disabled]="!jobsiteForm.form.valid || !hasLocation">
          Save
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    :host ::ng-deep .mat-mdc-form-field {
      width: 100%;
      margin-bottom: 16px;
    }
    .error-message {
      color: red;
      margin-top: 8px;
    }
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    .map-section {
      margin-top: 16px;
      margin-bottom: 16px;
    }
    .map-instructions {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 8px;
    }
  `]
})
export class EditJobsiteDialogComponent {
  name: string = '';
  address: string = '';
  status: JobsiteStatus = JobsiteStatus.Active;
  error?: string;
  JobsiteStatus = JobsiteStatus;
  hasLocation = false;
  initialLocation?: MapLocation;
  
  // These properties will be sent to the backend when it's ready
  private latitude?: number;
  private longitude?: number;
  
  get isEdit(): boolean {
    return !!this.data.jobsite;
  }

  constructor(
    private dialogRef: MatDialogRef<EditJobsiteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { jobsite?: JobsiteResponse, companyId: number },
    private statusService: StatusService,
    private client: Client
  ) {
    if (data.jobsite) {
      this.name = data.jobsite.name;
      this.address = data.jobsite.address;
      this.status = data.jobsite.status;
      
      // Check if the jobsite has latitude and longitude
      if (data.jobsite.latitude && data.jobsite.longitude) {
        this.initialLocation = {
          latitude: typeof data.jobsite.latitude === 'number' ? 
            data.jobsite.latitude : 
            (data.jobsite.latitude as any).value || 51.505,
          longitude: typeof data.jobsite.longitude === 'number' ? 
            data.jobsite.longitude : 
            (data.jobsite.longitude as any).value || -0.09
        };
        this.latitude = this.initialLocation.latitude;
        this.longitude = this.initialLocation.longitude;
        this.hasLocation = true;
      } else {
        // Default location if none is set
        this.initialLocation = {
          latitude: 51.505,
          longitude: -0.09
        };
        this.latitude = this.initialLocation.latitude;
        this.longitude = this.initialLocation.longitude;
        this.hasLocation = true;
      }
    }
  }
  
  onLocationSelected(location: MapLocation): void {
    this.latitude = location.latitude;
    this.longitude = location.longitude;
    this.hasLocation = true;
  }

  save() {
    if (!this.name || !this.address || !this.status) return;
    if (!this.hasLocation) {
      this.error = 'Please set a location for the jobsite.';
      return;
    }

    this.statusService.showLoading();

    if (this.isEdit && this.data.jobsite) {
      // Create a plain object with the correct structure for the API
      const requestData = {
        name: this.name,
        address: this.address,
        status: this.status
      } as any;
      
      // Add latitude and longitude directly
      if (this.latitude !== undefined && this.longitude !== undefined) {
        requestData.latitude = this.latitude;
        requestData.longitude = this.longitude;
      }

      this.client.update_jobsite_api_jobsites__jobsite_id__put(this.data.jobsite.id, requestData).subscribe({
        next: (jobsite: JobsiteResponse) => {
          this.dialogRef.close(jobsite);
          this.statusService.hideLoading();
          this.statusService.showMessage('Jobsite updated successfully');
        },
        error: (error: any) => {
          console.error('Error updating jobsite:', error);
          if (error.error && error.error.detail) {
            this.error = 'Validation error: ' + JSON.stringify(error.error.detail);
          } else {
            this.error = 'Failed to update jobsite';
          }
          this.statusService.hideLoading();
          this.statusService.showMessage('Failed to update jobsite');
        }
      });
    } else {
      // Create a plain object with the correct structure for the API
      const requestData = {
        name: this.name,
        address: this.address,
        status: this.status,
        company_id: this.data.companyId
      } as any;
      
      // Add latitude and longitude directly
      if (this.latitude !== undefined && this.longitude !== undefined) {
        requestData.latitude = this.latitude;
        requestData.longitude = this.longitude;
      }

      this.client.create_jobsite_api_jobsites__post(requestData).subscribe({
        next: (jobsite: JobsiteResponse) => {
          this.dialogRef.close(jobsite);
          this.statusService.hideLoading();
          this.statusService.showMessage('Jobsite created successfully');
        },
        error: (error: any) => {
          console.error('Error creating jobsite:', error);
          if (error.error && error.error.detail) {
            this.error = 'Validation error: ' + JSON.stringify(error.error.detail);
          } else {
            this.error = 'Failed to create jobsite';
          }
          this.statusService.hideLoading();
          this.statusService.showMessage('Failed to create jobsite');
        }
      });
    }
  }

  cancel() {
    this.dialogRef.close();
  }
} 
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { UIStateService } from '../services/ui-state.service';
import { finalize, take } from 'rxjs';
import { JobsiteCreate, JobsiteResponse, JobsiteStatus } from '../api/api';
import { Client } from '../api/api';
import { UserStateService } from '../services/user-state.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MapPickerComponent, MapLocation } from '../shared/map-picker.component';

@Component({
  selector: 'app-create-jobsite-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule,
    FormsModule,
    MapPickerComponent
  ],
  template: `
    <h2 mat-dialog-title>Create New Jobsite</h2>
    <mat-dialog-content>
      <form #createForm="ngForm">
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput [(ngModel)]="jobsite.name" name="name" required
                 placeholder="Site Name">
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Address</mat-label>
          <input matInput [(ngModel)]="jobsite.address" name="address" required
                 placeholder="Site Address">
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="jobsite.status" name="status" required>
            <mat-option [value]="Status.Active">Active</mat-option>
            <mat-option [value]="Status.Inactive">Inactive</mat-option>
            <mat-option [value]="Status.Completed">Completed</mat-option>
          </mat-select>
        </mat-form-field>
        
        <div class="map-section">
          <h3>Set Jobsite Location</h3>
          <p class="map-instructions">Drag the marker or click on the map to set the jobsite location.</p>
          <app-map-picker (locationSelected)="onLocationSelected($event)"></app-map-picker>
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
              (click)="create()"
              [disabled]="!createForm.form.valid || !hasLocation">
        Create
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    .error-message {
      color: red;
      margin-top: 8px;
    }
    .map-section {
      margin-top: 16px;
    }
    .map-instructions {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 8px;
    }
  `]
})
export class CreateJobsiteDialogComponent {
  jobsite: JobsiteCreate = new JobsiteCreate();
  error?: string;
  Status = JobsiteStatus; // Make enum available to template
  hasLocation = false;
  
  // These properties will be sent to the backend when it's ready
  private latitude?: number;
  private longitude?: number;

  constructor(
    private dialogRef: MatDialogRef<CreateJobsiteDialogComponent>,
    private uiStateService: UIStateService,
    private client: Client,
    private userStateService: UserStateService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  cancel() {
    this.dialogRef.close();
  }
  
  onLocationSelected(location: MapLocation): void {
    this.latitude = location.latitude;
    this.longitude = location.longitude;
    this.hasLocation = true;
  }

  create() {
    if (!this.jobsite.name || !this.jobsite.address || !this.jobsite.status) return;
    if (!this.hasLocation) {
      this.error = 'Please set a location for the jobsite.';
      return;
    }

    this.uiStateService.showLoading();

    // Get the current company first
    this.userStateService.currentCompany$
      .pipe(
        take(1),
        finalize(() => this.uiStateService.hideLoading())
      )
      .subscribe({
        next: (company) => {
          if (!company) {
            this.error = 'No company selected. Please select a company first.';
            return;
          }
          
          // Create a plain object with the correct structure for the API
          const requestData = {
            name: this.jobsite.name,
            address: this.jobsite.address,
            status: this.jobsite.status,
            company_id: company.id
          } as any;
          
          // Add latitude and longitude directly
          if (this.latitude !== undefined && this.longitude !== undefined) {
            requestData.latitude = this.latitude;
            requestData.longitude = this.longitude;
          }
          
          // Create the jobsite
          this.client.create_jobsite_api_jobsites__post(requestData)
            .subscribe({
              next: (response: JobsiteResponse) => {
                this.snackBar.open('Jobsite created successfully', 'Close', { duration: 3000 });
                this.dialogRef.close(response);
                
                // Navigate to the new jobsite
                this.router.navigate(['/jobsites', response.id]);
              },
              error: (error) => {
                console.error('Error creating jobsite:', error);
                if (error.error && error.error.detail) {
                  this.error = 'Validation error: ' + JSON.stringify(error.error.detail);
                } else {
                  this.error = 'Failed to create jobsite. Please try again.';
                }
              }
            });
        },
        error: (error) => {
          console.error('Error getting current company:', error);
          this.error = 'Failed to get company information. Please try again.';
        }
      });
  }
}

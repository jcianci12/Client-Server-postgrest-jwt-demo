import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { UIStateService } from '../services/ui-state.service';
import { finalize, take } from 'rxjs';
import { JobsiteCreate, JobsiteResponse, JobsiteStatus } from '../api/api';
import { Client } from '../api/api';
import { UserStateService } from '../services/user-state.service';
import { Router } from '@angular/router';
import { MapPickerComponent, MapLocation } from '../shared/map-picker.component';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-create-jobsite-page',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule,
    FormsModule,
    MapPickerComponent,
    MatCardModule,
    MatToolbarModule,
    MatIconModule
  ],
  template: `
    <div class="page-container">
      <mat-toolbar color="primary">
        <button mat-icon-button (click)="navigateBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <span>Create New Jobsite</span>
      </mat-toolbar>
      
      <div class="content-container">
        <mat-card>
          <mat-card-content>
            <form #createForm="ngForm">
              <mat-form-field appearance="fill" class="full-width">
                <mat-label>Name</mat-label>
                <input matInput [(ngModel)]="jobsite.name" name="name" required
                      placeholder="Site Name">
              </mat-form-field>

              <mat-form-field appearance="fill" class="full-width">
                <mat-label>Address</mat-label>
                <textarea matInput [(ngModel)]="jobsite.address" name="address" required
                        placeholder="Site Address" rows="3"></textarea>
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
                <p class="map-instructions">
                  Drag the map to set the jobsite location or click the location button <mat-icon class="inline-icon">my_location</mat-icon> to use your current location. 
                  The pin shows the selected location.
                </p>
                <app-map-picker (locationSelected)="onLocationSelected($event)"></app-map-picker>
              </div>
            </form>
            
            <div *ngIf="error" class="error-message">
              {{error}}
            </div>
            
            <div class="button-row">
              <button mat-button (click)="navigateBack()">Cancel</button>
              <button mat-raised-button
                      color="primary"
                      (click)="create()"
                      [disabled]="!createForm.form.valid || !hasLocation">
                Create Jobsite
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .content-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
      width: 100%;
    }
    
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    
    .error-message {
      color: red;
      margin: 16px 0;
      padding: 8px;
      background-color: rgba(255, 0, 0, 0.05);
      border-radius: 4px;
    }
    
    .map-section {
      margin: 24px 0;
    }
    
    .map-instructions {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 8px;
    }
    
    .inline-icon {
      font-size: 18px;
      vertical-align: middle;
      height: 18px;
      width: 18px;
    }
    
    .button-row {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }
    
    mat-card {
      margin-bottom: 20px;
    }
  `]
})
export class CreateJobsitePageComponent {
  jobsite: JobsiteCreate = new JobsiteCreate();
  error?: string;
  Status = JobsiteStatus; // Make enum available to template
  hasLocation = false;
  
  // These properties will be sent to the backend when it's ready
  private latitude?: number;
  private longitude?: number;

  constructor(
    private uiStateService: UIStateService,
    private client: Client,
    private userStateService: UserStateService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  navigateBack() {
    this.router.navigate(['/jobsites']);
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
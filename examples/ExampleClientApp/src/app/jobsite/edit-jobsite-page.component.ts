import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule, NgForm } from '@angular/forms';
import { UIStateService } from '../services/ui-state.service';
import { finalize } from 'rxjs';
import { JobsiteResponse, JobsiteStatus } from '../api/api';
import { Client } from '../api/api';
import { ActivatedRoute, Router } from '@angular/router';
import { MapPickerComponent, MapLocation } from '../shared/map-picker.component';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-edit-jobsite-page',
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
        <span>Edit Jobsite</span>
      </mat-toolbar>
      
      <div class="content-container">
        <mat-card>
          <mat-card-content>
            <form #editForm="ngForm" *ngIf="jobsite">
              <mat-form-field appearance="fill" class="full-width">
                <mat-label>Name</mat-label>
                <input matInput [(ngModel)]="name" name="name" required
                      placeholder="Site Name">
              </mat-form-field>

              <mat-form-field appearance="fill" class="full-width">
                <mat-label>Address</mat-label>
                <textarea matInput [(ngModel)]="address" name="address" required
                        placeholder="Site Address" rows="3"></textarea>
              </mat-form-field>

              <mat-form-field appearance="fill" class="full-width">
                <mat-label>Status</mat-label>
                <mat-select [(ngModel)]="status" name="status" required>
                  <mat-option [value]="JobsiteStatus.Active">Active</mat-option>
                  <mat-option [value]="JobsiteStatus.Inactive">Inactive</mat-option>
                  <mat-option [value]="JobsiteStatus.Completed">Completed</mat-option>
                </mat-select>
              </mat-form-field>
              
              <div class="map-section">
                <h3>Set Jobsite Location</h3>
                <p class="map-instructions">
                  Drag the map to set the jobsite location or click the location button <mat-icon class="inline-icon">my_location</mat-icon> to use your current location. 
                  The pin shows the selected location.
                </p>
                <app-map-picker 
                  [initialLocation]="initialLocation" 
                  (locationSelected)="onLocationSelected($event)">
                </app-map-picker>
              </div>
            </form>
            
            <div *ngIf="error" class="error-message">
              {{error}}
            </div>
            
            <div class="button-row" *ngIf="jobsite">
              <button mat-button (click)="navigateBack()">Cancel</button>
              <button mat-raised-button
                      color="primary"
                      (click)="save()"
                      [disabled]="!isFormValid() || !hasLocation">
                Save Changes
              </button>
            </div>
            
            <div *ngIf="!jobsite && !error" class="loading-message">
              Loading jobsite data...
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
    
    .loading-message {
      text-align: center;
      padding: 20px;
      color: rgba(0, 0, 0, 0.6);
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
export class EditJobsitePageComponent implements OnInit {
  @ViewChild('editForm') editForm!: NgForm;
  
  jobsite?: JobsiteResponse;
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
  private jobsiteId?: number;

  constructor(
    private uiStateService: UIStateService,
    private client: Client,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.jobsiteId = +params['id'];
        this.loadJobsite(this.jobsiteId);
      } else {
        this.error = 'No jobsite ID provided';
      }
    });
  }

  loadJobsite(id: number) {
    this.uiStateService.showLoading();
    
    this.client.get_jobsite_api_jobsites__jobsite_id__get(id)
      .pipe(finalize(() => this.uiStateService.hideLoading()))
      .subscribe({
        next: (jobsite) => {
          this.jobsite = jobsite;
          this.name = jobsite.name;
          this.address = jobsite.address;
          this.status = jobsite.status;
          
          // Check if the jobsite has latitude and longitude
          if (jobsite.latitude !== undefined && jobsite.latitude !== null && 
              jobsite.longitude !== undefined && jobsite.longitude !== null) {
            
            // Extract the numeric values
            let lat: number;
            let lng: number;
            
            if (typeof jobsite.latitude === 'number') {
              lat = jobsite.latitude;
            } else if (typeof jobsite.latitude === 'object' && jobsite.latitude !== null) {
              lat = (jobsite.latitude as any).value || 0;
            } else {
              lat = 0;
            }
            
            if (typeof jobsite.longitude === 'number') {
              lng = jobsite.longitude;
            } else if (typeof jobsite.longitude === 'object' && jobsite.longitude !== null) {
              lng = (jobsite.longitude as any).value || 0;
            } else {
              lng = 0;
            }
            
            this.initialLocation = {
              latitude: lat,
              longitude: lng
            };
            
            this.latitude = lat;
            this.longitude = lng;
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
        },
        error: (error) => {
          console.error('Error loading jobsite:', error);
          this.error = 'Failed to load jobsite';
        }
      });
  }

  navigateBack() {
    if (this.jobsiteId) {
      this.router.navigate(['/jobsites', this.jobsiteId]);
    } else {
      this.router.navigate(['/jobsites']);
    }
  }
  
  onLocationSelected(location: MapLocation): void {
    this.latitude = location.latitude;
    this.longitude = location.longitude;
    this.hasLocation = true;
  }

  save() {
    if (!this.name || !this.address || !this.status || !this.jobsiteId) return;
    if (!this.hasLocation) {
      this.error = 'Please set a location for the jobsite.';
      return;
    }

    this.uiStateService.showLoading();

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

    this.client.update_jobsite_api_jobsites__jobsite_id__put(this.jobsiteId, requestData)
      .pipe(finalize(() => this.uiStateService.hideLoading()))
      .subscribe({
        next: (jobsite: JobsiteResponse) => {
          this.snackBar.open('Jobsite updated successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/jobsites', this.jobsiteId]);
        },
        error: (error: any) => {
          console.error('Error updating jobsite:', error);
          if (error.error && error.error.detail) {
            this.error = 'Validation error: ' + JSON.stringify(error.error.detail);
          } else {
            this.error = 'Failed to update jobsite';
          }
        }
      });
  }

  isFormValid(): boolean {
    return this.editForm?.form?.valid ?? false;
  }
} 
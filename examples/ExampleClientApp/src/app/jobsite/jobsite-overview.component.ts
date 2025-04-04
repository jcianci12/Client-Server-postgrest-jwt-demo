import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Client, JobsiteResponse } from '../api/api';
import { StatusService } from '../services/status.service';
import { finalize } from 'rxjs';
import { MapPickerComponent, MapLocation } from '../shared/map-picker.component';
import { WeatherForecastComponent } from '../shared/weather-forecast.component';
import { QrCodeComponent } from '../shared/qr-code.component';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-jobsite-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
    MapPickerComponent,
    WeatherForecastComponent,
    QrCodeComponent
  ],
  template: `
    <div class="jobsite-overview-container">
      <h2>Jobsite Overview</h2>
      
      <div class="flex-grid">
        <!-- Details Card -->
        <div class="flex-item">
          <mat-card>
            <mat-card-header>
              <mat-card-title>Details</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="detail-item">
                <strong>Name:</strong> {{jobsite?.name}}
              </div>
              <div class="detail-item">
                <strong>Address:</strong> {{jobsite?.address}}
              </div>
              <div class="detail-item">
                <strong>Status:</strong> {{jobsite?.status}}
              </div>
              <div class="detail-item">
                <strong>Created:</strong> {{jobsite?.created_at | date:'medium'}}
              </div>
              <div class="detail-item">
                <strong>Last Updated:</strong> {{jobsite?.updated_at | date:'medium'}}
              </div>
            </mat-card-content>
          </mat-card>
        </div>
       
        <!-- Map Card -->
        <div class="flex-item">
          <mat-card>
            <mat-card-header>
              <mat-card-title>Location</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div *ngIf="hasLocation; else noLocation">
                <app-map-picker 
                  [initialLocation]="location" 
                  [readOnly]="true">
                </app-map-picker>
                <div class="coordinates">
                  <strong>Coordinates:</strong> {{location?.latitude | number:'1.6-6'}}, {{location?.longitude | number:'1.6-6'}}
                </div>
              </div>
              <ng-template #noLocation>
                <div class="no-location">
                  <mat-icon>location_off</mat-icon>
                  <p>No location data available for this jobsite.</p>
                </div>
              </ng-template>
            </mat-card-content>
          </mat-card>
        </div>
        
        <!-- Weather Card -->
        <div *ngIf="hasLocation" class="flex-item">
          <mat-card>
            <mat-card-header>
              <mat-card-title>Weather</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <app-weather-forecast 
                [latitude]="location!.latitude" 
                [longitude]="location!.longitude"
                [compact]="true"
                [showDescription]="true">
              </app-weather-forecast>
            </mat-card-content>
          </mat-card>
        </div>
        
        <!-- QR Code Card -->
        <div class="flex-item qr-code-item" *ngIf="jobsite?.id">
          <mat-card>
            <mat-card-header>
              <mat-card-title>Jobsite QR Code</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <app-qr-code 
                [jobsiteId]="jobsite!.id" 
                [jobsite]="jobsite"
                class="overview-qr-code">
              </app-qr-code>
              <div class="qr-code-actions">
                <a mat-button color="primary" [routerLink]="['../qrcode']">
                  <mat-icon>open_in_new</mat-icon>
                  View Full QR Code Page
                </a>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
      
      <div *ngIf="error" class="error-message">
        {{error}}
      </div>
    </div>
  `,
  styles: [`
    .jobsite-overview-container {
      padding: 16px;
    }
    
    .flex-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      grid-auto-rows: auto;
      grid-gap: 20px;
      margin-top: 16px;
      margin-bottom: 20px;
    }
    
    .flex-item {
      min-width: 0; /* Prevents flex items from overflowing */
      height: fit-content;
    }
    
    .qr-code-item {
      /* No special sizing needed in grid layout */
    }
    
    .overview-qr-code {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
    }
    
    .overview-qr-code ::ng-deep .test-actions,
    .overview-qr-code ::ng-deep .instructions-card {
      display: none; /* Hide the test button and instructions in overview mode */
    }
    
    .qr-code-actions {
      display: flex;
      justify-content: center;
      margin-top: 16px;
    }
    
    .detail-item {
      margin-bottom: 12px;
      line-height: 1.5;
    }
    
    .coordinates {
      margin-top: 12px;
      font-size: 14px;
    }
    
    .no-location {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 0;
      color: rgba(0, 0, 0, 0.54);
    }
    
    .no-location mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 16px;
    }
    
    .error-message {
      color: red;
      margin-top: 16px;
    }
  `]
})
export class JobsiteOverviewComponent implements OnInit {
  jobsite?: JobsiteResponse;
  error?: string;
  location?: MapLocation;
  hasLocation = false;

  constructor(
    private route: ActivatedRoute,
    private statusService: StatusService,
    private client: Client
  ) { }

  ngOnInit() {
    // Get the jobsite ID from the route parameters
    this.route.parent?.params.subscribe({
      next: (params) => {
        const id = params['id'];
        if (id) {
          this.loadJobsite(+id);
        } else {
          this.error = 'No jobsite ID found';
        }
      },
      error: (error) => {
        console.error('Error getting route parameters:', error);
        this.error = 'Error loading jobsite';
      }
    });
  }

  loadJobsite(id: number) {
    this.statusService.showLoading();

    this.client.get_jobsite_api_jobsites__jobsite_id__get(id)
      .pipe(finalize(() => this.statusService.hideLoading()))
      .subscribe({
        next: (jobsite) => {
          this.jobsite = jobsite;
          console.log('Jobsite data:', jobsite);

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

            this.location = {
              latitude: lat,
              longitude: lng
            };

            this.hasLocation = true;
            console.log('Location set:', this.location);
          } else {
            console.log('No location data available');
          }
        },
        error: (error) => {
          console.error('Error loading jobsite:', error);
          this.error = 'Failed to load jobsite';
          this.statusService.showMessage('Failed to load jobsite');
        }
      });
  }
} 
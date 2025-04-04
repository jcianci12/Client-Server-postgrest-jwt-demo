import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { StatusService } from '../services/status.service';
import { finalize } from 'rxjs';
import { Client, JobsiteResponse } from '../api/api';
import { QrCodeComponent } from '../shared/qr-code.component';

@Component({
  selector: 'app-jobsite-qrcode',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    QrCodeComponent
  ],
  template: `
    <div class="qrcode-page-container">
      <div class="header-actions">
        <button mat-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
          Back to Jobsite
        </button>
      </div>
      
      <div class="qrcode-content" *ngIf="jobsite">
        <h1>Jobsite QR Code</h1>
        <h2>{{jobsite.name}}</h2>
        <p class="address">{{jobsite.address}}</p>
        
        <div class="qr-code-container">
          <app-qr-code 
            [jobsiteId]="jobsite.id" 
            [jobsite]="jobsite">
          </app-qr-code>
        </div>
      </div>
      
      <div *ngIf="error" class="error-message">
        {{error}}
      </div>
    </div>
  `,
  styles: [`
    .qrcode-page-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .header-actions {
      margin-bottom: 20px;
    }
    
    .qrcode-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    
    h1 {
      margin-bottom: 8px;
    }
    
    h2 {
      margin-bottom: 4px;
      color: var(--mat-primary-color);
    }
    
    .address {
      margin-bottom: 24px;
      color: var(--mat-card-subtitle-text-color);
    }
    
    .qr-code-container {
      margin: 20px 0;
      width: 100%;
      max-width: 400px;
    }
    
    .error-message {
      color: var(--mat-red-500);
      margin-top: 16px;
      text-align: center;
      padding: 16px;
      background-color: rgba(244, 67, 54, 0.1);
      border-radius: 4px;
    }
  `]
})
export class JobsiteQrcodeComponent implements OnInit {
  jobsite?: JobsiteResponse;
  error?: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private statusService: StatusService,
    private client: Client
  ) {}

  ngOnInit() {
    // Get the jobsite ID from the route parameters
    this.route.parent?.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadJobsite(+id);
      } else {
        this.error = 'No jobsite ID found';
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
        },
        error: (error) => {
          console.error('Error loading jobsite:', error);
          this.error = 'Failed to load jobsite';
          this.statusService.showMessage('Failed to load jobsite');
        }
      });
  }

  goBack() {
    // Navigate back to the jobsite overview
    if (this.jobsite) {
      this.router.navigate(['/jobsites', this.jobsite.id, 'overview']);
    } else {
      this.router.navigate(['/jobsites']);
    }
  }
} 
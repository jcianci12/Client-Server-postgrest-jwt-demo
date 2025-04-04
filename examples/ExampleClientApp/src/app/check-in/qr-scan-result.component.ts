import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Client, JobsiteQRCodeResponse, QRCodeVerifyRequest } from '../api/api';
import { StatusService } from '../services/status.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-qr-scan-result',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterModule
  ],
  template: `
    <div class="qr-scan-container">
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Verifying QR code...</p>
      </div>
      
      <div *ngIf="error" class="error-container">
        <mat-icon color="warn">error</mat-icon>
        <h2>Error</h2>
        <p>{{ error }}</p>
        <button mat-raised-button color="primary" routerLink="/home">
          Return to Home
        </button>
      </div>
      
      <div *ngIf="jobsite && !loading && !error" class="welcome-container">
        <div class="logo-container">
          <!-- Company logo would go here -->
          <mat-icon class="company-logo">business</mat-icon>
        </div>
        
        <h1 class="welcome-text">Welcome to</h1>
        <h2 class="jobsite-name">{{ jobsite.name }}</h2>
        
        <p class="jobsite-address" *ngIf="jobsite.address">{{ jobsite.address }}</p>
        
        <button 
          mat-raised-button 
          color="primary" 
          class="check-in-button"
          (click)="proceedToCheckIn()">
          CHECK IN
        </button>
      </div>
    </div>
  `,
  styles: [`
    .qr-scan-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
      text-align: center;
      background-color: #f5f5f5;
    }
    
    .loading-container, .error-container, .welcome-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      max-width: 500px;
      width: 100%;
      padding: 32px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    .loading-container {
      gap: 16px;
    }
    
    .error-container {
      gap: 16px;
    }
    
    .error-container mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
    }
    
    .welcome-container {
      gap: 16px;
    }
    
    .logo-container {
      margin-bottom: 16px;
    }
    
    .company-logo {
      font-size: 64px;
      height: 64px;
      width: 64px;
      color: #3f51b5;
    }
    
    .welcome-text {
      margin: 0;
      font-size: 24px;
      font-weight: normal;
    }
    
    .jobsite-name {
      margin: 0;
      font-size: 32px;
      font-weight: bold;
      color: #3f51b5;
    }
    
    .jobsite-address {
      margin: 8px 0 24px;
      color: #666;
    }
    
    .check-in-button {
      margin-top: 16px;
      padding: 8px 32px;
      font-size: 18px;
      font-weight: bold;
    }
  `]
})
export class QrScanResultComponent implements OnInit {
  loading = true;
  error: string | null = null;
  jobsite: JobsiteQRCodeResponse | null = null;
  token: string | null = null;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private client: Client,
    private statusService: StatusService
  ) {}
  
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      
      if (!this.token) {
        this.error = 'No QR code token provided';
        this.loading = false;
        return;
      }
      
      this.verifyQrCode(this.token);
    });
  }
  
  verifyQrCode(token: string): void {
    const request = new QRCodeVerifyRequest({
      token: token
    });
    
    this.client.verify_qr_code_api_qrcodes_verify_qr_code_post(request)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          this.jobsite = response;
        },
        error: (error) => {
          console.error('Error verifying QR code:', error);
          this.error = 'Invalid or expired QR code';
        }
      });
  }
  
  proceedToCheckIn(): void {
    if (this.jobsite && this.token) {
      // Store the token and jobsite ID in session storage for the check-in flow
      sessionStorage.setItem('qr_token', this.token);
      sessionStorage.setItem('jobsite_id', this.jobsite.id.toString());
      sessionStorage.setItem('jobsite_name', this.jobsite.name);
      if (this.jobsite.address) {
        sessionStorage.setItem('jobsite_address', this.jobsite.address);
      }
      
      // Navigate to the visitor/contractor selection page
      this.router.navigate(['/check-in/type']);
    }
  }
} 
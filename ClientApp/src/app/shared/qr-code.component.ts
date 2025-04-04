import { Component, Input, OnChanges, SimpleChanges, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { Client, JobsiteResponse, UserRole, API_BASE_URL, JobsiteQRCodeResponse, QRCodeResponse } from '../api/api';
import { StatusService } from '../services/status.service';
import { finalize } from 'rxjs';
import { RolesService } from '../services/roles.service';

interface QrCodeData {
  qr_code_id: string;
  generated_at: Date;
  jobsite_id: number;
}

@Component({
  selector: 'app-qr-code',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <div class="qr-code-container">
      <div class="qr-content">
        <div *ngIf="jobsite" class="qr-subtitle">
          QR Code ID: {{jobsite.qr_code_id}}
        </div>
        
        <div class="qr-image-container" [class.loading]="loading">
          <img 
            *ngIf="qrImageUrl && !loading" 
            [src]="qrImageUrl" 
            alt="Jobsite QR Code"
            class="qr-image"
          />
          <mat-spinner *ngIf="loading" diameter="40"></mat-spinner>
          <div *ngIf="error" class="error-message">
            {{ error }}
          </div>
        </div>
        
        <div class="qr-actions">
          <button 
            mat-button 
            color="primary" 
            (click)="downloadQrCode()"
            [disabled]="!qrImageUrl || loading"
            matTooltip="Download QR Code"
          >
            <mat-icon>download</mat-icon>
            <span class="button-text">Download</span>
          </button>
          
          <button 
            mat-button 
            color="primary" 
            (click)="printQrCode()"
            [disabled]="!qrImageUrl || loading"
            matTooltip="Print QR Code"
          >
            <mat-icon>print</mat-icon>
            <span class="button-text">Print</span>
          </button>
          
          <button 
            mat-button 
            color="warn" 
            *ngIf="isAdmin"
            (click)="regenerateQrCode()"
            [disabled]="loading"
            matTooltip="Generate a new QR code (invalidates the old one)"
          >
            <mat-icon>refresh</mat-icon>
            <span class="button-text">Regenerate</span>
          </button>
        </div>
      </div>
      
      <!-- Test QR Code Button -->
      <div class="test-actions">
        <button 
          mat-raised-button 
          color="accent" 
          (click)="testQrCodeScan()"
          [disabled]="!qrCodeId"
          class="test-button">
          Test QR Code Check-in Flow
        </button>
        <p class="test-info" *ngIf="!qrCodeId">Loading QR token...</p>
      </div>
      
      <!-- Instructions -->
      <mat-card class="instructions-card">
        <mat-card-header>
          <mat-card-title>How to use this QR code</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <ul class="instructions-list">
            <li>Display this QR code at the jobsite entrance</li>
            <li>Visitors and contractors can scan it to check in</li>
            <li>Use the print button to create a physical copy</li>
            <li>For security, only share with authorized personnel</li>
          </ul>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .qr-code-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      gap: 20px;
    }
    
    .qr-content {
      width: auto;
      max-width: 350px;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 0 auto;
    }
    
    .qr-subtitle {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 8px;
      text-align: center;
    }
    
    .qr-image-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 200px;
      padding: 16px;
      width: 100%;
      max-width: 300px;
      margin: 0 auto;
    }
    
    .qr-image-container.loading {
      opacity: 0.7;
    }
    
    .qr-image {
      max-width: 100%;
      height: auto;
      border: 1px solid #eee;
    }
    
    .error-message {
      color: #f44336;
      text-align: center;
      padding: 16px;
    }
    
    .qr-actions {
      display: flex;
      justify-content: flex-end;
      width: 100%;
      padding: 8px 0;
    }
    
    .test-actions {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 8px 0;
    }
    
    .test-button {
      min-width: 200px;
    }
    
    .test-info {
      margin-top: 8px;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
    }
    
    .instructions-card {
      width: 100%;
      max-width: 350px;
    }
    
    .instructions-list {
      padding-left: 20px;
    }
    
    .instructions-list li {
      margin-bottom: 8px;
    }
    
    @media (max-width: 600px) {
      .button-text {
        display: none;
      }
      
      .qr-actions button {
        min-width: 40px;
        padding: 0 8px;
      }
    }
  `]
})
export class QrCodeComponent implements OnChanges {
  @Input() jobsiteId!: number;
  @Input() jobsite?: JobsiteResponse | JobsiteQRCodeResponse;
  
  qrImageUrl: string | null = null;
  loading = false;
  error: string | null = null;
  isAdmin = false;
  qrCodeId: string | null = null;
  
  constructor(
    private client: Client,
    private statusService: StatusService,
    private rolesService: RolesService,
    private router: Router,
    @Optional() @Inject(API_BASE_URL) private baseUrl: string
  ) {
    this.rolesService.currentRole$.subscribe(role => {
      this.isAdmin = role === UserRole.System_admin || role === UserRole.Company_Admin;
    });
    
    // Default to empty string if not provided
    this.baseUrl = this.baseUrl || '';
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['jobsiteId'] && !changes['jobsiteId'].firstChange) || 
        (changes['jobsite'] && !changes['jobsite'].firstChange)) {
      this.loadQrCode();
    } else if (this.jobsiteId) {
      this.loadQrCode();
    }
  }
  
  loadQrCode(): void {
    if (!this.jobsiteId) {
      this.error = 'No jobsite ID provided';
      return;
    }
    
    this.loading = true;
    this.error = null;
    
    // First, get the QR code data
    this.client.get_qr_code_data_api_qrcodes_get_qr_code_data__jobsite_id__get(this.jobsiteId)
      .pipe(finalize(() => {}))
      .subscribe({
        next: (data: JobsiteQRCodeResponse) => {
          this.jobsite = data;
          
          // Now that we have the QR code data, we can get the image
          if (data && data.qr_code_id) {
            this.qrCodeId = data.qr_code_id;
            
            // Create a unique URL with a timestamp to prevent caching
            const timestamp = new Date().getTime();
            this.qrImageUrl = `${this.baseUrl}/api/qrcodes/get-qr-code-image/${data.qr_code_id}?t=${timestamp}`;
            
            // We're using direct image URL instead of API call to handle binary data more easily
            // But we'll simulate loading for better UX
            setTimeout(() => {
              this.loading = false;
            }, 500);
          } else {
            this.error = 'Invalid QR code data received';
            this.loading = false;
          }
        },
        error: (error: any) => {
          console.error('Error loading QR code data:', error);
          this.error = 'Failed to load QR code data';
          this.loading = false;
        }
      });
  }
  
  regenerateQrCode(): void {
    if (!this.jobsiteId) {
      this.error = 'No jobsite ID provided';
      return;
    }
    
    if (confirm('Are you sure you want to regenerate the QR code? This will invalidate the existing code.')) {
      this.loading = true;
      this.error = null;
      
      this.client.regenerate_qr_code_api_qrcodes_regenerate_qr_code__jobsite_id__post(this.jobsiteId)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: (response: QRCodeResponse) => {
            // After regeneration, reload the QR code
            this.loadQrCode();
            this.statusService.showMessage('QR code regenerated successfully');
          },
          error: (error: any) => {
            console.error('Error regenerating QR code:', error);
            this.error = 'Failed to regenerate QR code';
            this.statusService.showMessage('Failed to regenerate QR code');
          }
        });
    }
  }
  
  downloadQrCode(): void {
    if (!this.qrImageUrl) return;
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = this.qrImageUrl;
    link.download = `jobsite-${this.jobsiteId}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  printQrCode(): void {
    if (!this.qrImageUrl) return;
    
    // Create a new window with just the QR code image
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the QR code');
      return;
    }
    
    // Get jobsite name for the title
    const jobsiteName = this.jobsite?.name || `Jobsite ${this.jobsiteId}`;
    
    // Create the content for the print window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Code - ${jobsiteName}</title>
        <style>
          body {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            font-family: Arial, sans-serif;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .qr-container {
            border: 1px solid #ccc;
            padding: 20px;
            display: inline-block;
          }
          .instructions {
            margin-top: 20px;
            max-width: 400px;
            text-align: left;
          }
          @media print {
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${jobsiteName}</h1>
          <p>Scan this QR code to check in</p>
        </div>
        <div class="qr-container">
          <img src="${this.qrImageUrl}" alt="QR Code" style="max-width: 300px; height: auto;">
        </div>
        <div class="instructions">
          <h3>Instructions:</h3>
          <ul>
            <li>Display this QR code at the jobsite entrance</li>
            <li>Visitors and contractors can scan it to check in</li>
            <li>For security, only share with authorized personnel</li>
          </ul>
        </div>
        <button class="no-print" style="margin-top: 20px; padding: 10px 20px;" onclick="window.print()">Print</button>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  }
  
  testQrCodeScan(): void {
    if (this.qrCodeId) {
      // Navigate to the QR scan result page with the token as a query parameter
      this.router.navigate(['/qr-scan'], { queryParams: { token: this.qrCodeId } });
    }
  }
} 
import { Component } from '@angular/core';
import { CommonModule, JsonPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Client, QRCodeVerifyRequest } from '../api/api';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  standalone: true,
  imports: [
    CommonModule, 
    JsonPipe, 
    MatButtonModule, 
    MatCardModule, 
    MatDividerModule,
    MatProgressSpinnerModule,
    FormsModule
  ]
})
export class TestComponent {
  result: any;
  authMeResult: any;
  loadingAuthMe: boolean = false;
  loading: boolean = false;
  currentCompanyResult: any;
  loadingCurrentCompany: boolean = false;
  
  // QR code testing properties
  qrCodeTestJobsiteId: number = 1; // Default to first jobsite for testing
  qrToken: string | null = null;
  loadingQrToken: boolean = false;
  qrVerifyResult: any = null;

  constructor(
    private client: Client,
    private router: Router
  ) {
    // Instantiate the API client. Optionally, a base URL can be provided if needed.
  }

  callTestApi(): void {
    this.loading = true;
    this.client.test_auth_api_auth_test_get().subscribe(
      response => {
        this.result = response;
        this.loading = false;
      },
      error => {
        this.result = { error };
        this.loading = false;
      }
    );
  }

  callAuthMeApi(): void {
    this.loadingAuthMe = true;
    this.client.read_users_me_api_auth_me_get().subscribe(
      response => {
        this.authMeResult = response;
        this.loadingAuthMe = false;
      },
      error => {
        this.authMeResult = { error };
        this.loadingAuthMe = false;
      }
    );
  }

  callCurrentCompanyApi(): void {
    this.loadingCurrentCompany = true;
    this.client.get_current_company_api_companies_current_get().subscribe(
      response => {
        this.currentCompanyResult = response;
        this.loadingCurrentCompany = false;
      },
      error => {
        this.currentCompanyResult = { error };
        this.loadingCurrentCompany = false;
      }
    );
  }

  // QR code testing methods
  getQrToken(): void {
    this.loadingQrToken = true;
    this.client.get_qr_code_data_api_qrcodes_get_qr_code_data__jobsite_id__get(this.qrCodeTestJobsiteId)
      .subscribe({
        next: (response) => {
          if (response && response.qr_code_id) {
            this.qrToken = response.qr_code_id;
            // Store in session storage for testing the flow
            sessionStorage.setItem('qr_token', response.qr_code_id);
            sessionStorage.setItem('jobsite_id', response.id.toString());
            sessionStorage.setItem('jobsite_name', response.name);
            if (response.address) {
              sessionStorage.setItem('jobsite_address', response.address);
            }
          }
          this.loadingQrToken = false;
        },
        error: (error) => {
          console.error('Error getting QR token:', error);
          this.qrToken = null;
          this.loadingQrToken = false;
        }
      });
  }

  verifyQrToken(): void {
    if (!this.qrToken) {
      alert('No QR token available. Please get a QR token first.');
      return;
    }

    const request = new QRCodeVerifyRequest({
      token: this.qrToken
    });
    
    this.client.verify_qr_code_api_qrcodes_verify_qr_code_post(request)
      .subscribe({
        next: (response) => {
          this.qrVerifyResult = response;
        },
        error: (error) => {
          console.error('Error verifying QR code:', error);
          this.qrVerifyResult = { error: 'Failed to verify QR code' };
        }
      });
  }

  // Navigation methods for testing the check-in flow
  goToQrScanResult(): void {
    if (!this.qrToken) {
      alert('No QR token available. Please get a QR token first.');
      return;
    }
    this.router.navigate(['/qr-scan'], { queryParams: { token: this.qrToken } });
  }

  goToCheckInType(): void {
    this.router.navigate(['/check-in/type']);
  }

  goToContractorInduction(): void {
    // Set session storage for testing
    sessionStorage.setItem('check_in_type', 'contractor');
    this.router.navigate(['/check-in/induction']);
  }

  goToCheckInForm(): void {
    // Set session storage for testing
    sessionStorage.setItem('check_in_type', 'visitor');
    this.router.navigate(['/check-in/form']);
  }

  goToCheckInInstructions(): void {
    // Set session storage for testing
    sessionStorage.setItem('check_in_type', 'contractor');
    sessionStorage.setItem('inducted', 'true');
    this.router.navigate(['/check-in/instructions']);
  }

  goToCheckInConfirmation(): void {
    // Set session storage for testing
    sessionStorage.setItem('check_in_name', 'Test User');
    sessionStorage.setItem('check_in_contact', 'test@example.com');
    sessionStorage.setItem('check_in_company', 'Test Company');
    this.router.navigate(['/check-in/confirmation']);
  }

  clearSessionStorage(): void {
    sessionStorage.clear();
    alert('Session storage cleared');
  }
}

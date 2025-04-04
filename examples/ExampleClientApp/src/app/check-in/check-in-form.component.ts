import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { Client, CheckInRequest, CheckInRequestType, CheckInResponse, VisitorResponse, SubcontractorResponse } from '../api/api';
import { StatusService } from '../services/status.service';
import { finalize } from 'rxjs';
import { UnifiedCheckInService } from '../services/unified-check-in.service';

@Component({
  selector: 'app-check-in-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="check-in-form-container">
      <div class="form-card">
        <h1 class="form-title">Please enter your details</h1>
        
        <form [formGroup]="checkInForm" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Full Name</mat-label>
            <input matInput formControlName="name" placeholder="Enter your full name">
            <mat-error *ngIf="checkInForm.get('name')?.hasError('required')">
              Name is required
            </mat-error>
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Contact (Email or Phone)</mat-label>
            <input matInput formControlName="contactInfo" placeholder="Enter your email or phone number">
            <mat-error *ngIf="checkInForm.get('contactInfo')?.hasError('required')">
              Contact information is required
            </mat-error>
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="form-field" *ngIf="isContractor">
            <mat-label>Company</mat-label>
            <input matInput formControlName="company" placeholder="Enter your company name">
            <mat-error *ngIf="checkInForm.get('company')?.hasError('required')">
              Company name is required for contractors
            </mat-error>
          </mat-form-field>
          
          <div class="form-actions">
            <button 
              mat-raised-button 
              color="primary" 
              type="submit"
              [disabled]="checkInForm.invalid || loading">
              <mat-icon *ngIf="!loading">check</mat-icon>
              <mat-spinner *ngIf="loading" diameter="24"></mat-spinner>
              CONTINUE
            </button>
            
            <button 
              mat-button 
              type="button"
              [disabled]="loading"
              (click)="goBack()">
              <mat-icon>arrow_back</mat-icon>
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .check-in-form-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
      background-color: #f5f5f5;
    }
    
    .form-card {
      display: flex;
      flex-direction: column;
      max-width: 500px;
      width: 100%;
      padding: 32px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    .form-title {
      margin: 0 0 24px;
      text-align: center;
      font-size: 24px;
    }
    
    .form-field {
      width: 100%;
      margin-bottom: 16px;
    }
    
    .form-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 16px;
    }

    button mat-spinner {
      display: inline-block;
      margin-right: 8px;
    }
  `]
})
export class CheckInFormComponent implements OnInit {
  checkInForm: FormGroup;
  loading = false;
  isContractor = false;
  jobsiteId: number | null = null;
  token: string | null = null;
  checkInType: 'visitor' | 'contractor' | null = null;
  inducted: boolean | null = null;
  
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private client: Client,
    private statusService: StatusService,
    private unifiedCheckInService: UnifiedCheckInService
  ) {
    this.checkInForm = this.fb.group({
      name: ['', Validators.required],
      contactInfo: ['', Validators.required],
      company: ['']
    });
  }
  
  ngOnInit(): void {
    // Get data from session storage
    const jobsiteIdStr = sessionStorage.getItem('jobsite_id');
    this.token = sessionStorage.getItem('qr_token');
    const checkInTypeStr = sessionStorage.getItem('check_in_type');
    const inductedStr = sessionStorage.getItem('inducted');
    
    if (!jobsiteIdStr || !this.token || !checkInTypeStr) {
      // If missing required data, redirect to home
      this.router.navigate(['/home']);
      return;
    }
    
    this.jobsiteId = parseInt(jobsiteIdStr, 10);
    this.checkInType = checkInTypeStr as 'visitor' | 'contractor';
    
    if (this.checkInType === 'contractor') {
      this.isContractor = true;
      
      // Add validator for company field for contractors
      this.checkInForm.get('company')?.setValidators(Validators.required);
      this.checkInForm.get('company')?.updateValueAndValidity();
      
      // Parse induction status
      if (inductedStr) {
        this.inducted = inductedStr === 'true';
      }
    }
  }
  
  onSubmit(): void {
    if (this.checkInForm.invalid) {
      return;
    }
    
    if (!this.jobsiteId || !this.token || !this.checkInType) {
      this.statusService.showMessage('Missing required data for check-in');
      return;
    }
    
    this.loading = true;
    
    const checkInType = this.checkInType === 'visitor' ? CheckInRequestType.Visitor : CheckInRequestType.Contractor;
    
    // Use the unified check-in service
    this.unifiedCheckInService.checkInWithToken(
      this.jobsiteId,
      this.checkInForm.get('name')?.value,
      this.checkInForm.get('contactInfo')?.value,
      checkInType,
      this.token,
      this.isContractor ? this.checkInForm.get('company')?.value : undefined,
      this.isContractor ? this.inducted : null,
      undefined // No additional notes
    )
    .pipe(finalize(() => this.loading = false))
    .subscribe({
      next: (response: { 
        checkInResponse: CheckInResponse, 
        entityResponse: VisitorResponse | SubcontractorResponse | null 
      }) => {
        // Store check-in data for confirmation
        this.unifiedCheckInService.storeCheckInData(response, {
          name: this.checkInForm.get('name')?.value,
          contactInfo: this.checkInForm.get('contactInfo')?.value,
          type: this.checkInType as 'visitor' | 'contractor',
          company: this.isContractor ? this.checkInForm.get('company')?.value : undefined,
          inducted: this.isContractor ? this.inducted : null
        });
        
        this.router.navigate(['/check-in/instructions']);
      },
      error: (error: any) => {
        console.error('Error creating check-in:', error);
        this.statusService.showMessage('Failed to check in. Please try again.');
      }
    });
  }
  
  goBack(): void {
    // Navigate back based on check-in type
    if (this.isContractor) {
      this.router.navigate(['/check-in/induction']);
    } else {
      this.router.navigate(['/check-in/type']);
    }
  }
} 
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { CheckInRequestType, CheckInResponse, VisitorResponse, SubcontractorResponse } from '../api/api';
import { UnifiedCheckInService } from '../services/unified-check-in.service';
import { StatusService } from '../services/status.service';
import { finalize } from 'rxjs';

export interface UnifiedCheckInDialogData {
  jobsiteId: number;
  mode: 'admin' | 'qr-code';
  type?: 'visitor' | 'contractor';
  qrToken?: string;
  jobsiteName?: string;
}

@Component({
  selector: 'app-unified-check-in-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDividerModule
  ],
  template: `
    <h2 mat-dialog-title>
      {{ getDialogTitle() }}
      <div class="subtitle" *ngIf="data.jobsiteName">{{ data.jobsiteName }}</div>
    </h2>
    
    <mat-dialog-content>
      <form [formGroup]="checkInForm">
        <!-- Type Selection (if not pre-selected) -->
        <mat-form-field class="full-width" *ngIf="!data.type">
          <mat-label>Check-in as</mat-label>
          <mat-select formControlName="type" (selectionChange)="onTypeChange()">
            <mat-option value="visitor">Visitor</mat-option>
            <mat-option value="contractor">Contractor</mat-option>
          </mat-select>
          <mat-error *ngIf="checkInForm.get('type')?.hasError('required')">
            Please select a type
          </mat-error>
        </mat-form-field>
        
        <!-- Common Fields -->
        <mat-form-field class="full-width">
          <mat-label>Full Name</mat-label>
          <input matInput formControlName="name" placeholder="Enter your full name">
          <mat-error *ngIf="checkInForm.get('name')?.hasError('required')">
            Name is required
          </mat-error>
        </mat-form-field>
        
        <mat-form-field class="full-width">
          <mat-label>Contact Info (Email/Phone)</mat-label>
          <input matInput formControlName="contactInfo" placeholder="Enter your email or phone number">
          <mat-error *ngIf="checkInForm.get('contactInfo')?.hasError('required')">
            Contact information is required
          </mat-error>
        </mat-form-field>
        
        <!-- Company Field (optional for visitors, required for contractors) -->
        <mat-form-field class="full-width">
          <mat-label>Company</mat-label>
          <input matInput formControlName="company" placeholder="Enter your company name">
          <mat-error *ngIf="checkInForm.get('company')?.hasError('required')">
            Company name is required for contractors
          </mat-error>
        </mat-form-field>
        
        <!-- Contractor-specific Fields -->
        <ng-container *ngIf="isContractor">
          <!-- Induction Status (only for QR code flow) -->
          <div class="induction-field" *ngIf="data.mode === 'qr-code'">
            <mat-checkbox formControlName="inducted">
              I have been inducted into this site
            </mat-checkbox>
          </div>
          
          <!-- Admin-only fields for contractors -->
          <ng-container *ngIf="data.mode === 'admin'">
            <mat-form-field class="full-width">
              <mat-label>Number of Workers</mat-label>
              <input matInput type="number" formControlName="qtyOfMen" min="1">
            </mat-form-field>
            
            <div class="time-fields">
              <mat-form-field class="half-width">
                <mat-label>Start Time</mat-label>
                <input matInput type="time" formControlName="startTime">
              </mat-form-field>
              
              <mat-form-field class="half-width">
                <mat-label>Finish Time</mat-label>
                <input matInput type="time" formControlName="finishTime">
              </mat-form-field>
            </div>
          </ng-container>
        </ng-container>
        
        <!-- Notes Field -->
        <mat-form-field class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="3" placeholder="Any additional information"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="loading">Cancel</button>
      <button 
        mat-raised-button 
        color="primary" 
        (click)="onSubmit()" 
        [disabled]="checkInForm.invalid || loading">
        <mat-spinner *ngIf="loading" diameter="20" class="spinner"></mat-spinner>
        {{ getSubmitButtonText() }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    
    .half-width {
      width: 48%;
    }
    
    .time-fields {
      display: flex;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    
    .induction-field {
      margin-bottom: 16px;
    }
    
    mat-dialog-content {
      min-width: 300px;
      max-width: 500px;
    }
    
    .spinner {
      display: inline-block;
      margin-right: 8px;
    }
    
    .subtitle {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
      margin-top: 4px;
    }
  `]
})
export class UnifiedCheckInDialogComponent implements OnInit {
  checkInForm: FormGroup;
  loading = false;
  isContractor = false;
  
  constructor(
    private fb: FormBuilder,
    private router: Router,
    public dialogRef: MatDialogRef<UnifiedCheckInDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UnifiedCheckInDialogData,
    private unifiedCheckInService: UnifiedCheckInService,
    private statusService: StatusService
  ) {
    // Initialize the form
    this.checkInForm = this.fb.group({
      type: [data.type || '', Validators.required],
      name: ['', Validators.required],
      contactInfo: ['', Validators.required],
      company: [''],
      inducted: [false],
      qtyOfMen: [1],
      startTime: [''],
      finishTime: [''],
      notes: ['']
    });
    
    // Set isContractor based on initial type
    this.isContractor = data.type === 'contractor';
    
    // Update validators based on type
    this.updateValidators();
  }
  
  ngOnInit(): void {
    // If type is pre-selected, update the form
    if (this.data.type) {
      this.checkInForm.get('type')?.setValue(this.data.type);
      this.onTypeChange();
    }
  }
  
  onTypeChange(): void {
    const type = this.checkInForm.get('type')?.value;
    this.isContractor = type === 'contractor';
    
    // Update validators based on type
    this.updateValidators();
  }
  
  updateValidators(): void {
    const companyControl = this.checkInForm.get('company');
    const qtyOfMenControl = this.checkInForm.get('qtyOfMen');
    const startTimeControl = this.checkInForm.get('startTime');
    const finishTimeControl = this.checkInForm.get('finishTime');
    
    if (this.isContractor) {
      // For contractors, company is required
      companyControl?.setValidators(Validators.required);
      
      // For admin mode, additional fields are required
      if (this.data.mode === 'admin') {
        qtyOfMenControl?.setValidators([Validators.required, Validators.min(1)]);
        startTimeControl?.setValidators(Validators.required);
        finishTimeControl?.setValidators(Validators.required);
      }
    } else {
      // For visitors, company is optional
      companyControl?.clearValidators();
      
      // Clear validators for contractor-specific fields
      qtyOfMenControl?.clearValidators();
      startTimeControl?.clearValidators();
      finishTimeControl?.clearValidators();
    }
    
    // Update validity
    companyControl?.updateValueAndValidity();
    qtyOfMenControl?.updateValueAndValidity();
    startTimeControl?.updateValueAndValidity();
    finishTimeControl?.updateValueAndValidity();
  }
  
  getDialogTitle(): string {
    if (this.data.mode === 'admin') {
      return this.isContractor ? 'Add Contractor' : 'Sign In Visitor';
    } else {
      return 'Check In';
    }
  }
  
  getSubmitButtonText(): string {
    if (this.data.mode === 'admin') {
      return this.isContractor ? 'Add Contractor' : 'Sign In Visitor';
    } else {
      return 'Check In';
    }
  }
  
  onSubmit(): void {
    if (this.checkInForm.invalid) {
      return;
    }
    
    this.loading = true;
    
    const formValues = this.checkInForm.value;
    const type = formValues.type || this.data.type;
    const checkInType = type === 'visitor' ? CheckInRequestType.Visitor : CheckInRequestType.Contractor;
    
    // Prepare additional notes for contractors in admin mode
    let notes = formValues.notes || '';
    if (this.isContractor && this.data.mode === 'admin') {
      const additionalInfo = `Number of workers: ${formValues.qtyOfMen}, ` +
                            `Hours: ${formValues.startTime} - ${formValues.finishTime}`;
      
      notes = notes ? `${notes}\n\n${additionalInfo}` : additionalInfo;
    }
    
    // Determine if we're using admin check-in or QR code check-in
    if (this.data.mode === 'admin') {
      // Admin-initiated check-in
      this.unifiedCheckInService.adminCheckIn(
        this.data.jobsiteId,
        formValues.name,
        formValues.contactInfo,
        checkInType,
        formValues.company,
        this.isContractor ? true : null, // Assume contractors added by admin are inducted
        notes,
        this.isContractor ? formValues.qtyOfMen : undefined
      )
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response: { 
          checkInResponse: CheckInResponse, 
          entityResponse: VisitorResponse | SubcontractorResponse | null 
        }) => {
          // Store check-in data for confirmation if needed
          if (this.data.mode === 'qr-code') {
            this.unifiedCheckInService.storeCheckInData(response, {
              name: formValues.name,
              contactInfo: formValues.contactInfo,
              type: type as 'visitor' | 'contractor',
              company: formValues.company,
              inducted: this.isContractor ? formValues.inducted : null
            });
          }
          
          this.statusService.showMessage(`${type === 'visitor' ? 'Visitor' : 'Contractor'} signed in successfully`);
          this.dialogRef.close(response.entityResponse || response.checkInResponse);
        },
        error: (error: any) => {
          console.error('Error signing in:', error);
          this.statusService.showMessage(`Failed to sign in. Please try again.`);
        }
      });
    } else if (this.data.mode === 'qr-code' && this.data.qrToken) {
      // QR code-based check-in
      this.unifiedCheckInService.checkInWithToken(
        this.data.jobsiteId,
        formValues.name,
        formValues.contactInfo,
        checkInType,
        this.data.qrToken,
        formValues.company,
        this.isContractor ? formValues.inducted : null,
        notes,
        this.isContractor ? formValues.qtyOfMen : undefined
      )
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response: { 
          checkInResponse: CheckInResponse, 
          entityResponse: VisitorResponse | SubcontractorResponse | null 
        }) => {
          // Store check-in data for confirmation
          this.unifiedCheckInService.storeCheckInData(response, {
            name: formValues.name,
            contactInfo: formValues.contactInfo,
            type: type as 'visitor' | 'contractor',
            company: formValues.company,
            inducted: this.isContractor ? formValues.inducted : null
          });
          
          // For QR code flow, navigate to confirmation page
          this.dialogRef.close(response.entityResponse || response.checkInResponse);
          this.router.navigate(['/check-in/confirmation']);
        },
        error: (error: any) => {
          console.error('Error checking in:', error);
          this.statusService.showMessage('Failed to check in. Please try again.');
        }
      });
    } else {
      this.loading = false;
      this.statusService.showMessage('Missing required data for check-in');
    }
  }
  
  onCancel(): void {
    this.dialogRef.close();
  }
} 
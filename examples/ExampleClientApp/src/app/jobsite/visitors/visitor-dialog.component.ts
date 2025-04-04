import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VisitorCreate, VisitorResponse, VisitorUpdate, CheckInRequestType, CheckInResponse, SubcontractorResponse } from '../../api/api';
import { UnifiedCheckInService } from '../../services/unified-check-in.service';
import { StatusService } from '../../services/status.service';
import { finalize } from 'rxjs';

export interface VisitorDialogData {
  visitor?: VisitorResponse;
  jobsiteId: number;
  mode: 'create' | 'edit';
}

@Component({
  selector: 'app-visitor-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'create' ? 'Sign In Visitor' : 'Edit Visitor' }}</h2>
    <mat-dialog-content>
      <form #visitorForm="ngForm" (ngSubmit)="onSubmit()">
        <mat-form-field class="full-width">
          <mat-label>Name</mat-label>
          <input matInput [(ngModel)]="visitorData.name" name="name" required>
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Contact Info (Email/Phone)</mat-label>
          <input matInput [(ngModel)]="visitorData.contact_info" name="contact_info" required>
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Company</mat-label>
          <input matInput [(ngModel)]="visitorData.company_name" name="company_name">
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput [(ngModel)]="visitorData.notes" name="notes" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="loading">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="!visitorForm.form.valid || loading">
        <mat-spinner *ngIf="loading" diameter="20" class="spinner"></mat-spinner>
        {{ data.mode === 'create' ? 'Sign In' : 'Save Changes' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    mat-dialog-content {
      min-width: 300px;
    }
    .spinner {
      display: inline-block;
      margin-right: 8px;
    }
  `]
})
export class VisitorDialogComponent {
  visitorData: any = {
    name: '',
    company_name: '',
    contact_info: '',
    notes: undefined
  };
  loading = false;

  constructor(
    public dialogRef: MatDialogRef<VisitorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VisitorDialogData,
    private unifiedCheckInService: UnifiedCheckInService,
    private statusService: StatusService
  ) {
    if (data.mode === 'edit' && data.visitor) {
      this.visitorData = {
        name: data.visitor.name,
        company_name: data.visitor.company_name,
        contact_info: data.visitor['contact_info'] || '',
        notes: data.visitor.notes,
      };
    }
  }

  onSubmit(): void {
    if (this.data.mode === 'create') {
      this.loading = true;
      
      // Use the unified check-in service
      this.unifiedCheckInService.adminCheckIn(
        this.data.jobsiteId,
        this.visitorData.name,
        this.visitorData['contact_info'],
        CheckInRequestType.Visitor,
        this.visitorData.company_name,
        null, // No induction status for visitors
        this.visitorData.notes // Pass notes to be included in the diary entry
      )
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response: { 
          checkInResponse: CheckInResponse, 
          entityResponse: VisitorResponse | SubcontractorResponse | null 
        }) => {
          this.statusService.showMessage('Visitor signed in successfully');
          // If entityResponse exists and is a VisitorResponse (has name property but not qty_of_men)
          if (response.entityResponse && 'name' in response.entityResponse && !('qty_of_men' in response.entityResponse)) {
            this.dialogRef.close(response.entityResponse);
          } else {
            this.dialogRef.close(response.checkInResponse);
          }
        },
        error: (error: any) => {
          console.error('Error signing in visitor:', error);
          this.statusService.showMessage('Failed to sign in visitor. Please try again.');
        }
      });
    } else {
      // Keep existing edit functionality
      const updateData = VisitorUpdate.fromJS(this.visitorData);
      this.dialogRef.close(updateData);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
} 
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SubcontractorCreate, SubcontractorResponse, SubcontractorUpdate, CheckInRequestType, CheckInResponse, VisitorResponse } from '../../api/api';
import { UnifiedCheckInService } from '../../services/unified-check-in.service';
import { StatusService } from '../../services/status.service';
import { finalize } from 'rxjs';

export interface SubcontractorDialogData {
  subcontractor?: SubcontractorResponse;
  jobsiteId: number;
  mode: 'create' | 'edit';
}

@Component({
  selector: 'app-subcontractor-dialog',
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
    <h2 mat-dialog-title>{{ data.mode === 'create' ? 'Add Subcontractor' : 'Edit Subcontractor' }}</h2>
    <div mat-dialog-content>
      <form #subcontractorForm="ngForm">
        <mat-form-field class="full-width">
          <mat-label>Company Name</mat-label>
          <input matInput [(ngModel)]="subcontractorData.company_name" name="company_name" required>
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Contact Name</mat-label>
          <input matInput [(ngModel)]="subcontractorData.contact_name" name="contact_name" required>
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Contact Info (Email/Phone)</mat-label>
          <input matInput [(ngModel)]="subcontractorData.contact_info" name="contact_info" required>
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Number of Workers</mat-label>
          <input matInput type="number" [(ngModel)]="subcontractorData.qty_of_men" name="qty_of_men" required min="1">
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Start Time</mat-label>
          <input matInput type="time" [(ngModel)]="subcontractorData.start_time" name="start_time" required>
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Finish Time</mat-label>
          <input matInput type="time" [(ngModel)]="subcontractorData.finish_time" name="finish_time" required>
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput [(ngModel)]="subcontractorData.notes" name="notes" rows="3"></textarea>
        </mat-form-field>
      </form>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button type="button" (click)="onCancel()" [disabled]="loading">Cancel</button>
      <button mat-raised-button color="primary" type="submit" 
              (click)="onSubmit(subcontractorForm)"
              [disabled]="!subcontractorForm.valid || loading">
        <mat-spinner *ngIf="loading" diameter="20" class="spinner"></mat-spinner>
        {{ data.mode === 'create' ? 'Add' : 'Save Changes' }}
      </button>
    </div>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    mat-dialog-content {
      min-width: 300px;
      padding-top: 10px;
    }
    form {
      display: flex;
      flex-direction: column;
    }
    .spinner {
      display: inline-block;
      margin-right: 8px;
    }
  `]
})
export class SubcontractorDialogComponent {
  subcontractorData: any = {
    company_name: '',
    contact_name: '',
    contact_info: '',
    qty_of_men: 1,
    start_time: '',
    finish_time: '',
    notes: undefined
  };
  loading = false;

  constructor(
    public dialogRef: MatDialogRef<SubcontractorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SubcontractorDialogData,
    private unifiedCheckInService: UnifiedCheckInService,
    private statusService: StatusService
  ) {
    if (data.mode === 'edit' && data.subcontractor) {
      this.subcontractorData = {
        company_name: data.subcontractor.company_name,
        contact_name: data.subcontractor['contact_name'] || '',
        contact_info: data.subcontractor['contact_info'] || '',
        qty_of_men: data.subcontractor.qty_of_men,
        start_time: data.subcontractor.start_time,
        finish_time: data.subcontractor.finish_time,
        notes: data.subcontractor.notes
      };
    }
  }

  onSubmit(form: any): void {
    if (!form.valid) return;

    if (this.data.mode === 'create') {
      this.loading = true;
      
      // Format times for notes
      const startTime = this.subcontractorData.start_time ? 
        new Date(`1970-01-01T${this.subcontractorData.start_time}:00`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A';
      
      const finishTime = this.subcontractorData.finish_time ? 
        new Date(`1970-01-01T${this.subcontractorData.finish_time}:00`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A';
      
      // Create notes with additional information
      const notes = `Contact: ${this.subcontractorData['contact_name']}\nWorkers: ${this.subcontractorData.qty_of_men}\nHours: ${startTime} - ${finishTime}\n\n${this.subcontractorData.notes || ''}`;
      
      // Use the unified check-in service
      this.unifiedCheckInService.adminCheckIn(
        this.data.jobsiteId,
        this.subcontractorData['contact_name'],
        this.subcontractorData['contact_info'],
        CheckInRequestType.Contractor,
        this.subcontractorData.company_name,
        true, // Assume contractors added by admin are inducted
        notes,
        this.subcontractorData.qty_of_men // Pass the quantity of men
      )
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response: { 
          checkInResponse: CheckInResponse, 
          entityResponse: SubcontractorResponse | VisitorResponse | null 
        }) => {
          this.statusService.showMessage('Contractor added successfully');
          // If entityResponse exists and is a SubcontractorResponse (has qty_of_men property)
          if (response.entityResponse && 'qty_of_men' in response.entityResponse) {
            this.dialogRef.close(response.entityResponse);
          } else {
            this.dialogRef.close(response.checkInResponse);
          }
        },
        error: (error: any) => {
          console.error('Error adding contractor:', error);
          this.statusService.showMessage('Failed to add contractor. Please try again.');
        }
      });
    } else {
      // For edit mode, just return the updated data
      const updateData = SubcontractorUpdate.fromJS(this.subcontractorData);
      this.dialogRef.close(updateData);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
} 
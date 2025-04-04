import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { InspectionResponse } from '../../../api/api';

@Component({
  selector: 'app-edit-inspection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Edit Inspection</h2>
    <mat-dialog-content>
      <form #inspectionForm="ngForm">
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Company Name</mat-label>
          <input matInput [(ngModel)]="formData.company_name" name="company_name" required>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Item Inspected</mat-label>
          <input matInput [(ngModel)]="formData.item_inspected" name="item_inspected" required>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput [(ngModel)]="formData.notes" name="notes" rows="4"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" 
              [disabled]="!inspectionForm.form.valid"
              (click)="onSubmit()">
        Update Inspection
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    mat-dialog-content {
      min-width: 400px;
    }
  `]
})
export class EditInspectionDialogComponent {
  formData: {
    company_name: string;
    item_inspected: string;
    notes: string;
  };

  constructor(
    public dialogRef: MatDialogRef<EditInspectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { inspection: InspectionResponse }
  ) {
    // Initialize form data with current inspection values
    this.formData = {
      company_name: data.inspection.company_name,
      item_inspected: data.inspection.item_inspected,
      notes: data.inspection.notes?.toString() || ''
    };
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    this.dialogRef.close(this.formData);
  }
} 
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-inspection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule
  ],
  template: `
    <h2 mat-dialog-title>Add New Inspection</h2>
    <form [formGroup]="inspectionForm" (ngSubmit)="onSubmit()">
      <div mat-dialog-content>
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Company Name</mat-label>
          <input matInput formControlName="company_name" required>
          <mat-error *ngIf="inspectionForm.get('company_name')?.hasError('required')">
            Company name is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Item Inspected</mat-label>
          <input matInput formControlName="item_inspected" required>
          <mat-error *ngIf="inspectionForm.get('item_inspected')?.hasError('required')">
            Item inspected is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="4"></textarea>
        </mat-form-field>
      </div>

      <div mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="!inspectionForm.valid">
          Add Inspection
        </button>
      </div>
    </form>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    textarea {
      min-height: 100px;
    }
  `]
})
export class AddInspectionDialogComponent {
  inspectionForm: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<AddInspectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: { jobsiteId: number },
    private fb: FormBuilder
  ) {
    this.inspectionForm = this.fb.group({
      company_name: ['', Validators.required],
      item_inspected: ['', Validators.required],
      notes: ['']
    });
  }

  onSubmit(): void {
    if (this.inspectionForm.valid) {
      this.dialogRef.close({
        ...this.inspectionForm.value,
        jobsite_id: this.data.jobsiteId
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
} 
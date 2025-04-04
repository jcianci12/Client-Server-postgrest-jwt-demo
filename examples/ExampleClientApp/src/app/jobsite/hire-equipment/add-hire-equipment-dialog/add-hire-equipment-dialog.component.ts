import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { HireEquipmentCreate } from '../../../api/api';

export interface AddHireEquipmentDialogData {
  jobsiteId: number;
}

@Component({
  selector: 'app-add-hire-equipment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>Add Hire Equipment</h2>
    <div mat-dialog-content>
      <form #equipmentForm="ngForm">
        <mat-form-field class="full-width">
          <mat-label>Equipment Name</mat-label>
          <input matInput [(ngModel)]="equipmentData.equipment_name" name="equipment_name" required>
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Supplier</mat-label>
          <input matInput [(ngModel)]="equipmentData.supplier" name="supplier" required>
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Hire Date</mat-label>
          <input matInput [matDatepicker]="hireDatePicker" [(ngModel)]="equipmentData.hire_date" name="hire_date" required>
          <mat-datepicker-toggle matSuffix [for]="hireDatePicker"></mat-datepicker-toggle>
          <mat-datepicker #hireDatePicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Return Date</mat-label>
          <input matInput [matDatepicker]="returnDatePicker" [(ngModel)]="equipmentData.return_date" name="return_date" required>
          <mat-datepicker-toggle matSuffix [for]="returnDatePicker"></mat-datepicker-toggle>
          <mat-datepicker #returnDatePicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Cost</mat-label>
          <input matInput type="number" [(ngModel)]="equipmentData.cost" name="cost" required>
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="equipmentData.status" name="status" required>
            <mat-option value="Active">Active</mat-option>
            <mat-option value="Returned">Returned</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput [(ngModel)]="equipmentData.notes" name="notes" rows="3"></textarea>
        </mat-form-field>
      </form>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="!equipmentForm.valid" (click)="onSubmit(equipmentForm)">Add</button>
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
  `]
})
export class AddHireEquipmentDialogComponent {
  equipmentData: any = {
    equipment_name: '',
    supplier: '',
    hire_date: new Date(),
    return_date: new Date(new Date().setDate(new Date().getDate() + 7)), // Default to 7 days from now
    cost: 0,
    status: 'Active',
    notes: ''
  };

  constructor(
    public dialogRef: MatDialogRef<AddHireEquipmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddHireEquipmentDialogData
  ) {}

  onSubmit(form: any): void {
    if (!form.valid) return;

    // Create the hire equipment data
    const hireEquipmentData = new HireEquipmentCreate({
      equipment_name: this.equipmentData.equipment_name,
      supplier: this.equipmentData.supplier,
      hire_date: this.formatDate(this.equipmentData.hire_date),
      return_date: this.formatDate(this.equipmentData.return_date),
      cost: this.equipmentData.cost,
      status: this.equipmentData.status,
      notes: this.equipmentData.notes || undefined,
      jobsite_id: this.data.jobsiteId
    });

    this.dialogRef.close(hireEquipmentData);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private formatDate(date: Date): string {
    return date.toISOString();
  }
} 
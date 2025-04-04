import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HireEquipmentResponse } from '../../api/api';

@Component({
  selector: 'app-hire-equipment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule,
    ReactiveFormsModule
  ],
  template: `
    <h2 mat-dialog-title>{{data.equipment ? 'Edit' : 'Add'}} Hire Equipment</h2>
    <mat-dialog-content>
      <form [formGroup]="equipmentForm" class="form-container">
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Item</mat-label>
          <input matInput formControlName="item" required>
          <mat-error *ngIf="equipmentForm.get('item')?.hasError('required')">
            Item is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Supplier Name</mat-label>
          <input matInput formControlName="supplier_name" required>
          <mat-error *ngIf="equipmentForm.get('supplier_name')?.hasError('required')">
            Supplier name is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Reference Number</mat-label>
          <input matInput formControlName="reference_number">
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Cost per Day</mat-label>
          <input matInput type="number" formControlName="cost_per_day">
          <mat-error *ngIf="equipmentForm.get('cost_per_day')?.hasError('min')">
            Cost must be positive
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>On Hire Date</mat-label>
          <input matInput [matDatepicker]="onHirePicker" formControlName="on_hire" required>
          <mat-datepicker-toggle matSuffix [for]="onHirePicker"></mat-datepicker-toggle>
          <mat-datepicker #onHirePicker></mat-datepicker>
          <mat-error *ngIf="equipmentForm.get('on_hire')?.hasError('required')">
            On hire date is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Expected Return Date</mat-label>
          <input matInput [matDatepicker]="expectedReturnPicker" formControlName="expected_return">
          <mat-datepicker-toggle matSuffix [for]="expectedReturnPicker"></mat-datepicker-toggle>
          <mat-datepicker #expectedReturnPicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Condition on Hire</mat-label>
          <textarea matInput formControlName="condition_on_hire" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" 
              [disabled]="!equipmentForm.valid"
              (click)="onSubmit()">
        {{data.equipment ? 'Update' : 'Add'}}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-container {
      display: flex;
      flex-direction: column;
      min-width: 350px;
      margin: 20px 0;
    }

    .full-width {
      width: 100%;
      margin-bottom: 15px;
    }
  `]
})
export class HireEquipmentDialogComponent implements OnInit {
  equipmentForm: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<HireEquipmentDialogComponent>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: { 
      jobsiteId: number,
      equipment?: HireEquipmentResponse 
    }
  ) {
    this.equipmentForm = this.fb.group({
      item: ['', Validators.required],
      supplier_name: ['', Validators.required],
      reference_number: [''],
      cost_per_day: [null, Validators.min(0)],
      on_hire: [new Date(), Validators.required],
      expected_return: [null],
      condition_on_hire: [''],
      status: ['Active']
    });
  }

  ngOnInit() {
    if (this.data?.equipment) {
      this.equipmentForm.patchValue({
        item: this.data.equipment.item,
        supplier_name: this.data.equipment['supplier_name'],
        reference_number: this.data.equipment['reference_number'],
        cost_per_day: this.data.equipment['cost_per_day'],
        on_hire: new Date(this.data.equipment.on_hire),
        expected_return: this.data.equipment['expected_return'] ? new Date(this.data.equipment['expected_return']) : null,
        condition_on_hire: this.data.equipment['condition_on_hire'],
        status: this.data.equipment['status']
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.equipmentForm.valid) {
      const formValue = this.equipmentForm.value;
      const result = {
        jobsite_id: this.data.jobsiteId,
        item: formValue.item,
        supplier_name: formValue.supplier_name,
        reference_number: formValue.reference_number,
        cost_per_day: formValue.cost_per_day,
        on_hire: formValue.on_hire.toISOString(),
        expected_return: formValue.expected_return ? formValue.expected_return.toISOString() : null,
        condition_on_hire: formValue.condition_on_hire,
        status: formValue.status
      };
      this.dialogRef.close(result);
    }
  }
} 
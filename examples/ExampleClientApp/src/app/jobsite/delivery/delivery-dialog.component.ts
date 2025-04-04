import { Component, Inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { DeliveryCreate, DeliveryResponse, DeliveryUpdate } from '../../api/api';

export interface DeliveryDialogData {
  delivery?: DeliveryResponse;
  jobsiteId: number;
  mode: 'create' | 'edit';
}

@Component({
  selector: 'app-delivery-dialog',
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
    <h2 mat-dialog-title>{{ data.mode === 'create' ? 'Record Delivery' : 'Edit Delivery' }}</h2>
    <div mat-dialog-content>
      <form #deliveryForm="ngForm">
        <mat-form-field class="full-width">
          <mat-label>Company Name</mat-label>
          <input matInput [(ngModel)]="deliveryData.company_name" name="company_name" required>
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Item</mat-label>
          <input matInput [(ngModel)]="deliveryData.item" name="item" required>
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Quantity</mat-label>
          <input matInput type="number" [(ngModel)]="deliveryData.qty" name="qty" required min="1">
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput [(ngModel)]="deliveryData.notes" name="notes" rows="3"></textarea>
        </mat-form-field>
      </form>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button type="button" (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" type="submit" 
              (click)="onSubmit(deliveryForm)"
              [disabled]="!deliveryForm.form.valid">
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
  `]
})
export class DeliveryDialogComponent {
  @ViewChild('deliveryForm') deliveryForm!: NgForm;

  deliveryData: Partial<DeliveryCreate | DeliveryUpdate> = {
    company_name: '',
    item: '',
    qty: 1,
    notes: undefined
  };

  constructor(
    public dialogRef: MatDialogRef<DeliveryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeliveryDialogData
  ) {
    if (data.mode === 'edit' && data.delivery) {
      this.deliveryData = {
        company_name: data.delivery.company_name,
        item: data.delivery.item,
        qty: data.delivery.qty,
        notes: data.delivery.notes
      };
    }
  }

  onSubmit(form: NgForm): void {
    if (!form.valid) return;

    if (this.data.mode === 'create') {
      const createData = DeliveryCreate.fromJS({
        ...this.deliveryData,
        jobsite_id: this.data.jobsiteId
      });
      this.dialogRef.close(createData);
    } else {
      const updateData = DeliveryUpdate.fromJS(this.deliveryData);
      this.dialogRef.close(updateData);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
} 
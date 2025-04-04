import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Client, DeliveryResponse, DeliveryCreate, DeliveryUpdate } from '../../api/api';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { UIStateService } from '../../services/ui-state.service';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { DeliveryDialogComponent } from './delivery-dialog.component';

@Component({
  selector: 'app-delivery',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatCardModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Deliveries</mat-card-title>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="openAddDialog()">
            <mat-icon>add</mat-icon>
            <span class="mdc-button__label">Record Delivery</span>
          </button>
        </div>
      </mat-card-header>
      <mat-card-content>
        <table mat-table [dataSource]="deliveries" class="full-width">
          <!-- Company Name Column -->
          <ng-container matColumnDef="companyName">
            <th mat-header-cell *matHeaderCellDef>Company</th>
            <td mat-cell *matCellDef="let element">{{element.company_name}}</td>
          </ng-container>

          <!-- Item Column -->
          <ng-container matColumnDef="item">
            <th mat-header-cell *matHeaderCellDef>Item</th>
            <td mat-cell *matCellDef="let element">{{element.item}}</td>
          </ng-container>

          <!-- Quantity Column -->
          <ng-container matColumnDef="quantity">
            <th mat-header-cell *matHeaderCellDef>Quantity</th>
            <td mat-cell *matCellDef="let element">{{element.qty}}</td>
          </ng-container>

          <!-- Notes Column -->
          <ng-container matColumnDef="notes">
            <th mat-header-cell *matHeaderCellDef>Notes</th>
            <td mat-cell *matCellDef="let element">{{element.notes}}</td>
          </ng-container>

          <!-- Date Column -->
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Date</th>
            <td mat-cell *matCellDef="let element">{{element.created_at | date:'short'}}</td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let element">
              <button mat-icon-button color="primary" (click)="openEditDialog(element)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteDelivery(element)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .header-actions {
      margin-left: auto;
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .full-width {
      width: 100%;
    }
    mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .mat-mdc-row .mat-mdc-cell {
      border-bottom: 1px solid transparent;
      border-top: 1px solid transparent;
    }
    .mat-mdc-row:hover .mat-mdc-cell {
      background-color: rgba(0, 0, 0, 0.04);
    }
  `]
})
export class DeliveryComponent implements OnInit {
  private client = inject(Client);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private uiStateService = inject(UIStateService);
  private route = inject(ActivatedRoute);

  deliveries: DeliveryResponse[] = [];
  displayedColumns: string[] = ['companyName', 'item', 'quantity', 'notes', 'date', 'actions'];
  jobsiteId: number = 0;

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (!params['id'] || isNaN(+params['id'])) {
        this.snackBar.open('Invalid jobsite ID', 'Close', { duration: 3000 });
        return;
      }
      this.jobsiteId = +params['id'];
      this.loadDeliveries();
    });
  }

  loadDeliveries() {
    if (!this.jobsiteId || isNaN(this.jobsiteId)) {
      this.snackBar.open('Invalid jobsite ID', 'Close', { duration: 3000 });
      return;
    }
    this.uiStateService.showLoading();
    this.client.get_deliveries_by_jobsite_api_deliveries_jobsite__jobsite_id__get(this.jobsiteId)
      .pipe(
        catchError(error => {
          console.error('Error loading deliveries:', error);
          this.snackBar.open('Error loading deliveries', 'Close', { duration: 3000 });
          return of([]);
        }),
        finalize(() => this.uiStateService.hideLoading())
      )
      .subscribe({
        next: (deliveries: DeliveryResponse[]) => {
          this.deliveries = deliveries;
        }
      });
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(DeliveryDialogComponent, {
      width: '500px',
      data: {
        mode: 'create',
        jobsiteId: this.jobsiteId
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result instanceof DeliveryCreate) {
        this.uiStateService.showLoading();
        this.client.create_delivery_api_deliveries__post(result)
          .pipe(
            catchError(error => {
              console.error('Error creating delivery:', error);
              this.snackBar.open('Error creating delivery', 'Close', { duration: 3000 });
              return of(null);
            }),
            finalize(() => this.uiStateService.hideLoading())
          )
          .subscribe({
            next: (response: DeliveryResponse | null) => {
              if (response) {
                this.snackBar.open('Delivery created successfully', 'Close', { duration: 3000 });
                this.loadDeliveries();
              }
            }
          });
      }
    });
  }

  openEditDialog(delivery: DeliveryResponse) {
    const dialogRef = this.dialog.open(DeliveryDialogComponent, {
      width: '500px',
      data: {
        mode: 'edit',
        delivery: delivery,
        jobsiteId: this.jobsiteId
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result instanceof DeliveryUpdate) {
        this.uiStateService.showLoading();
        this.client.update_delivery_api_deliveries__delivery_id__put(delivery.id, result)
          .pipe(
            catchError(error => {
              console.error('Error updating delivery:', error);
              this.snackBar.open('Error updating delivery', 'Close', { duration: 3000 });
              return of(null);
            }),
            finalize(() => this.uiStateService.hideLoading())
          )
          .subscribe({
            next: (response: DeliveryResponse | null) => {
              if (response) {
                this.snackBar.open('Delivery updated successfully', 'Close', { duration: 3000 });
                this.loadDeliveries();
              }
            }
          });
      }
    });
  }

  deleteDelivery(delivery: DeliveryResponse) {
    if (confirm('Are you sure you want to delete this delivery?')) {
      this.uiStateService.showLoading();
      this.client.delete_delivery_api_deliveries__delivery_id__delete(delivery.id)
        .pipe(
          catchError(error => {
            console.error('Error deleting delivery:', error);
            this.snackBar.open('Error deleting delivery', 'Close', { duration: 3000 });
            return of(null);
          }),
          finalize(() => this.uiStateService.hideLoading())
        )
        .subscribe({
          next: () => {
            this.snackBar.open('Delivery deleted successfully', 'Close', { duration: 3000 });
            this.loadDeliveries();
          }
        });
    }
  }
} 
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { StatusService } from '../../services/status.service';
import { Client, DeliveryResponse, DeliveryCreate, DeliveryUpdate } from '../../api/api';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { DeliveryDialogComponent } from '../delivery/delivery-dialog.component';

@Component({
  selector: 'app-deliveries',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="deliveries-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Deliveries</mat-card-title>
          <div class="header-actions">
            <button mat-raised-button color="primary" (click)="addDelivery()">
              <mat-icon>local_shipping</mat-icon>
              Record Delivery
            </button>
          </div>
        </mat-card-header>
        <mat-card-content>
          <mat-list *ngIf="deliveriesList.length > 0; else noDeliveries">
            <mat-list-item *ngFor="let delivery of deliveriesList" class="delivery-item">
              <div class="delivery-content">
                <div class="delivery-main">
                  <div class="delivery-header">
                    <span class="delivery-title">{{delivery['item']}}</span>
                    <span class="delivery-date">{{delivery['created_at'] | date:'short'}}</span>
                  </div>
                  
                  <div class="delivery-details">
                    <div class="detail-row">
                      <span class="label">Company:</span>
                      <span>{{delivery['company_name']}}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Quantity:</span>
                      <span>{{delivery['qty']}}</span>
                    </div>
                  </div>
                </div>

                <div class="delivery-actions">
                  <button mat-icon-button color="accent" (click)="editDelivery(delivery)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteDelivery(delivery)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
            </mat-list-item>
          </mat-list>

          <ng-template #noDeliveries>
            <mat-list>
              <mat-list-item>
                <mat-icon matListIcon>info</mat-icon>
                <div matListItemTitle>No deliveries found</div>
                <div matListItemLine>Record a delivery using the button above</div>
              </mat-list-item>
            </mat-list>
          </ng-template>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .deliveries-container {
      padding: 16px;
      max-width: 1200px;
      margin: 0 auto;
    }

    mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }

    .header-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    @media (max-width: 600px) {
      .deliveries-container {
        padding: 8px;
      }

      .header-actions {
        width: 100%;
        justify-content: space-between;
        margin-top: 8px;
      }

      button[mat-raised-button] {
        width: 100%;
      }
    }

    .delivery-item {
      margin: 8px 0;
      background: var(--mat-list-item-unselected-container-color);
      border-radius: 4px;
      height: auto !important;
      padding: 16px !important;
    }

    .delivery-content {
      display: flex;
      width: 100%;
      gap: 16px;
      align-items: flex-start;
    }

    .delivery-main {
      flex: 1;
    }

    .delivery-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
      flex-wrap: wrap;
      justify-content: space-between;
    }

    .delivery-title {
      font-size: 1.1rem;
      font-weight: 500;
    }

    .delivery-date {
      color: var(--mat-list-item-secondary-text-color);
      font-size: 0.9rem;
    }

    .delivery-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 8px;
    }

    .detail-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .label {
      color: var(--mat-list-item-secondary-text-color);
      font-weight: 500;
    }

    .delivery-actions {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    @media (max-width: 600px) {
      .delivery-content {
        flex-direction: column;
      }

      .delivery-actions {
        width: 100%;
        justify-content: flex-end;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid var(--mat-list-item-state-layer-color);
      }

      .delivery-details {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DeliveriesComponent implements OnInit {
  deliveriesList: DeliveryResponse[] = [];
  siteId?: number;

  constructor(
    private route: ActivatedRoute,
    private statusService: StatusService,
    private client: Client,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.route.parent?.params.subscribe({
      next: (params) => {
        const id = params['id'];
        if (id) {
          this.siteId = +id;
          this.loadDeliveries();
        }
      }
    });
  }

  loadDeliveries() {
    if (!this.siteId) return;
    
    this.statusService.showLoading();
    this.client.get_deliveries_by_jobsite_api_deliveries_jobsite__jobsite_id__get(this.siteId)
      .pipe(
        catchError(error => {
          console.error('Error loading deliveries:', error);
          this.snackBar.open('Error loading deliveries', 'Close', { duration: 3000 });
          return of([]);
        }),
        finalize(() => this.statusService.hideLoading())
      )
      .subscribe({
        next: (deliveries: DeliveryResponse[]) => {
          this.deliveriesList = deliveries;
        }
      });
  }

  addDelivery() {
    if (!this.siteId) return;

    const dialogRef = this.dialog.open(DeliveryDialogComponent, {
      width: '500px',
      data: { 
        mode: 'create',
        jobsiteId: this.siteId 
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result instanceof DeliveryCreate) {
        this.statusService.showLoading();
        this.client.create_delivery_api_deliveries__post(result)
          .pipe(
            catchError(error => {
              console.error('Error creating delivery:', error);
              this.snackBar.open('Error creating delivery', 'Close', { duration: 3000 });
              return of(null);
            }),
            finalize(() => this.statusService.hideLoading())
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

  editDelivery(delivery: DeliveryResponse) {
    const dialogRef = this.dialog.open(DeliveryDialogComponent, {
      width: '500px',
      data: { 
        mode: 'edit',
        delivery: delivery,
        jobsiteId: this.siteId
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result instanceof DeliveryUpdate) {
        this.statusService.showLoading();
        this.client.update_delivery_api_deliveries__delivery_id__put(delivery.id, result)
          .pipe(
            catchError(error => {
              console.error('Error updating delivery:', error);
              this.snackBar.open('Error updating delivery', 'Close', { duration: 3000 });
              return of(null);
            }),
            finalize(() => this.statusService.hideLoading())
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
      this.statusService.showLoading();
      this.client.delete_delivery_api_deliveries__delivery_id__delete(delivery.id)
        .pipe(
          catchError(error => {
            console.error('Error deleting delivery:', error);
            this.snackBar.open('Error deleting delivery', 'Close', { duration: 3000 });
            return of(null);
          }),
          finalize(() => this.statusService.hideLoading())
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
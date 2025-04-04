import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Client, HireEquipmentResponse, HireEquipmentCreate, HireEquipmentUpdate } from '../../api/api';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { UIStateService } from '../../services/ui-state.service';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { HireEquipmentDialogComponent } from './hire-equipment-dialog.component';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-hire-equipment',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatCardModule,
    MatChipsModule
  ],
  template: `
    <div class="equipment-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Hire Equipment</mat-card-title>
          <div class="header-actions">
            <button mat-raised-button color="primary" (click)="openAddDialog()">
              <mat-icon>add</mat-icon>
              Add Equipment
            </button>
            <button mat-raised-button color="accent" (click)="loadOverdueEquipment()">
              <mat-icon>warning</mat-icon>
              Show Overdue
            </button>
          </div>
        </mat-card-header>

        <mat-card-content>
          <mat-list *ngIf="hireEquipment.length > 0; else noEquipment">
            <mat-list-item *ngFor="let equipment of hireEquipment" class="equipment-item">
              <div class="equipment-content">
                <div class="equipment-main">
                  <div class="equipment-header">
                    <span class="equipment-title">{{equipment['item']}}</span>
                    <mat-chip [color]="equipment['status'] === 'Active' ? 'accent' : 'primary'" selected>
                      {{equipment['status']}}
                    </mat-chip>
                  </div>
                  
                  <div class="equipment-details">
                    <div class="detail-row">
                      <span class="label">Supplier:</span>
                      <span>{{equipment['supplier_name']}}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Reference:</span>
                      <span>{{equipment['reference_number']}}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Cost/Day:</span>
                      <span>{{equipment['cost_per_day'] | currency}}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">On Hire:</span>
                      <span>{{equipment['on_hire'] | date}}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Expected Return:</span>
                      <span>{{equipment['expected_return'] | date}}</span>
                    </div>
                  </div>
                </div>

                <div class="equipment-actions">
                  <button mat-icon-button color="primary" (click)="openEditDialog(equipment)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button 
                          [color]="equipment['status'] === 'Active' ? 'accent' : 'primary'"
                          (click)="updateStatus(equipment)"
                          [disabled]="equipment['status'] === 'Returned'">
                    <mat-icon>{{equipment['status'] === 'Active' ? 'check_circle' : 'restore'}}</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteHireEquipment(equipment.id)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
            </mat-list-item>
          </mat-list>

          <ng-template #noEquipment>
            <mat-list>
              <mat-list-item>
                <mat-icon matListIcon>info</mat-icon>
                <div matListItemTitle>No equipment found</div>
                <div matListItemLine>Add equipment using the button above</div>
              </mat-list-item>
            </mat-list>
          </ng-template>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .equipment-container {
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
      .equipment-container {
        padding: 8px;
      }

      .header-actions {
        width: 100%;
        justify-content: space-between;
        margin-top: 8px;
      }

      button[mat-raised-button] {
        flex: 1;
      }
    }

    .equipment-item {
      margin: 8px 0;
      background: var(--mat-list-item-unselected-container-color);
      border-radius: 4px;
      height: auto !important;
      padding: 16px !important;
    }

    .equipment-content {
      display: flex;
      width: 100%;
      gap: 16px;
      align-items: flex-start;
    }

    .equipment-main {
      flex: 1;
    }

    .equipment-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }

    .equipment-title {
      font-size: 1.1rem;
      font-weight: 500;
    }

    .equipment-details {
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

    .equipment-actions {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    @media (max-width: 600px) {
      .equipment-content {
        flex-direction: column;
      }

      .equipment-actions {
        width: 100%;
        justify-content: flex-end;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid var(--mat-list-item-state-layer-color);
      }

      .equipment-details {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class HireEquipmentComponent implements OnInit {
  hireEquipment: HireEquipmentResponse[] = [];
  jobsiteId: number = 0;

  constructor(
    private client: Client,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private uiStateService: UIStateService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Get the jobsite ID from the parent route parameters
    this.route.parent?.params.subscribe(params => {
      if (!params['id'] || isNaN(+params['id'])) {
        this.snackBar.open('Invalid jobsite ID', 'Close', { duration: 3000 });
        return;
      }
      this.jobsiteId = +params['id']; // Convert to number
      this.loadHireEquipment();
    });
  }

  loadHireEquipment() {
    if (!this.jobsiteId || isNaN(this.jobsiteId)) {
      this.snackBar.open('Invalid jobsite ID', 'Close', { duration: 3000 });
      return;
    }
    this.uiStateService.showLoading();
    this.client.get_hire_equipment_by_jobsite_api_hire_equipment_jobsite__jobsite_id___get(this.jobsiteId)
      .pipe(
        catchError(error => {
          console.error('Error loading hire equipment:', error);
          this.snackBar.open('Error loading hire equipment', 'Close', { duration: 3000 });
          return of([]);
        }),
        finalize(() => this.uiStateService.hideLoading())
      )
      .subscribe((equipment: HireEquipmentResponse[]) => {
        this.hireEquipment = equipment;
      });
  }

  loadOverdueEquipment() {
    if (!this.jobsiteId || isNaN(this.jobsiteId)) {
      this.snackBar.open('Invalid jobsite ID', 'Close', { duration: 3000 });
      return;
    }
    this.uiStateService.showLoading();
    this.client.get_hire_equipment_by_jobsite_api_hire_equipment_jobsite__jobsite_id___get(this.jobsiteId)
      .pipe(
        catchError(error => {
          console.error('Error loading overdue equipment:', error);
          this.snackBar.open('Error loading overdue equipment', 'Close', { duration: 3000 });
          return of([]);
        }),
        finalize(() => this.uiStateService.hideLoading())
      )
      .subscribe((equipment: HireEquipmentResponse[]) => {
        this.hireEquipment = equipment;
      });
  }

  updateStatus(equipment: HireEquipmentResponse) {
    const newStatus = equipment['status'] === 'Active' ? 'Returned' : 'Active';
    this.uiStateService.showLoading();
    const updateData = new HireEquipmentUpdate({ status: newStatus });
    this.client.update_hire_equipment_api_hire_equipment__hire_equipment_id___put(
      equipment.id,
      updateData
    )
      .pipe(
        catchError(error => {
          console.error('Error updating equipment status:', error);
          this.snackBar.open('Error updating equipment status', 'Close', { duration: 3000 });
          return of(null);
        }),
        finalize(() => this.uiStateService.hideLoading())
      )
      .subscribe((response: HireEquipmentResponse | null) => {
        if (response) {
          this.snackBar.open('Equipment status updated successfully', 'Close', { duration: 3000 });
          this.loadHireEquipment();
        }
      });
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(HireEquipmentDialogComponent, {
      width: '500px',
      data: { jobsiteId: this.jobsiteId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.uiStateService.showLoading();
        this.client.create_hire_equipment_api_hire_equipment__post(result)
          .pipe(
            catchError(error => {
              console.error('Error creating hire equipment:', error);
              this.snackBar.open('Error creating hire equipment', 'Close', { duration: 3000 });
              return of(null);
            }),
            finalize(() => this.uiStateService.hideLoading())
          )
          .subscribe((response: HireEquipmentResponse | null) => {
            if (response) {
              this.snackBar.open('Equipment added successfully', 'Close', { duration: 3000 });
              this.loadHireEquipment();
            }
          });
      }
    });
  }

  openEditDialog(equipment: HireEquipmentResponse) {
    const dialogRef = this.dialog.open(HireEquipmentDialogComponent, {
      width: '500px',
      data: { 
        jobsiteId: this.jobsiteId,
        equipment: equipment
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.uiStateService.showLoading();
        this.client.update_hire_equipment_api_hire_equipment__hire_equipment_id___put(equipment.id, result)
          .pipe(
            catchError(error => {
              console.error('Error updating hire equipment:', error);
              this.snackBar.open('Error updating hire equipment', 'Close', { duration: 3000 });
              return of(null);
            }),
            finalize(() => this.uiStateService.hideLoading())
          )
          .subscribe(response => {
            if (response) {
              this.snackBar.open('Hire equipment updated successfully', 'Close', { duration: 3000 });
              this.loadHireEquipment();
            }
          });
      }
    });
  }

  deleteHireEquipment(id: number) {
    if (confirm('Are you sure you want to delete this hire equipment?')) {
      this.uiStateService.showLoading();
      this.client.delete_hire_equipment_api_hire_equipment__hire_equipment_id___delete(id)
        .pipe(
          catchError(error => {
            console.error('Error deleting hire equipment:', error);
            this.snackBar.open('Error deleting hire equipment', 'Close', { duration: 3000 });
            return of(null);
          }),
          finalize(() => this.uiStateService.hideLoading())
        )
        .subscribe(response => {
          if (response !== null) {
            this.snackBar.open('Hire equipment deleted successfully', 'Close', { duration: 3000 });
            this.loadHireEquipment();
          }
        });
    }
  }
} 
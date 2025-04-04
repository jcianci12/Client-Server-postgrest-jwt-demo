import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { StatusService } from '../../services/status.service';
import { Client, InspectionResponse, InspectionCreate, InspectionUpdate } from '../../api/api';
import { AddInspectionDialogComponent } from './add-inspection-dialog/add-inspection-dialog.component';
import { EditInspectionDialogComponent } from './edit-inspection-dialog/edit-inspection-dialog.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-inspections',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="inspections-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Inspections</mat-card-title>
          <div class="header-actions">
            <button mat-raised-button color="primary" (click)="addInspection()">
              <mat-icon>add</mat-icon>
              Add Inspection
            </button>
          </div>
        </mat-card-header>
        <mat-card-content>
          <mat-list *ngIf="inspectionsList.length > 0; else noInspections">
            <mat-list-item *ngFor="let inspection of inspectionsList" class="inspection-item">
              <div class="inspection-content">
                <div class="inspection-main">
                  <div class="inspection-header">
                    <span class="inspection-title">{{inspection['item_inspected']}}</span>
                    <span class="inspection-date">{{inspection['created_at'] | date}}</span>
                  </div>
                  
                  <div class="inspection-details">
                    <div class="detail-row">
                      <span class="label">Company:</span>
                      <span>{{inspection['company_name']}}</span>
                    </div>
                    <div class="detail-row notes-row">
                      <span class="label">Notes:</span>
                      <span>{{inspection['notes']}}</span>
                    </div>
                  </div>
                </div>

                <div class="inspection-actions">
                  <button mat-icon-button color="primary" (click)="editInspection(inspection)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteInspection(inspection)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
            </mat-list-item>
          </mat-list>

          <ng-template #noInspections>
            <mat-list>
              <mat-list-item>
                <mat-icon matListIcon>info</mat-icon>
                <div matListItemTitle>No inspections found</div>
                <div matListItemLine>Add an inspection using the button above</div>
              </mat-list-item>
            </mat-list>
          </ng-template>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .inspections-container {
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
      .inspections-container {
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

    .inspection-item {
      margin: 8px 0;
      background: var(--mat-list-item-unselected-container-color);
      border-radius: 4px;
      height: auto !important;
      padding: 16px !important;
    }

    .inspection-content {
      display: flex;
      width: 100%;
      gap: 16px;
      align-items: flex-start;
    }

    .inspection-main {
      flex: 1;
    }

    .inspection-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
      flex-wrap: wrap;
      justify-content: space-between;
    }

    .inspection-title {
      font-size: 1.1rem;
      font-weight: 500;
    }

    .inspection-date {
      color: var(--mat-list-item-secondary-text-color);
      font-size: 0.9rem;
    }

    .inspection-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 8px;
    }

    .detail-row {
      display: flex;
      gap: 8px;
      align-items: flex-start;
    }

    .notes-row {
      grid-column: 1 / -1;
    }

    .label {
      color: var(--mat-list-item-secondary-text-color);
      font-weight: 500;
      min-width: 80px;
    }

    .inspection-actions {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    @media (max-width: 600px) {
      .inspection-content {
        flex-direction: column;
      }

      .inspection-actions {
        width: 100%;
        justify-content: flex-end;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid var(--mat-list-item-state-layer-color);
      }

      .inspection-details {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class InspectionsComponent implements OnInit {
  inspectionsList: InspectionResponse[] = [];
  siteId?: number;

  constructor(
    private route: ActivatedRoute,
    private statusService: StatusService,
    private client: Client,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    // Get the jobsite ID from the parent route parameters
    this.route.parent?.params.subscribe({
      next: (params) => {
        const id = params['id'];
        if (id) {
          this.siteId = +id;
          this.loadInspections();
        }
      }
    });
  }

  loadInspections() {
    if (!this.siteId) return;
    
    this.client.get_inspections_by_jobsite_api_inspections_jobsites__jobsite_id__inspections_get(this.siteId)
      .subscribe({
        next: (inspections: InspectionResponse[]) => {
          this.inspectionsList = inspections;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error loading inspections:', error);
          this.snackBar.open('Error loading inspections', 'Close', { duration: 3000 });
        }
      });
  }

  addInspection() {
    if (!this.siteId) return;

    const dialogRef = this.dialog.open(AddInspectionDialogComponent, {
      width: '500px',
      data: { jobsiteId: this.siteId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const newInspection = new InspectionCreate({
          company_name: result.company_name,
          item_inspected: result.item_inspected,
          notes: result.notes,
          jobsite_id: this.siteId!
        });

        this.client.create_inspection_api_inspections__post(newInspection)
          .subscribe({
            next: () => {
              this.loadInspections();
              this.snackBar.open('Inspection added successfully', 'Close', { duration: 3000 });
            },
            error: (error: HttpErrorResponse) => {
              console.error('Error creating inspection:', error);
              this.snackBar.open('Error creating inspection', 'Close', { duration: 3000 });
            }
          });
      }
    });
  }

  editInspection(inspection: InspectionResponse) {
    const dialogRef = this.dialog.open(EditInspectionDialogComponent, {
      width: '500px',
      data: { inspection }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const updatedInspection = new InspectionUpdate({
          company_name: result.company_name,
          item_inspected: result.item_inspected,
          notes: result.notes
        });

        this.client.update_inspection_api_inspections__inspection_id__put(inspection.id, updatedInspection)
          .subscribe({
            next: () => {
              this.loadInspections();
              this.snackBar.open('Inspection updated successfully', 'Close', { duration: 3000 });
            },
            error: (error: HttpErrorResponse) => {
              console.error('Error updating inspection:', error);
              this.snackBar.open('Error updating inspection', 'Close', { duration: 3000 });
            }
          });
      }
    });
  }

  deleteInspection(inspection: InspectionResponse) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Inspection',
        message: 'Are you sure you want to delete this inspection?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.client.delete_inspection_api_inspections__inspection_id__delete(inspection.id)
          .subscribe({
            next: () => {
              this.loadInspections();
              this.snackBar.open('Inspection deleted successfully', 'Close', { duration: 3000 });
            },
            error: (error: HttpErrorResponse) => {
              console.error('Error deleting inspection:', error);
              this.snackBar.open('Error deleting inspection', 'Close', { duration: 3000 });
            }
          });
      }
    });
  }
} 
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
import { Client, SubcontractorResponse } from '../../api/api';
import { SubcontractorDialogComponent } from './subcontractor-dialog.component';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { UnifiedCheckInDialogComponent, UnifiedCheckInDialogData } from '../../shared/unified-check-in-dialog.component';
import { CheckInResponse } from '../../api/api';

@Component({
  selector: 'app-subcontractors',
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
    <div class="subcontractors-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Subcontractors</mat-card-title>
          <div class="header-actions">
            <button mat-raised-button color="primary" (click)="addSubcontractor()">
              <mat-icon>engineering</mat-icon>
              Add Subcontractor
            </button>
          </div>
        </mat-card-header>
        <mat-card-content>
          <mat-list *ngIf="subcontractorsList.length > 0; else noSubcontractors">
            <mat-list-item *ngFor="let subcontractor of subcontractorsList" class="subcontractor-item">
              <div class="subcontractor-content">
                <div class="subcontractor-main">
                  <div class="subcontractor-header">
                    <span class="subcontractor-title">{{subcontractor['company_name']}}</span>
                    <span class="worker-count">{{subcontractor['qty_of_men']}} workers</span>
                  </div>
                  
                  <div class="subcontractor-details">
                    <div class="detail-row">
                      <span class="label">Start Time:</span>
                      <span>{{subcontractor['start_time'] | date:'shortTime'}}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Finish Time:</span>
                      <span>{{subcontractor['finish_time'] | date:'shortTime'}}</span>
                    </div>
                    <div class="detail-row notes-row">
                      <span class="label">Notes:</span>
                      <span>{{subcontractor['notes']}}</span>
                    </div>
                  </div>
                </div>

                <div class="subcontractor-actions">
                  <button mat-icon-button color="accent" (click)="editSubcontractor(subcontractor)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteSubcontractor(subcontractor)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
            </mat-list-item>
          </mat-list>

          <ng-template #noSubcontractors>
            <mat-list>
              <mat-list-item>
                <mat-icon matListIcon>info</mat-icon>
                <div matListItemTitle>No subcontractors found</div>
                <div matListItemLine>Add a subcontractor using the button above</div>
              </mat-list-item>
            </mat-list>
          </ng-template>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .subcontractors-container {
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
      .subcontractors-container {
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

    .subcontractor-item {
      margin: 8px 0;
      background: var(--mat-list-item-unselected-container-color);
      border-radius: 4px;
      height: auto !important;
      padding: 16px !important;
    }

    .subcontractor-content {
      display: flex;
      width: 100%;
      gap: 16px;
      align-items: flex-start;
    }

    .subcontractor-main {
      flex: 1;
    }

    .subcontractor-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
      flex-wrap: wrap;
      justify-content: space-between;
    }

    .subcontractor-title {
      font-size: 1.1rem;
      font-weight: 500;
    }

    .worker-count {
      font-size: 0.9rem;
      padding: 4px 8px;
      border-radius: 12px;
      background-color: var(--mat-blue-100);
      color: var(--mat-blue-900);
    }

    .subcontractor-details {
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

    .subcontractor-actions {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    @media (max-width: 600px) {
      .subcontractor-content {
        flex-direction: column;
      }

      .subcontractor-actions {
        width: 100%;
        justify-content: flex-end;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid var(--mat-list-item-state-layer-color);
      }

      .subcontractor-details {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SubcontractorsComponent implements OnInit {
  subcontractorsList: SubcontractorResponse[] = [];
  siteId?: number;
  jobsite?: any;

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
          this.loadSubcontractors();
        }
      }
    });
  }

  loadSubcontractors() {
    if (!this.siteId) return;
    
    this.statusService.setLoading(true);
    this.client.get_subcontractors_by_jobsite_api_subcontractors_jobsite__jobsite_id__get(this.siteId)
      .pipe(
        finalize(() => this.statusService.setLoading(false)),
        catchError(error => {
          this.snackBar.open('Error loading subcontractors', 'Close', { duration: 3000 });
          return of([]);
        })
      )
      .subscribe(subcontractors => {
        this.subcontractorsList = subcontractors;
      });
  }

  addSubcontractor() {
    if (!this.siteId) return;

    const dialogRef = this.dialog.open<UnifiedCheckInDialogComponent, UnifiedCheckInDialogData, CheckInResponse>(
      UnifiedCheckInDialogComponent,
      {
        data: {
          jobsiteId: this.siteId,
          mode: 'admin',
          type: 'contractor',
          jobsiteName: this.jobsite?.name
        },
        width: '500px'
      }
    );

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSubcontractors();
      }
    });
  }

  editSubcontractor(subcontractor: SubcontractorResponse) {
    if (!this.siteId) return;

    const dialogRef = this.dialog.open(SubcontractorDialogComponent, {
      data: {
        jobsiteId: this.siteId,
        mode: 'edit',
        subcontractor: subcontractor
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.statusService.setLoading(true);
        this.client.update_subcontractor_api_subcontractors__subcontractor_id__put(subcontractor.id, result)
          .pipe(
            finalize(() => this.statusService.setLoading(false)),
            catchError(error => {
              this.snackBar.open('Error updating subcontractor', 'Close', { duration: 3000 });
              return of(null);
            })
          )
          .subscribe(response => {
            if (response) {
              this.snackBar.open('Subcontractor updated successfully', 'Close', { duration: 3000 });
              this.loadSubcontractors();
            }
          });
      }
    });
  }

  deleteSubcontractor(subcontractor: SubcontractorResponse) {
    if (confirm('Are you sure you want to delete this subcontractor?')) {
      this.statusService.setLoading(true);
      this.client.delete_subcontractor_api_subcontractors__subcontractor_id__delete(subcontractor.id)
        .pipe(
          finalize(() => this.statusService.setLoading(false)),
          catchError(error => {
            this.snackBar.open('Error deleting subcontractor', 'Close', { duration: 3000 });
            return of(null);
          })
        )
        .subscribe(response => {
          this.snackBar.open('Subcontractor deleted successfully', 'Close', { duration: 3000 });
          this.loadSubcontractors();
        });
    }
  }
} 
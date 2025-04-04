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
import { Client, VisitorResponse, VisitorCreate, VisitorUpdate } from '../../api/api';
import { VisitorDialogComponent, VisitorDialogData } from './visitor-dialog.component';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { UnifiedCheckInDialogComponent, UnifiedCheckInDialogData } from '../../shared/unified-check-in-dialog.component';
import { CheckInResponse } from '../../api/api';

@Component({
  selector: 'app-visitors',
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
    <div class="visitors-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Visitors Log</mat-card-title>
          <div class="header-actions">
            <button mat-raised-button color="primary" (click)="signInVisitor()">
              <mat-icon>person_add</mat-icon>
              Sign In Visitor
            </button>
          </div>
        </mat-card-header>
        <mat-card-content>
          <mat-list *ngIf="visitorsList.length > 0; else noVisitors">
            <mat-list-item *ngFor="let visitor of visitorsList" class="visitor-item">
              <div class="visitor-content">
                <div class="visitor-main">
                  <div class="visitor-header">
                    <span class="visitor-title">{{visitor.name}}</span>
                    <span class="visitor-status" [class.signed-out]="visitor.finish_time">
                      {{visitor.finish_time ? 'Signed Out' : 'Active'}}
                    </span>
                  </div>
                  
                  <div class="visitor-details">
                    <div class="detail-row">
                      <span class="label">Company:</span>
                      <span>{{visitor.company_name}}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Sign In:</span>
                      <span>{{visitor.start_time | date:'short'}}</span>
                    </div>
                    <div class="detail-row" *ngIf="visitor.finish_time">
                      <span class="label">Sign Out:</span>
                      <span>{{getFinishTime(visitor) | date:'short'}}</span>
                    </div>
                  </div>
                </div>

                <div class="visitor-actions">
                  <button mat-icon-button color="primary" 
                          *ngIf="!visitor.finish_time"
                          (click)="signOutVisitor(visitor)">
                    <mat-icon>logout</mat-icon>
                  </button>
                  <button mat-icon-button color="accent" (click)="editVisitor(visitor)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteVisitor(visitor)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
            </mat-list-item>
          </mat-list>

          <ng-template #noVisitors>
            <mat-list>
              <mat-list-item>
                <mat-icon matListIcon>info</mat-icon>
                <div matListItemTitle>No visitors found</div>
                <div matListItemLine>Sign in a visitor using the button above</div>
              </mat-list-item>
            </mat-list>
          </ng-template>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .visitors-container {
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
      .visitors-container {
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

    .visitor-item {
      margin: 8px 0;
      background: var(--mat-list-item-unselected-container-color);
      border-radius: 4px;
      height: auto !important;
      padding: 16px !important;
    }

    .visitor-content {
      display: flex;
      width: 100%;
      gap: 16px;
      align-items: flex-start;
    }

    .visitor-main {
      flex: 1;
    }

    .visitor-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
      flex-wrap: wrap;
      justify-content: space-between;
    }

    .visitor-title {
      font-size: 1.1rem;
      font-weight: 500;
    }

    .visitor-status {
      font-size: 0.9rem;
      padding: 4px 8px;
      border-radius: 12px;
      background-color: var(--mat-green-100);
      color: var(--mat-green-900);
      
      &.signed-out {
        background-color: var(--mat-gray-100);
        color: var(--mat-gray-900);
      }
    }

    .visitor-details {
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

    .visitor-actions {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    @media (max-width: 600px) {
      .visitor-content {
        flex-direction: column;
      }

      .visitor-actions {
        width: 100%;
        justify-content: flex-end;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid var(--mat-list-item-state-layer-color);
      }

      .visitor-details {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class VisitorsComponent implements OnInit {
  visitorsList: VisitorResponse[] = [];
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
          this.loadVisitors();
        }
      }
    });
  }

  getFinishTime(visitor: VisitorResponse): Date | null {
    if (!visitor.finish_time) return null;
    // The finish_time is stored as a string in the custom type
    const timeStr = visitor.finish_time.toString();
    return new Date(timeStr);
  }

  loadVisitors() {
    if (!this.siteId) return;
    
    this.statusService.showLoading();
    this.client.get_visitors_api_visitors__get()
      .pipe(
        catchError(error => {
          this.snackBar.open('Error loading visitors', 'Close', { duration: 3000 });
          return of([]);
        }),
        finalize(() => this.statusService.hideLoading())
      )
      .subscribe(visitors => {
        // Filter visitors for this jobsite
        this.visitorsList = visitors.filter(v => v.jobsite_id === this.siteId);
      });
  }

  signInVisitor() {
    if (!this.siteId) return;

    const dialogRef = this.dialog.open<UnifiedCheckInDialogComponent, UnifiedCheckInDialogData, CheckInResponse>(
      UnifiedCheckInDialogComponent,
      {
        data: {
          jobsiteId: this.siteId,
          mode: 'admin',
          type: 'visitor',
          jobsiteName: this.jobsite?.name
        },
        width: '500px'
      }
    );

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh the visitors list after successful check-in
        this.loadVisitors();
      }
    });
  }

  signOutVisitor(visitor: VisitorResponse) {
    const updateData = VisitorUpdate.fromJS({
      name: visitor.name,
      company_name: visitor.company_name,
      start_time: visitor.created_at,
      finish_time: new Date().toISOString(),
      notes: visitor.notes
    });

    this.statusService.showLoading();
    this.client.update_visitor_api_visitors__visitor_id__put(visitor.id, updateData)
      .pipe(
        catchError(error => {
          this.snackBar.open('Error signing out visitor', 'Close', { duration: 3000 });
          return of(null);
        }),
        finalize(() => this.statusService.hideLoading())
      )
      .subscribe(response => {
        if (response) {
          this.snackBar.open('Visitor signed out successfully', 'Close', { duration: 3000 });
          this.loadVisitors();
        }
      });
  }

  editVisitor(visitor: VisitorResponse) {
    const dialogRef = this.dialog.open<VisitorDialogComponent, VisitorDialogData, VisitorUpdate>(
      VisitorDialogComponent,
      {
        data: {
          mode: 'edit',
          visitor: visitor,
          jobsiteId: visitor.jobsite_id
        }
      }
    );

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.statusService.showLoading();
        this.client.update_visitor_api_visitors__visitor_id__put(visitor.id, result)
          .pipe(
            catchError(error => {
              this.snackBar.open('Error updating visitor', 'Close', { duration: 3000 });
              return of(null);
            }),
            finalize(() => this.statusService.hideLoading())
          )
          .subscribe(response => {
            if (response) {
              this.snackBar.open('Visitor updated successfully', 'Close', { duration: 3000 });
              this.loadVisitors();
            }
          });
      }
    });
  }

  deleteVisitor(visitor: VisitorResponse) {
    if (confirm('Are you sure you want to delete this visitor record?')) {
      this.statusService.showLoading();
      this.client.delete_visitor_api_visitors__visitor_id__delete(visitor.id)
        .pipe(
          catchError(error => {
            this.snackBar.open('Error deleting visitor', 'Close', { duration: 3000 });
            return of(null);
          }),
          finalize(() => this.statusService.hideLoading())
        )
        .subscribe(response => {
          this.snackBar.open('Visitor deleted successfully', 'Close', { duration: 3000 });
          this.loadVisitors();
        });
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { 
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  }
} 
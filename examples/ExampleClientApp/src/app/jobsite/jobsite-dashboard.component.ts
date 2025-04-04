import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StatusService } from '../services/status.service';
import { finalize, Subscription } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Client, JobsiteResponse, UserRole } from '../api/api';
import { Router } from '@angular/router';
import { RolesService } from '../services/roles.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { MatSelectChange } from '@angular/material/select';
import { MatSelectModule } from '@angular/material/select';
import { WeatherForecastComponent } from '../shared/weather-forecast.component';

@Component({
  selector: 'app-jobsite-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatExpansionModule,
    MatChipsModule,
    MatButtonToggleModule,
    FormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatSelectModule,
    WeatherForecastComponent
  ],
  template: `
    <div class="jobsite-dashboard-container">
      <mat-card class="mat-mdc-card">
        <mat-card-header>
          <mat-card-title class="dashboard-title">
            <span class="title-text">Jobsites</span>
            <span class="role-badge">{{currentRole}}</span>
          </mat-card-title>
          <div class="header-actions">
            <button mat-raised-button
                    color="primary"
                    (click)="addJobsite()">
              <mat-icon>add</mat-icon>
              <span class="button-text">Add Jobsite</span>
            </button>
          </div>
        </mat-card-header>

        <!-- Search and Filter Controls -->
        <div class="controls-container">
          <mat-form-field class="search-field">
            <mat-label>Search jobsites</mat-label>
            <input matInput
                   [ngModel]="searchTerm"
                   (ngModelChange)="onSearchChange($event)"
                   placeholder="Search by name or address">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          <mat-form-field class="status-filter">
            <mat-label>Status Filter</mat-label>
            <mat-select multiple [value]="selectedStatuses" (selectionChange)="onStatusFilterChange($event)">
              <mat-option value="active">Active</mat-option>
              <mat-option value="inactive">Inactive</mat-option>
              <mat-option value="completed">Completed</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <mat-card-content>
          <div class="jobsites-grid">
            <mat-card *ngFor="let jobsite of jobsites" class="mat-mdc-card jobsite-card">
              <mat-card-header>
                <mat-card-title class="jobsite-title">
                  <span>{{jobsite.name}}</span>
                  <div class="card-actions">
                    <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="Actions">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #menu="matMenu">
                      <button mat-menu-item (click)="editJobsite(jobsite)">
                        <mat-icon>edit</mat-icon>
                        <span>Edit</span>
                      </button>
                      <button mat-menu-item
                              *ngIf="currentRole === UserRole.System_admin"
                              (click)="deleteJobsite(jobsite)"
                              color="warn">
                        <mat-icon>delete</mat-icon>
                        <span>Delete</span>
                      </button>
                    </mat-menu>
                  </div>
                </mat-card-title>
              </mat-card-header>

              <mat-card-content>
                <div class="content-with-weather">
                  <div class="jobsite-info">
                    <p class="jobsite-address">{{jobsite.address}}</p>
                    <p class="status-label" [class]="'status-' + (jobsite.status.toLowerCase() || 'unknown')">
                      {{jobsite.status || 'Unknown'}}
                    </p>
                  </div>

                  <!-- Weather Widget -->
                  <div *ngIf="jobsite.latitude && jobsite.longitude" class="weather-widget">
                    <app-weather-forecast
                      [latitude]="getNumberValue(jobsite.latitude)"
                      [longitude]="getNumberValue(jobsite.longitude)"
                      [compact]="true"
                      [showDescription]="false">
                    </app-weather-forecast>
                  </div>
                </div>

                <!-- QR Code Expansion Panel - Temporarily hidden -->
                <!--
                <mat-expansion-panel class="qr-code-panel">
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon>qr_code</mat-icon>
                      <span>QR Code</span>
                    </mat-panel-title>
                  </mat-expansion-panel-header>
                -->

                <!-- Mobile-friendly action buttons -->
                <div class="quick-actions">
                  <div class="primary-actions">
                    <button mat-button (click)="navigateTo(jobsite, 'overview')" class="quick-action">
                      <mat-icon>visibility</mat-icon>
                      <span>Overview</span>
                    </button>
                    <button mat-button (click)="navigateTo(jobsite, 'diary')" class="quick-action">
                      <mat-icon>book</mat-icon>
                      <span>Diary</span>
                    </button>
                  </div>

                  <!-- More actions menu for mobile -->
                  <button mat-button [matMenuTriggerFor]="actionsMenu" class="more-actions-button">
                    <mat-icon>more_horiz</mat-icon>
                    <span>More</span>
                  </button>
                  <mat-menu #actionsMenu="matMenu" class="actions-menu">
                    <button mat-menu-item (click)="navigateTo(jobsite, 'equipment')">
                      <mat-icon>construction</mat-icon>
                      <span>Equipment</span>
                    </button>
                    <button mat-menu-item (click)="navigateTo(jobsite, 'inspections')">
                      <mat-icon>checklist</mat-icon>
                      <span>Inspections</span>
                    </button>
                    <button mat-menu-item (click)="navigateTo(jobsite, 'visitors')">
                      <mat-icon>people</mat-icon>
                      <span>Visitors</span>
                    </button>
                    <button mat-menu-item (click)="navigateTo(jobsite, 'deliveries')">
                      <mat-icon>local_shipping</mat-icon>
                      <span>Deliveries</span>
                    </button>
                    <button mat-menu-item (click)="navigateTo(jobsite, 'subcontractors')">
                      <mat-icon>engineering</mat-icon>
                      <span>Subcontractors</span>
                    </button>
                    <button mat-menu-item (click)="navigateTo(jobsite, 'photos')">
                      <mat-icon>photo_library</mat-icon>
                      <span>Photos</span>
                    </button>
                  </mat-menu>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <!-- No results message -->
          <div *ngIf="jobsites.length === 0 && !error" class="no-jobsites">
            <p *ngIf="isFiltering">No jobsites match your search criteria.</p>
            <p *ngIf="!isFiltering">No jobsites found. Click the button above to add your first jobsite.</p>
          </div>

          <!-- Error message -->
          <div *ngIf="error" class="error-message">
            {{error}}
          </div>

          <!-- Pagination -->
          <mat-paginator
            [length]="totalItems"
            [pageSize]="pageSize"
            [pageIndex]="currentPage"
            [pageSizeOptions]="[5, 10, 25, 50]"
            (page)="onPageChange($event)"
            aria-label="Select page">
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .jobsite-dashboard-container {
      padding: 80px 16px 16px; /* Added top padding to account for fixed navbar */
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Main card styling with blur effect */
    .mat-mdc-card {
      background: rgba(255, 255, 255, 0.48) !important;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }

    /* Individual jobsite cards styling */
    .jobsite-card {
      background: rgba(255, 255, 255, 0.9) !important;
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      margin-bottom: 16px;
      height: 100%;
      position: relative;
    }

    .jobsite-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .dashboard-title {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .role-badge {
      font-size: 0.8em;
      background: rgba(0, 0, 0, 0.08);
      padding: 4px 8px;
      border-radius: 12px;
      white-space: nowrap;
    }

    .header-actions {
      margin-left: auto;
    }

    @media (max-width: 600px) {
      .jobsite-dashboard-container {
        padding-top: 72px; /* Adjusted for mobile navbar height */
      }

      .button-text {
        display: none;
      }

      .header-actions button {
        min-width: 40px;
        padding: 0 12px;
      }
    }

    .jobsites-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .jobsite-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      font-size: 1.1rem;
      margin-bottom: 8px;
    }

    .jobsite-address {
      font-size: 0.9rem;
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 8px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-actions {
      display: flex;
      gap: 4px;
    }

    .status-label {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.9rem;
      font-weight: 500;
      margin-bottom: 12px;
    }

    .status-active { color: #4caf50; }
    .status-inactive { color: #f44336; }
    .status-completed { color: #2196f3; }

    .error-message {
      color: red;
      padding: 16px;
      margin-top: 16px;
      background: rgba(255, 0, 0, 0.1);
      border-radius: 4px;
    }

    .no-jobsites {
      text-align: center;
      padding: 32px;
      color: rgba(0, 0, 0, 0.6);
      background: rgba(0, 0, 0, 0.04);
      border-radius: 4px;
    }

    .quick-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 16px;
    }

    .primary-actions {
      display: flex;
      gap: 8px;
    }

    .quick-action {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      color: rgba(0, 0, 0, 0.6);
      padding: 8px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .quick-action:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .more-actions-button {
      width: 100%;
      color: rgba(0, 0, 0, 0.6);
    }

    .qr-code-panel {
      margin: 16px 0;
    }

    .qr-code-panel .mat-expansion-panel-header-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    @media (min-width: 601px) {
      .more-actions-button {
        display: none;
      }

      .quick-actions {
        flex-direction: row;
        flex-wrap: wrap;
      }

      .primary-actions {
        flex: 1;
        flex-wrap: wrap;
      }

      .quick-action {
        flex: 0 1 auto;
      }
    }

    /* Touch-friendly improvements */
    @media (hover: none) {
      .quick-action, .more-actions-button {
        min-height: 48px;
      }

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }

    .content-with-weather {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }

    .jobsite-info {
      flex: 1;
    }

    /* Weather widget styles */
    .weather-widget {
      flex-shrink: 0;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 6px;
      padding: 4px 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .weather-widget:hover {
      background: rgba(255, 255, 255, 0.95);
      box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
    }

    @media (max-width: 600px) {
      .content-with-weather {
        flex-direction: column;
      }

      .weather-widget {
        align-self: flex-end;
      }
    }

    .controls-container {
      padding: 16px;
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .search-field {
      flex: 1;
      min-width: 200px;
    }

    .status-filter {
      min-width: 200px;
    }
  `]
})
export class JobsiteDashboardComponent implements OnInit, OnDestroy {
  jobsites: JobsiteResponse[] = [];
  error?: string;
  currentRole: UserRole | null = null;
  private roleSubscription: Subscription;
  UserRole = UserRole;
  searchTerm = '';
  selectedStatuses: string[] = [];
  pageSize = 5;
  currentPage = 0;
  totalItems = 0;
  isFiltering = false;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private statusService: StatusService,
    private dialog: MatDialog,
    private client: Client,
    private router: Router,
    private rolesService: RolesService
  ) {
    this.roleSubscription = this.rolesService.currentRole$.subscribe(role => {
      this.currentRole = role;
    });

    // Setup search debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 0; // Reset to first page on new search
      this.loadJobsites();
    });
  }

  ngOnInit() {
    this.loadJobsites();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.roleSubscription) {
      this.roleSubscription.unsubscribe();
    }
  }

  loadJobsites() {
    this.statusService.showLoading();
    this.isFiltering = !!(this.searchTerm || this.selectedStatuses.length);

    this.client.get_jobsites_api_jobsites_get()
      .pipe(finalize(() => this.statusService.hideLoading()))
      .subscribe({
        next: (response) => {
          // Filter jobsites based on status and search term
          let filteredJobsites = [...response];

          if (this.selectedStatuses.length > 0) {
            filteredJobsites = filteredJobsites.filter(j =>
              this.selectedStatuses.includes(j.status)
            );
          }

          if (this.searchTerm) {
            const searchLower = this.searchTerm.toLowerCase();
            filteredJobsites = filteredJobsites.filter(j =>
              j.name.toLowerCase().includes(searchLower) ||
              j.address.toLowerCase().includes(searchLower)
            );
          }

          // Apply pagination
          const start = this.currentPage * this.pageSize;
          const end = start + this.pageSize;
          this.totalItems = filteredJobsites.length;
          this.jobsites = filteredJobsites.slice(start, end);
        },
        error: (error) => {
          console.error('Error loading jobsites:', error);
          this.error = 'Failed to load jobsites. Please try again.';
        }
      });
  }

  onSearchChange(term: string) {
    this.searchTerm = term;
    this.searchSubject.next(term);
  }

  onStatusFilterChange(event: MatSelectChange) {
    this.selectedStatuses = event.value;
    this.currentPage = 0; // Reset to first page on filter change
    this.loadJobsites();
  }

  onPageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.loadJobsites();
  }

  addJobsite() {
    this.router.navigate(['/jobsites/create']);
  }

  editJobsite(jobsite: JobsiteResponse) {
    this.router.navigate(['/jobsites', jobsite.id, 'edit']);
  }

  viewJobsite(jobsite: JobsiteResponse) {
    this.router.navigate(['/jobsites', jobsite.id]);
  }

  navigateTo(jobsite: JobsiteResponse, route: string): void {
    this.router.navigate(['/jobsites', jobsite.id, route]);
  }

  deleteJobsite(jobsite: JobsiteResponse) {
    if (confirm(`Are you sure you want to delete the jobsite "${jobsite.name}"?`)) {
      this.statusService.showLoading();

      this.client.delete_jobsite_api_jobsites__jobsite_id__delete(jobsite.id)
        .pipe(finalize(() => this.statusService.hideLoading()))
        .subscribe({
          next: () => {
            this.statusService.showMessage('Jobsite deleted successfully');
            this.loadJobsites(); // Reload the list
          },
          error: (error) => {
            console.error('Error deleting jobsite:', error);
            this.statusService.showMessage('Failed to delete jobsite');
          }
        });
    }
  }

  getNumberValue(value: any): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    // Handle any other type by attempting to convert to string first
    const parsed = parseFloat(String(value));
    return isNaN(parsed) ? 0 : parsed;
  }
}

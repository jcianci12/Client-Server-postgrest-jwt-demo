import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UIStateService } from '../../services/ui-state.service';
import { finalize } from 'rxjs';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  Client,
  DiaryEntryResponse,
  JobsiteResponse,
  PhotoResponse,
  ApiException,
  API_BASE_URL
} from '../../api/api';
import { CreateDiaryEntryDialogComponent } from './create-diary-entry-dialog.component';
import { PhotoService } from './photo.service';
import { EditDiaryEntryDialogComponent } from './edit-diary-entry-dialog.component';
import { ViewDiaryEntryDialogComponent } from './view-diary-entry-dialog.component';
import { trigger, state, style, transition, animate } from '@angular/animations';

interface DiaryEntriesResponse {
  items: DiaryEntryResponse[];
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// Use type instead of interface to avoid the "equivalent to its supertype" error
type EntryPhotos = Record<number, PhotoWithBlob[]>;

interface PhotoWithBlob extends PhotoResponse {
  blobUrl?: string;
}

// Use Record type instead of index signature
type Weather = Record<string, string | number | null>;

@Component({
  selector: 'app-diary',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatPaginatorModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <div class="diary-container">
      <mat-card class="mat-mdc-card">
        <mat-card-header>
          <mat-card-title>Site Diary - {{jobsite?.name}}</mat-card-title>

          <!-- Mobile Filter Toggle -->
          <button mat-icon-button
                  class="filter-toggle"
                  (click)="toggleFilters()"
                  [attr.aria-expanded]="isFilterExpanded">
            <mat-icon>{{ isFilterExpanded ? 'expand_less' : 'filter_list' }}</mat-icon>
          </button>

          <div class="header-actions">
            <button mat-mini-fab
                    color="primary"
                    (click)="createEntry()"
                    class="action-fab"
                    aria-label="Create new entry">
              <mat-icon>add</mat-icon>
            </button>
            <button mat-mini-fab
                    color="accent"
                    (click)="exportEntries()"
                    [disabled]="entriesArray.length === 0"
                    class="action-fab"
                    aria-label="Export entries">
              <mat-icon>download</mat-icon>
            </button>
            <button mat-mini-fab
                    (click)="goBack()"
                    class="action-fab"
                    aria-label="Go back">
              <mat-icon>arrow_back</mat-icon>
            </button>
          </div>
        </mat-card-header>

        <mat-card-content>
          <!-- Search Form with Animation -->
          <div class="search-form" [class.collapsed]="!isFilterExpanded" [@expandCollapse]="isFilterExpanded ? 'expanded' : 'collapsed'">
            <div class="search-row">
              <mat-form-field appearance="outline" class="search-field">
                <mat-label>Search entries</mat-label>
                <input matInput [(ngModel)]="searchTerm" (ngModelChange)="onSearchChange()">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>
            </div>

            <div class="date-filters">
              <mat-form-field appearance="outline">
                <mat-label>Start date</mat-label>
                <input matInput type="date" [(ngModel)]="startDate" (ngModelChange)="onSearchChange()">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>End date</mat-label>
                <input matInput type="date" [(ngModel)]="endDate" (ngModelChange)="onSearchChange()">
              </mat-form-field>
            </div>
          </div>

          <mat-list class="mat-mdc-list" *ngIf="entriesArray.length > 0; else noEntries">
            <mat-list-item *ngFor="let entry of entriesArray"
                          class="mat-mdc-list-item"
                          (click)="viewEntry(entry)">
              <div class="diary-entry-content">
                <div class="diary-entry-main">
                  <mat-icon matListIcon>event_note</mat-icon>
                  <div matListItemTitle>
                    {{entry.date | date:'MMM d, y h:mm a'}}
                  </div>
                  <div matListItemLine>
                    Weather: {{entry.weather ? formatWeather(entry.weather) : 'Not recorded'}}
                  </div>
                  <div matListItemLine *ngIf="entry.id">
                    Work completed: {{entry.work_completed}}
                  </div>
                  <div matListItemLine *ngIf="entry.id">
                    Comments: {{entry.notes}}
                  </div>
                </div>

                <div class="photo-thumbnails" *ngIf="entryPhotos[entry.id!]?.length">
                  <div class="thumbnail"
                       *ngFor="let photo of entryPhotos[entry.id!].slice(0, 3)"
                       [style.backgroundImage]="'url(' + (photo.blobUrl || '') + ')'">
                  </div>
                  <div class="photo-count" *ngIf="entryPhotos[entry.id!].length > 3">
                    +{{entryPhotos[entry.id!].length - 3}}
                  </div>
                </div>

                <div class="entry-actions"
                     tabindex="0"
                     role="group"
                     aria-label="Entry actions"
                     (click)="$event.stopPropagation()"
                     (keydown.enter)="$event.stopPropagation()">
                  <button mat-icon-button
                          color="primary"
                          (click)="editEntry(entry)"
                          class="action-button">
                    <mat-icon>edit</mat-icon>
                  </button>
                </div>
              </div>
            </mat-list-item>
          </mat-list>

          <ng-template #noEntries>
            <mat-list class="mat-mdc-list">
              <mat-list-item class="mat-mdc-list-item">
                <mat-icon matListIcon>info</mat-icon>
                <div matListItemTitle>No diary entries found</div>
                <div matListItemLine>Try adjusting your search criteria or create a new entry</div>
              </mat-list-item>
            </mat-list>
          </ng-template>

          <!-- Paginator -->
          <mat-paginator
            [length]="totalEntries"
            [pageSize]="perPage"
            [pageIndex]="currentPage - 1"
            [pageSizeOptions]="[5, 10, 25, 50]"
            (page)="handlePageEvent($event)"
            *ngIf="totalEntries > 0">
          </mat-paginator>
        </mat-card-content>
      </mat-card>

      <div *ngIf="error" class="error-message">
        {{error}}
      </div>
    </div>
  `,
  styles: [`
    .diary-container {
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

    .action-fab {
      width: 40px;
      height: 40px;
      line-height: 40px;
    }

    .action-fab .mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      line-height: 20px;
    }

    .filter-toggle {
      display: block;
      margin-left: auto;
      margin-right: 8px;
    }

    .search-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 20px;
      overflow: hidden;
      background-color: var(--mat-card-background-color);
      padding: 16px;
      border-radius: 4px;
    }

    .search-row {
      width: 100%;
    }

    .search-field {
      width: 100%;
    }

    .date-filters {
      display: flex;
      gap: 16px;
      width: 100%;
    }

    .date-filters mat-form-field {
      flex: 1;
    }

    @media (max-width: 600px) {
      .diary-container {
        padding: 8px;
      }

      mat-card-header {
        padding: 8px;
      }

      .filter-toggle {
        display: block;
        order: 2;
        margin-left: 0;
        margin-right: 0;
      }

      .header-actions {
        order: 3;
        width: 100%;
        justify-content: space-around;
        margin-top: 8px;
      }

      .search-form {
        padding: 8px;
        margin: 0;
        height: auto;
        opacity: 1;
        visibility: visible;
      }

      .search-form.collapsed {
        height: 0;
        opacity: 0;
        visibility: hidden;
        padding: 0;
        margin: 0;
      }

      .date-filters {
        flex-direction: column;
        gap: 8px;
      }

      mat-form-field {
        margin-bottom: -8px;
      }
    }

    .mat-mdc-list-item {
      margin: 8px 0;
      background: var(--mat-list-item-unselected-container-color);
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s ease;

      &:hover {
        background: var(--mat-list-item-hover-state-layer-color);
      }
    }
    .mat-mdc-list-item-title {
      font-weight: 500;
    }
    .diary-entry-content {
      display: flex;
      width: 100%;
      gap: 16px;
      align-items: flex-start;
    }
    .diary-entry-main {
      flex: 1;
    }
    .photo-thumbnails {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .thumbnail {
      width: 60px;
      height: 60px;
      border-radius: 4px;
      background-size: cover;
      background-position: center;
      background-color: var(--mat-list-item-unselected-container-color);
    }
    .photo-count {
      background: var(--mat-list-item-unselected-container-color);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      color: var(--mat-list-item-secondary-text-color);
    }
    .error-message {
      color: var(--mat-red-500);
      margin-top: 16px;
      text-align: center;
    }
    .edit-button {
      margin-left: 8px;
    }
    mat-paginator {
      margin-top: 16px;
    }
    .entry-actions {
      display: flex;
      gap: 4px;
    }
    .action-button {
      margin-left: 4px;
    }
  `],
  animations: [
    trigger('expandCollapse', [
      state('expanded', style({
        height: '*',
        opacity: 1,
        visibility: 'visible',
        padding: '16px'
      })),
      state('collapsed', style({
        height: '0',
        opacity: 0,
        visibility: 'hidden',
        padding: '0'
      })),
      transition('expanded <=> collapsed', [
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ])
    ])
  ]
})
export class DiaryComponent implements OnInit, OnDestroy {
  jobsite?: JobsiteResponse;
  error?: string;
  entryPhotos: EntryPhotos = {};
  entriesArray: DiaryEntryResponse[] = [];
  siteId?: number;

  // Pagination
  currentPage = 1;
  perPage = 10;
  totalEntries = 0;
  totalPages = 0;
  hasNextPage = false;
  hasPrevPage = false;

  // Search params
  searchTerm = '';
  startDate = '';
  endDate = '';
  searchTimeout: ReturnType<typeof setTimeout> | null = null;

  private baseUrl: string;

  isFilterExpanded = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private uiStateService: UIStateService,
    private dialog: MatDialog,
    private client: Client,
    private photoService: PhotoService,
    private http: HttpClient,
    @Inject(API_BASE_URL) baseUrl: string
  ) {
    this.baseUrl = baseUrl;
  }

  ngOnDestroy() {
    // Clean up blob URLs
    Object.values(this.entryPhotos).forEach(photos => {
      photos.forEach(photo => {
        if (photo.blobUrl) {
          this.photoService.revokePhotoUrl(photo.blobUrl);
        }
      });
    });

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  private loadPhotoUrl(photo: PhotoResponse): void {
    if (photo.filename) {
      this.photoService.getPhotoUrl(photo.filename).subscribe(url => {
        (photo as PhotoWithBlob).blobUrl = url;
      });
    }
  }

  ngOnInit() {
    this.route.parent?.params.subscribe({
      next: (params) => {
        const id = params['id'];
        if (id) {
          this.siteId = +id;
          console.log('DiaryComponent: Loading diary entries for site:', this.siteId);
          this.loadEntries();
        } else {
          console.error('DiaryComponent: No jobsite ID found in route parameters');
          this.error = 'No jobsite ID found';
        }
      },
      error: (error) => {
        console.error('DiaryComponent: Error getting route parameters:', error);
        this.error = 'Error loading diary entries';
      }
    });

    this.route.parent?.data.subscribe({
      next: (data) => {
        if (data['jobsite']) {
          this.jobsite = data['jobsite'];
          console.log('DiaryComponent: Got jobsite data from parent:', this.jobsite);
        }
      }
    });
  }

  onSearchChange() {
    // Debounce search
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1; // Reset to first page on search
      this.loadEntries();
    }, 300);
  }

  loadEntries() {
    if (!this.siteId) {
      console.error('DiaryComponent: Cannot load entries: No site ID');
      return;
    }

    this.uiStateService.showLoading();
    console.log('DiaryComponent: Fetching diary entries for site:', this.siteId);

    // Clear existing photos
    this.entryPhotos = {};

    // Build query parameters
    let params = new HttpParams()
      .set('page', this.currentPage.toString())
      .set('per_page', this.perPage.toString());

    // Add search parameters if they exist
    if (this.searchTerm) {
      params = params.set('search', this.searchTerm);
    }
    if (this.startDate) {
      params = params.set('start_date', this.startDate);
    }
    if (this.endDate) {
      params = params.set('end_date', this.endDate);
    }

    this.http.get<DiaryEntriesResponse>(`${this.baseUrl}/api/diary/${this.siteId}`, { params })
      .pipe(finalize(() => this.uiStateService.hideLoading()))
      .subscribe({
        next: (response) => {
          console.log('DiaryComponent: Received diary entries:', response);
          this.entriesArray = response.items;
          this.totalEntries = response.total;
          this.totalPages = response.total_pages;
          this.hasNextPage = response.has_next;
          this.hasPrevPage = response.has_prev;

          // Initialize empty photo arrays for all entries first
          this.entriesArray.forEach(entry => {
            if (entry.id) {
              this.entryPhotos[entry.id] = [];
            }
          });

          // Then load photos for each entry
          this.entriesArray.forEach((entry: DiaryEntryResponse) => {
            if (entry.id) {
              this.client.get_photos_for_entry_api_photos_entry__entry_id__get(entry.id)
                .subscribe({
                  next: (photos: PhotoResponse[]) => {
                    console.log(`DiaryComponent: Loaded photos for entry ${entry.id}:`, photos);
                    if (photos && photos.length > 0) {
                      this.entryPhotos[entry.id!] = [...photos];
                      photos.forEach(photo => this.loadPhotoUrl(photo));
                    }
                  },
                  error: (error: ApiException) => {
                    console.error(`DiaryComponent: Error loading photos for entry ${entry.id}:`, error);
                  }
                });
            }
          });
        },
        error: (error) => {
          console.error('DiaryComponent: Error loading diary entries:', error);
          this.error = 'Failed to load diary entries';
          this.uiStateService.showMessage('Failed to load diary entries');
        }
      });
  }

  handlePageEvent(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.perPage = event.pageSize;
    this.loadEntries();
  }

  goBack() {
    this.router.navigate(['../overview'], { relativeTo: this.route });
  }

  editEntry(entry: DiaryEntryResponse) {
    const dialogRef = this.dialog.open(EditDiaryEntryDialogComponent, {
      width: '600px',
      data: { entry }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadEntries();
      }
    });
  }

  formatWeather(weather: Weather | null): string {
    if (!weather) return 'Not recorded';

    const parts = [];
    if (weather['conditions']) parts.push(weather['conditions']);
    if (weather['temperature']) parts.push(`${weather['temperature']}°C`);
    if (weather['wind_speed']) parts.push(`Wind: ${weather['wind_speed']}km/h`);
    if (weather['humidity']) parts.push(`Humidity: ${weather['humidity']}%`);

    return parts.length > 0 ? parts.join(', ') : 'Not recorded';
  }

  createEntry() {
    if (!this.siteId) {
      this.error = 'Cannot create entry: No jobsite ID found';
      return;
    }

    const dialogRef = this.dialog.open(CreateDiaryEntryDialogComponent, {
      width: '600px',
      data: { siteId: this.siteId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadEntries();
      }
    });
  }

  exportEntries() {
    if (!this.siteId) {
      this.error = 'Cannot export entries: No site ID found';
      return;
    }

    if (this.entriesArray.length === 0) {
      this.uiStateService.showMessage('No entries to export');
      return;
    }

    this.uiStateService.showLoading();

    // Use the new export all endpoint
    this.http.get(`${this.baseUrl}/api/diary/${this.siteId}/export/all`, {
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      finalize(() => this.uiStateService.hideLoading())
    ).subscribe({
      next: (response) => {
        const blob = response.body;
        const contentDisposition = response.headers.get('content-disposition');
        let filename = `site-diary-${this.siteId}.pdf`;

        if (contentDisposition) {
          const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
          if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
          }
        }

        // Create a blob URL and trigger download
        const url = window.URL.createObjectURL(blob!);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();

        // Cleanup
        window.URL.revokeObjectURL(url);
        console.log('DiaryComponent: Successfully exported diary entries');
        this.uiStateService.showMessage('Diary entries exported successfully');
      },
      error: (error: Error) => {
        console.error('DiaryComponent: Error exporting diary entries:', error);
        this.error = 'Failed to export diary entries';
        this.uiStateService.showMessage('Failed to export diary entries');
      }
    });
  }

  toggleFilters() {
    this.isFilterExpanded = !this.isFilterExpanded;
  }

  viewEntry(entry: DiaryEntryResponse) {
    const photos = entry.id ? this.entryPhotos[entry.id] || [] : [];
    this.dialog.open(ViewDiaryEntryDialogComponent, {
      width: '800px',
      data: { entry, photos }
    });
  }

  handlePhotoClick(event: MouseEvent | KeyboardEvent): void {
    // Add your photo click handling logic here
    event.stopPropagation();
  }
}

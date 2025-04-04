import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Client, PhotoResponse, Record_type, Record_type2 } from '../../api/api';
import { ActivatedRoute } from '@angular/router';
import { StatusService } from '../../services/status.service';
import { PhotoService } from '../diary/photo.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

interface PhotoWithBlob extends PhotoResponse {
  blobUrl?: string;
}

@Component({
  selector: 'app-photos',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Photos</mat-card-title>
        <div class="header-actions">
          <input
            type="file"
            #fileInput
            (change)="onFileSelected($event)"
            accept="image/*"
            multiple
            style="display: none"
          />
          <button mat-raised-button color="primary" (click)="fileInput.click()">
            <mat-icon>add_a_photo</mat-icon>
            Upload Photos
          </button>
        </div>
      </mat-card-header>
      <mat-card-content>
        <mat-grid-list cols="3" rowHeight="1:1" gutterSize="16" *ngIf="photosList.length > 0">
          <mat-grid-tile *ngFor="let photo of photosList">
            <div class="photo-tile">
              <img [src]="photo.blobUrl" [alt]="photo.description || 'Site photo'" class="photo-img">
              <div class="photo-overlay">
                <button mat-icon-button (click)="viewPhoto(photo)">
                  <mat-icon>zoom_in</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deletePhoto(photo)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          </mat-grid-tile>
        </mat-grid-list>

        <div *ngIf="photosList.length === 0" class="no-photos">
          <mat-icon>photo_library</mat-icon>
          <p>No photos uploaded yet. Click the button above to add photos.</p>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .header-actions {
      margin-left: auto;
    }
    .photo-tile {
      position: relative;
      width: 100%;
      height: 100%;
    }
    .photo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      background-color: rgba(0, 0, 0, 0.04);
    }
    .photo-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      padding: 8px;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .photo-tile:hover .photo-overlay {
      opacity: 1;
    }
    mat-card {
      margin: 16px;
    }
    .no-photos {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      color: rgba(0, 0, 0, 0.5);
      text-align: center;
    }
    .no-photos mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
  `]
})
export class PhotosComponent implements OnInit, OnDestroy {
  photosList: PhotoWithBlob[] = [];
  siteId?: number;

  constructor(
    private client: Client,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private statusService: StatusService,
    private photoService: PhotoService
  ) {}

  ngOnInit(): void {
    this.route.parent?.params.subscribe(params => {
      if (params['id']) {
        this.siteId = +params['id'];
        this.loadPhotos();
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up blob URLs
    this.photosList.forEach(photo => {
      if (photo.blobUrl) {
        this.photoService.revokePhotoUrl(photo.blobUrl);
      }
    });
  }

  loadPhotos(): void {
    if (!this.siteId) return;

    this.statusService.setLoading(true);
    this.client.get_photos_api_photos_get(Record_type2.Diary, this.siteId)
      .pipe(
        finalize(() => this.statusService.setLoading(false)),
        catchError(error => {
          this.snackBar.open('Error loading photos', 'Close', { duration: 3000 });
          return of([]);
        })
      )
      .subscribe(photos => {
        this.photosList = photos;
        // Load blob URLs for photos
        this.photosList.forEach(photo => this.loadPhotoUrl(photo));
      });
  }

  private loadPhotoUrl(photo: PhotoWithBlob) {
    if (photo.filename) {
      this.photoService.getPhotoUrl(photo.filename).subscribe(url => {
        photo.blobUrl = url;
      });
    }
  }

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files && this.siteId) {
      Array.from(files).forEach(file => {
        if (this.isValidImageFile(file)) {
          this.uploadPhoto(file);
        }
      });
    }
  }

  private isValidImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      this.snackBar.open('Invalid file type. Please upload images only.', 'Close', { duration: 3000 });
      return false;
    }
    return true;
  }

  uploadPhoto(file: File): void {
    if (!this.siteId) return;

    this.statusService.setLoading(true);
    const formData = new FormData();
    const blob = new Blob([file], { type: file.type });
    formData.append('file', blob, file.name);

    this.client.upload_photo_api_photos_post(Record_type.Diary, this.siteId, undefined, formData as any)
      .pipe(
        finalize(() => this.statusService.setLoading(false)),
        catchError(error => {
          this.snackBar.open('Error uploading photo', 'Close', { duration: 3000 });
          return of(null);
        })
      )
      .subscribe(response => {
        if (response) {
          this.snackBar.open('Photo uploaded successfully', 'Close', { duration: 3000 });
          this.loadPhotos(); // Reload all photos to get the new one
        }
      });
  }

  viewPhoto(photo: PhotoResponse): void {
    if (photo['blobUrl']) {
      window.open(photo['blobUrl'], '_blank');
    }
  }

  deletePhoto(photo: PhotoResponse): void {
    if (confirm('Are you sure you want to delete this photo?')) {
      this.statusService.setLoading(true);
      this.client.delete_photo_api_photos__photo_id__delete(photo.id)
        .pipe(
          finalize(() => this.statusService.setLoading(false)),
          catchError(error => {
            this.snackBar.open('Error deleting photo', 'Close', { duration: 3000 });
            return of(null);
          })
        )
        .subscribe(response => {
          this.snackBar.open('Photo deleted successfully', 'Close', { duration: 3000 });
          this.loadPhotos(); // Reload photos to reflect the deletion
        });
    }
  }
} 
import { Component, EventEmitter, Input, Output, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Client, PhotoResponse, Record_type, FileParameter, Description } from '../../api/api';
import { environment } from '../../environments/environment';
import { PhotoService } from './photo.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-diary-photo-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule
  ],
  template: `
    <div class="photo-upload-container">
      <div class="upload-button-container">
        <input
          type="file"
          #fileInput
          (change)="onFileSelected($event)"
          accept="image/*"
          multiple
          style="display: none"
          [disabled]="uploading"
        />
        <button mat-raised-button color="primary" (click)="fileInput.click()" [disabled]="uploading">
          <mat-icon>add_photo_alternate</mat-icon>
          {{ uploading ? 'Uploading...' : 'Add Photos' }}
        </button>
      </div>

      <div class="preview-container" *ngIf="selectedFiles.length > 0 || uploadedPhotos.length > 0">
        <div class="photo-preview" *ngFor="let file of selectedFiles; let i = index">
          <img [src]="previewUrls[i]" alt="Preview" />
          <div class="photo-overlay">
            <button mat-icon-button color="warn" (click)="removeFile(i)" [disabled]="uploading">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
          <div class="pending-badge" *ngIf="!entryId">
            <mat-icon>schedule</mat-icon>
            Pending
          </div>
          <mat-progress-bar *ngIf="uploading && isCurrentlyUploading(i)" mode="indeterminate"></mat-progress-bar>
          <div class="error-badge" *ngIf="uploadErrors[i]">
            <mat-icon>error</mat-icon>
            {{ uploadErrors[i] }}
          </div>
        </div>

        <div class="photo-preview" *ngFor="let photo of uploadedPhotos">
          <img [src]="photo.blobUrl || ''" alt="Uploaded photo" />
          <div class="photo-overlay">
            <button mat-icon-button color="warn" (click)="removeUploadedPhoto(photo)" [disabled]="uploading">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .photo-upload-container {
      margin: 16px 0;
    }

    .upload-button-container {
      margin-bottom: 16px;
    }

    .preview-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .photo-preview {
      position: relative;
      aspect-ratio: 1;
      border-radius: 4px;
      overflow: hidden;
      background: #f5f5f5;
    }

    .photo-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .photo-overlay {
      position: absolute;
      top: 0;
      right: 0;
      padding: 4px;
      background: rgba(0, 0, 0, 0.5);
      border-bottom-left-radius: 4px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .photo-preview:hover .photo-overlay {
      opacity: 1;
    }

    .pending-badge, .error-badge {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 4px 8px;
      color: white;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .pending-badge {
      background: rgba(0, 0, 0, 0.7);
    }

    .error-badge {
      background: rgba(244, 67, 54, 0.9);
    }

    .pending-badge mat-icon, .error-badge mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    mat-progress-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
    }
  `]
})
export class DiaryPhotoUploadComponent implements OnDestroy, OnChanges {
  @Input() entryId?: number;
  @Input() existingPhotos?: PhotoResponse[];
  @Output() photosChanged = new EventEmitter<PhotoResponse[]>();
  @Output() photosPending = new EventEmitter<File[]>();

  selectedFiles: File[] = [];
  previewUrls: string[] = [];
  uploadedPhotos: (PhotoResponse & { blobUrl?: string })[] = [];
  uploading = false;
  currentUploadIndex = -1;
  uploadErrors: string[] = [];

  constructor(
    private apiClient: Client,
    private photoService: PhotoService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['existingPhotos'] && changes['existingPhotos'].currentValue) {
      this.uploadedPhotos = [...changes['existingPhotos'].currentValue];
      // Load blob URLs for existing photos
      this.uploadedPhotos.forEach(photo => this.loadPhotoUrl(photo));
    }

    // If we receive an entryId and have pending files, start uploading them
    if (changes['entryId'] && changes['entryId'].currentValue && this.selectedFiles.length > 0) {
      console.log('Received entryId, uploading pending files:', this.selectedFiles.length);
      this.selectedFiles.forEach(file => this.uploadFile(file));
    }
  }

  ngOnDestroy() {
    // Clean up blob URLs
    this.uploadedPhotos.forEach(photo => {
      if (photo.blobUrl) {
        this.photoService.revokePhotoUrl(photo.blobUrl);
      }
    });
  }

  private loadPhotoUrl(photo: PhotoResponse) {
    if (photo.filename) {
      this.photoService.getPhotoUrl(photo.filename).subscribe(url => {
        const photoWithBlob = photo as PhotoResponse & { blobUrl?: string };
        photoWithBlob.blobUrl = url;
      });
    }
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (this.isValidImageFile(file)) {
          this.selectedFiles.push(file);
          this.uploadErrors.push('');
          this.createPreview(file);
          if (this.entryId) {
            this.uploadFile(file);
          } else {
            // Notify parent that we have pending files
            this.photosPending.emit(this.selectedFiles);
          }
        } else {
          console.error('Invalid file type:', file.type);
        }
      }
      // Reset the input so the same file can be selected again
      event.target.value = '';
    }
  }

  private isValidImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    return validTypes.includes(file.type);
  }

  private createPreview(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewUrls.push(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  private uploadFile(file: File) {
    if (!this.entryId) {
      console.error('No entry ID provided for photo upload');
      return;
    }

    this.uploading = true;
    const index = this.selectedFiles.indexOf(file);
    this.currentUploadIndex = index;
    this.uploadErrors[index] = '';

    const fileParam: FileParameter = {
      data: file,
      fileName: file.name
    };

    // Create a Description object with the filename as the description
    const description = new Description();
    description['value'] = file.name;

    this.apiClient.upload_photo_api_photos_post(
      Record_type.Diary,
      this.entryId,
      fileParam,
      description
    ).subscribe({
      next: (photo: PhotoResponse) => {
        this.loadPhotoUrl(photo);
        this.uploadedPhotos.push(photo);
        this.photosChanged.emit(this.uploadedPhotos);

        // Remove from selected files after successful upload
        const index = this.selectedFiles.indexOf(file);
        if (index > -1) {
          this.selectedFiles.splice(index, 1);
          this.previewUrls.splice(index, 1);
          this.uploadErrors.splice(index, 1);
        }
      },
      error: (error: any) => {
        console.error('Error uploading photo:', error);
        const index = this.selectedFiles.indexOf(file);
        if (index > -1) {
          this.uploadErrors[index] = 'Upload failed. Please try again.';
        }
      },
      complete: () => {
        this.uploading = false;
        this.currentUploadIndex = -1;
      }
    });
  }

  isCurrentlyUploading(index: number): boolean {
    return this.currentUploadIndex === index;
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
    this.previewUrls.splice(index, 1);
    this.photosChanged.emit(this.uploadedPhotos);
  }

  removeUploadedPhoto(photo: PhotoResponse) {
    if (!this.entryId) return;

    this.apiClient.delete_photo_api_photos__photo_id__delete(photo.id!)
      .subscribe({
        next: () => {
          const index = this.uploadedPhotos.findIndex(p => p.id === photo.id);
          if (index > -1) {
            if (this.uploadedPhotos[index].blobUrl) {
              this.photoService.revokePhotoUrl(this.uploadedPhotos[index].blobUrl!);
            }
            this.uploadedPhotos.splice(index, 1);
            this.photosChanged.emit(this.uploadedPhotos);
          }
        },
        error: (error: any) => {
          console.error('Error deleting photo:', error);
        }
      });
  }
}
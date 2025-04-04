import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PhotosComponent } from './photos.component';
import { Client, Record_type, PhotoResponse, PhotoResponseRecord_type } from '../../api/api';
import { StatusService } from '../../services/status.service';
import { PhotoService } from '../diary/photo.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('PhotosComponent API Integration', () => {
  let component: PhotosComponent;
  let mockClient: jasmine.SpyObj<Client>;

  beforeEach(async () => {
    mockClient = jasmine.createSpyObj('Client', [
      'upload_photo_api_photos_post',
      'get_photos_api_photos_get'
    ]);
    mockClient.get_photos_api_photos_get.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        NoopAnimationsModule,
        PhotosComponent
      ],
      providers: [
        { provide: Client, useValue: mockClient },
        { provide: StatusService, useValue: { setLoading: () => {} } },
        { provide: MatSnackBar, useValue: { open: () => {} } },
        { provide: PhotoService, useValue: {} },
        {
          provide: ActivatedRoute,
          useValue: {
            parent: {
              params: of({ id: '1' })
            }
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(PhotosComponent);
    component = fixture.componentInstance;
    component.siteId = 1;
  });

  it('should send correct FormData to API when uploading a photo', fakeAsync(() => {
    // Arrange
    const file = new File(['test image content'], 'test.jpg', { type: 'image/jpeg' });
    const mockResponse: Partial<PhotoResponse> = {
      id: 1,
      filename: 'test.jpg',
      record_type: PhotoResponseRecord_type.Diary,
      record_id: 1
    };
    mockClient.upload_photo_api_photos_post.and.returnValue(of(mockResponse as PhotoResponse));

    // Act
    component.uploadPhoto(file);
    tick();

    // Assert
    expect(mockClient.upload_photo_api_photos_post).toHaveBeenCalledTimes(1);
    
    const args = mockClient.upload_photo_api_photos_post.calls.mostRecent().args;
    expect(args[0]).toBe(Record_type.Diary); // record_type
    expect(args[1]).toBe(1); // record_id
    expect(args[2]).toBeUndefined(); // description
    
    // Since we know we're passing FormData in the component
    const formData = args[3] as unknown as FormData;
    expect(formData instanceof FormData).toBeTruthy();
    const fileFromFormData = formData.get('file');
    expect(fileFromFormData instanceof Blob).toBeTruthy();
  }));
}); 
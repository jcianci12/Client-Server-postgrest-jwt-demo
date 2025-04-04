import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  private photoUrlCache = new Map<string, Observable<string>>();

  constructor(private http: HttpClient) {}

  getPhotoUrl(filename: string): Observable<string> {
    // Check if we already have this URL in our cache
    const cached = this.photoUrlCache.get(filename);
    if (cached) {
      return cached;
    }

    // Create new observable for this photo URL
    const photoUrl$ = this.http.get(
      `${environment.baseUrl}/api/photos/file/${filename}`,
      { responseType: 'blob' }
    ).pipe(
      map(blob => URL.createObjectURL(blob)),
      // Share the same URL for multiple subscribers
      shareReplay(1)
    );

    // Cache the observable
    this.photoUrlCache.set(filename, photoUrl$);
    return photoUrl$;
  }

  // Call this when component is destroyed to clean up object URLs
  revokePhotoUrl(url: string) {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
} 
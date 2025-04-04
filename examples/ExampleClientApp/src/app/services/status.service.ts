import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { JobsiteResponse } from '../api/api';

export interface StatusState {
  loading: boolean;
  message?: string;
  lastVisitedJobsite?: JobsiteResponse;
}

@Injectable({
  providedIn: 'root'
})
export class StatusService {
  private statusSubject = new BehaviorSubject<StatusState>({ loading: false });
  public status$ = this.statusSubject.asObservable();
  private readonly LAST_URL_KEY = 'lastVisitedUrl';

  showLoading() {
    const currentState = this.statusSubject.value;
    this.statusSubject.next({ ...currentState, loading: true });
  }

  hideLoading() {
    const currentState = this.statusSubject.value;
    this.statusSubject.next({ ...currentState, loading: false });
  }

  showMessage(message: string, duration: number = 5000) {
    const currentState = this.statusSubject.value;
    this.statusSubject.next({ ...currentState, message });
    
    if (duration > 0) {
      setTimeout(() => {
        this.clearMessage();
      }, duration);
    }
  }

  clearMessage() {
    const currentState = this.statusSubject.value;
    this.statusSubject.next({ ...currentState, message: undefined });
  }

  setLastVisitedJobsite(jobsite: JobsiteResponse) {
    const currentState = this.statusSubject.value;
    this.statusSubject.next({ ...currentState, lastVisitedJobsite: jobsite });
    // Also store in localStorage for persistence across sessions
    localStorage.setItem('lastVisitedJobsite', JSON.stringify(jobsite));
  }

  getLastVisitedJobsite(): JobsiteResponse | undefined {
    const currentState = this.statusSubject.value;
    if (currentState.lastVisitedJobsite) {
      return currentState.lastVisitedJobsite;
    }
    // Try to get from localStorage if not in state
    const stored = localStorage.getItem('lastVisitedJobsite');
    if (stored) {
      const jobsite = JSON.parse(stored) as JobsiteResponse;
      this.setLastVisitedJobsite(jobsite); // Update state with stored value
      return jobsite;
    }
    return undefined;
  }

  clearLastVisitedJobsite() {
    const currentState = this.statusSubject.value;
    this.statusSubject.next({ ...currentState, lastVisitedJobsite: undefined });
    localStorage.removeItem('lastVisitedJobsite');
  }

  // New methods for URL tracking
  setLastVisitedUrl(url: string) {
    // Don't store auth-related URLs or login page
    if (!url.includes('/auth') && !url.includes('/login')) {
      console.log('Storing last visited URL:', url);
      sessionStorage.setItem(this.LAST_URL_KEY, url);
    }
  }

  getLastVisitedUrl(): string | null {
    return sessionStorage.getItem(this.LAST_URL_KEY);
  }

  clearLastVisitedUrl() {
    sessionStorage.removeItem(this.LAST_URL_KEY);
  }

  getRedirectUrl(): string {
    const lastUrl = this.getLastVisitedUrl();
    console.log('Getting redirect URL, last visited URL was:', lastUrl);
    
    // Clear the stored URL once we've retrieved it
    this.clearLastVisitedUrl();
    
    // Return the last visited URL or default to home
    return lastUrl || '/home';
  }

  setLoading(loading: boolean) {
    const currentState = this.statusSubject.value;
    this.statusSubject.next({ ...currentState, loading });
  }
} 
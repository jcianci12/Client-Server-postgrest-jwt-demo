import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { JobsiteResponse } from '../api/api';

export type MessageType = 'info' | 'warning' | 'error' | 'success' | 'session-renewal';

export interface UIState {
  loading: boolean;
  message?: string;
  messageType?: MessageType;
  lastVisitedJobsite?: JobsiteResponse;
  sessionExpired?: boolean;
}

/**
 * UIStateService - Consolidated service for managing UI state
 *
 * This service combines the functionality of the previous LoadingService and StatusService
 * to provide a single source of truth for UI-related state management.
 */
@Injectable({
  providedIn: 'root'
})
export class UIStateService {
  private stateSubject = new BehaviorSubject<UIState>({ loading: false, sessionExpired: false });
  public state$ = this.stateSubject.asObservable();

  // Dedicated observables for specific state properties
  public loading$ = this.state$.pipe(map((state: UIState) => state.loading));
  public message$ = this.state$.pipe(map((state: UIState) => state.message));
  public messageType$ = this.state$.pipe(map((state: UIState) => state.messageType));
  public lastVisitedJobsite$ = this.state$.pipe(map((state: UIState) => state.lastVisitedJobsite));
  public sessionExpired$ = this.state$.pipe(map((state: UIState) => state.sessionExpired));

  private readonly LAST_URL_KEY = 'lastVisitedUrl';

  constructor() {
    // Initialize state from localStorage if available
    this.initializeFromStorage();
  }

  private initializeFromStorage(): void {
    // Try to get lastVisitedJobsite from localStorage
    const storedJobsite = localStorage.getItem('lastVisitedJobsite');
    if (storedJobsite) {
      try {
        const jobsite = JSON.parse(storedJobsite) as JobsiteResponse;
        const currentState = this.stateSubject.value;
        this.stateSubject.next({ ...currentState, lastVisitedJobsite: jobsite });
      } catch (error) {
        console.error('Error parsing stored jobsite:', error);
        localStorage.removeItem('lastVisitedJobsite');
      }
    }
  }

  // Loading methods
  showLoading(): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({ ...currentState, loading: true });
  }

  hideLoading(): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({ ...currentState, loading: false });
  }

  setLoading(loading: boolean): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({ ...currentState, loading });
  }

  // Message methods
  showMessage(message: string, duration: number = 5000, type: MessageType = 'info'): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({ ...currentState, message, messageType: type });

    if (duration > 0) {
      setTimeout(() => {
        this.clearMessage();
      }, duration);
    }
  }

  /**
   * Shows a session renewal notification
   * @param message The message to display
   * @param duration Duration in milliseconds, 0 for indefinite
   */
  showSessionRenewalMessage(message: string = 'Your session has expired.', duration: number = 0): void {
    this.showMessage(message, duration, 'session-renewal');
  }

  clearMessage(): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({ ...currentState, message: undefined, messageType: undefined });
  }

  // Jobsite tracking methods
  setLastVisitedJobsite(jobsite: JobsiteResponse): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({ ...currentState, lastVisitedJobsite: jobsite });
    // Also store in localStorage for persistence across sessions
    localStorage.setItem('lastVisitedJobsite', JSON.stringify(jobsite));
  }

  getLastVisitedJobsite(): JobsiteResponse | undefined {
    return this.stateSubject.value.lastVisitedJobsite;
  }

  clearLastVisitedJobsite(): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({ ...currentState, lastVisitedJobsite: undefined });
    localStorage.removeItem('lastVisitedJobsite');
  }

  // URL tracking methods
  setLastVisitedUrl(url: string): void {
    // Don't store auth-related URLs
    if (!url.includes('/auth') && !url.includes('/login')) {
      sessionStorage.setItem(this.LAST_URL_KEY, url);
    }
  }

  getLastVisitedUrl(): string | null {
    return sessionStorage.getItem(this.LAST_URL_KEY);
  }

  clearLastVisitedUrl(): void {
    sessionStorage.removeItem(this.LAST_URL_KEY);
  }

  getRedirectUrl(): string {
    const lastUrl = this.getLastVisitedUrl();
    // Clear the stored URL once we've retrieved it
    this.clearLastVisitedUrl();
    // Return the last visited URL or default to home
    return lastUrl || '/home';
  }

  setSessionExpired(expired: boolean): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({ ...currentState, sessionExpired: expired });
  }

  clearSessionState(): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      sessionExpired: false,
      message: undefined,
      messageType: undefined
    });
  }
}

import { Injectable, OnDestroy, NgZone } from '@angular/core';
import { User, UserManager } from 'oidc-client-ts';
import { BehaviorSubject, Subject } from 'rxjs';
import { getAuthSettings } from '../auth/auth.config';
import { StatusService } from './status.service';

@Injectable({
  providedIn: 'root'
})
export class SessionService implements OnDestroy {
  private userManager: UserManager;
  private isRefreshing = false;
  private userSubject = new BehaviorSubject<User | null>(null);
  private destroy$ = new Subject<void>();
  private readonly AUTH_STORAGE_KEY = 'oidc.user:https://authentik.tekonline.com.au/application/o/pyscheduler/:pysched';

  user$ = this.userSubject.asObservable();

  constructor(
    private statusService: StatusService,
    private ngZone: NgZone
  ) {
    this.userManager = new UserManager(getAuthSettings());
    this.setupEventHandlers();
    this.loadInitialUser();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupEventHandlers() {
    this.userManager.events.addUserLoaded(user => {
      this.ngZone.run(() => this.userSubject.next(user));
    });

    this.userManager.events.addUserUnloaded(() => {
      this.ngZone.run(() => this.userSubject.next(null));
    });

    this.userManager.events.addSilentRenewError(error => {
      console.error('Silent renew error:', error);
      this.statusService.showMessage('Session refresh failed', 3000);
      // Clear user state on silent renew error to trigger re-authentication
      this.userSubject.next(null);
    });

    this.userManager.events.addUserSignedOut(() => {
      this.ngZone.run(() => {
        this.userSubject.next(null);
        this.statusService.showMessage('You have been signed out', 3000);
      });
    });

    // Add access token expiring handler
    this.userManager.events.addAccessTokenExpiring(() => {
      console.log('Access token expiring, attempting renewal');
      this.renewToken().catch(error => {
        console.error('Failed to renew token on expiring event:', error);
      });
    });
  }

  private async loadInitialUser() {
    try {
      const user = await this.userManager.getUser();
      if (user) {
        // Check if the token is about to expire
        const expiresIn = user.expires_in;
        if (expiresIn && expiresIn < 60) { // Less than 1 minute until expiration
          console.log('Token near expiration on initial load, attempting renewal');
          await this.renewToken();
        } else {
          this.userSubject.next(user);
        }
      }
    } catch (error) {
      console.error('Error loading initial user:', error);
      this.userSubject.next(null);
    }
  }

  async getUser(): Promise<User | null> {
    const user = await this.userManager.getUser();
    if (user && user.expired) {
      return this.renewToken();
    }
    return user;
  }

  async signInPopup(): Promise<User | null> {
    try {
      const user = await this.userManager.signinPopup();
      this.userSubject.next(user);
      return user;
    } catch (error) {
      console.error('Sign in popup error:', error);
      this.userSubject.next(null);
      throw error;
    }
  }

  async completePopupSignIn(): Promise<void> {
    try {
      await this.userManager.signinPopupCallback();
      const user = await this.userManager.getUser();
      this.userSubject.next(user);
    } catch (error) {
      console.error('Popup callback error:', error);
      this.userSubject.next(null);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      const user = await this.userManager.getUser();
      if (user?.refresh_token) {
        // Revoke the refresh token before signing out
        await this.userManager.revokeTokens(['refresh_token']);
      }
      await this.userManager.removeUser();
      this.userSubject.next(null);
    } catch (error) {
      console.error('Error during sign out:', error);
      // Still clear the user even if revocation fails
      await this.userManager.removeUser();
      this.userSubject.next(null);
      throw error;
    }
  }

  async renewToken(): Promise<User | null> {
    if (this.isRefreshing) {
      return this.getUser();
    }

    this.isRefreshing = true;
    try {
      const currentUser = await this.userManager.getUser();

      // If we have a refresh token, use it
      if (currentUser?.refresh_token) {
        console.log('Using refresh token for renewal');
        const user = await this.userManager.signinSilent({
          scope: getAuthSettings().scope,
        });
        this.userSubject.next(user);
        return user;
      }

      // If no refresh token, try to get a new one
      console.log('No refresh token available, attempting new authentication');
      return null;
    } catch (error) {
      console.error('Token renewal error:', error);
      // Clear user state on renewal failure
      this.userSubject.next(null);
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }
}

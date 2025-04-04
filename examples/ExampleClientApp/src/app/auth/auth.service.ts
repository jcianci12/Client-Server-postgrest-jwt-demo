/**
 * Authentication service that handles user authentication using oidc-client-ts.
 * This service delegates most of the OIDC operations to SessionService while handling
 * application-specific logic like routing and company setup.
 *
 * IMPORTANT IMPLEMENTATION NOTES:
 * 1. We use oidc-client-ts for OIDC/OAuth2 authentication
 * 2. Authentication is handled via popup window (not redirect flow)
 * 3. The popup automatically closes after successful authentication
 * 4. User state is managed by UserStateService to prevent duplicate instances
 *
 * Authentication Flow:
 * 1. User clicks login -> login() is called
 * 2. SessionService opens popup with Authentik login
 * 3. After successful login, popup closes automatically
 * 4. Main window receives the user data and updates state
 * 5. handleSuccessfulLogin() checks company setup and redirects accordingly
 */
import { Injectable, NgZone, inject } from '@angular/core';
import { Router } from '@angular/router';
import { User } from 'oidc-client-ts';
import { Observable } from 'rxjs';
import { StatusService } from '../services/status.service';
import { SessionService } from '../services/session.service';
import { UserStateService } from '../services/user-state.service';
import { UIStateService } from '../services/ui-state.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private statusService = inject(StatusService);
  private sessionService = inject(SessionService);
  private userState = inject(UserStateService);
  private uiState = inject(UIStateService);

  constructor() {
    console.log('AuthService constructor');

    // Subscribe to session service user changes to update user state
    this.sessionService.user$.subscribe(user => {
      this.userState.updateUser(user);
    });
  }

  /**
   * Observable stream of the current user state.
   * Delegates to UserStateService to ensure single source of truth.
   */
  get user$(): Observable<User | null> {
    return this.userState.user$;
  }

  /**
   * Initiates the login process using a popup window.
   * The popup will automatically close after successful authentication.
   * After successful login, checks company setup and redirects accordingly.
   *
   * @param returnUrl Optional URL to redirect to after successful login
   */
  async login(returnUrl?: string): Promise<User | null> {
    try {
      this.uiState.showLoading();
      this.uiState.showMessage('Authenticating...', undefined, 'info');
      const user = await this.sessionService.signInPopup();
      if (user) {
        this.uiState.showMessage('Authentication successful!', 3000, 'success');
        await this.handleSuccessfulLogin(returnUrl);
        return user;
      }
      this.uiState.showMessage('Authentication failed', 3000, 'error');
      return null;
    } catch (error) {
      console.error('Login error:', error);
      this.uiState.showMessage('Authentication failed. Please try again.', 3000, 'error');
      throw error;
    } finally {
      this.uiState.hideLoading();
    }
  }

  /**
   * Completes the login process for redirect flow.
   * Note: We primarily use popup flow, but this is kept for fallback.
   *
   * @param returnUrl Optional URL to redirect to after successful login
   */
  async completeLogin(returnUrl?: string): Promise<User | null> {
    try {
      this.uiState.showLoading();
      this.uiState.showMessage('Completing authentication...', undefined, 'info');
      const user = await this.sessionService.getUser();
      if (user) {
        this.uiState.showMessage('Authentication successful!', 3000, 'success');
        await this.handleSuccessfulLogin(returnUrl);
        return user;
      }
      return null;
    } catch (error) {
      console.error('Complete login error:', error);
      this.uiState.showMessage('Authentication failed', 3000, 'error');
      throw error;
    } finally {
      this.uiState.hideLoading();
    }
  }

  /**
   * Attempts to renew the token silently in the background.
   * Used by auth.guard.ts when token is expired.
   */
  renewToken(): Promise<User | null> {
    this.uiState.showLoading();
    this.uiState.showMessage('Renewing session...', undefined, 'info');
    return this.sessionService.renewToken()
      .then(user => {
        if (user) {
          this.uiState.showMessage('Session renewed successfully', 3000, 'success');
        }
        return user;
      })
      .catch(error => {
        this.uiState.showMessage('Failed to renew session', 3000, 'error');
        throw error;
      })
      .finally(() => {
        this.uiState.hideLoading();
      });
  }

  /**
   * Logs out the current user and redirects to login page.
   */
  async logout(): Promise<void> {
    try {
      this.uiState.showLoading();
      this.uiState.showMessage('Signing out...', undefined, 'info');
      await this.sessionService.signOut();
      this.uiState.showMessage('Signed out successfully', 3000, 'success');
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
      this.uiState.showMessage('Failed to sign out', 3000, 'error');
      throw error;
    } finally {
      this.uiState.hideLoading();
    }
  }

  /**
   * Handles post-login tasks:
   * 1. Checks if user has a company set up
   * 2. Redirects to company setup if needed
   * 3. Otherwise redirects to the provided URL, stored URL, or home
   *
   * IMPORTANT: All router navigation must be wrapped in NgZone.run()
   * to ensure proper change detection when called from OIDC callbacks.
   *
   * @param returnUrl Optional URL to redirect to after successful login
   */
  private async handleSuccessfulLogin(returnUrl?: string): Promise<void> {
    try {
      // Priority: 1. Explicitly provided returnUrl, 2. Stored redirect URL, 3. Default to home
      const storedUrl = this.statusService.getRedirectUrl();
      console.log('Login successful. Explicit returnUrl:', returnUrl);
      console.log('Stored redirect URL:', storedUrl);

      const redirectUrl = returnUrl || storedUrl;
      console.log('Final redirect URL:', redirectUrl || '/home');

      // Navigate to the appropriate URL
      this.ngZone.run(() => {
        this.router.navigate([redirectUrl || '/home']);
      });
    } catch (error) {
      console.error('Error during login:', error);
      this.uiState.showMessage('Error during login', 3000, 'error');
    }
  }

  /**
   * Checks if there is a valid, non-expired user session.
   * Used by auth.guard.ts to protect routes.
   */
  isAuthenticated(): Promise<boolean> {
    return this.sessionService.getUser().then(user => {
      return user !== null && !user.expired;
    });
  }
}

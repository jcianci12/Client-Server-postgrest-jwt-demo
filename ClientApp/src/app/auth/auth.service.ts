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
import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { User, UserManager, UserManagerSettings } from 'oidc-client-ts';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { WebStorageStateStore, Log } from 'oidc-client-ts';

// Extend UserManagerSettings to include PKCE properties
interface PKCEUserManagerSettings extends UserManagerSettings {
  code_challenge_method?: string;
  code_challenge?: string;
  code_verifier?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userManager: UserManager;
  private userSubject = new BehaviorSubject<User | null>(null);
  private isRefreshing = false;

  user$ = this.userSubject.asObservable();

  constructor(
    private router: Router,
    private ngZone: NgZone
  ) {
    // Enable OIDC-Client logging
    Log.setLogger(console);
    Log.setLevel(Log.DEBUG);

    const settings: PKCEUserManagerSettings = {
      authority: environment.authUrl,
      client_id: environment.clientId,
      redirect_uri: `${environment.baseUrl}/callback`,
      response_type: 'code',
      scope: 'openid profile email',
      loadUserInfo: true,
      userStore: new WebStorageStateStore({ store: window.localStorage }),
      metadata: {
        authorization_endpoint: `${environment.authUrl}${environment.endpoints.authorize}`,
        token_endpoint: `${environment.authUrl}${environment.endpoints.token}`,
        userinfo_endpoint: `${environment.authUrl}${environment.endpoints.userInfo}`,
        end_session_endpoint: `${environment.authUrl}${environment.endpoints.endSession}`,
        jwks_uri: `${environment.authUrl}${environment.endpoints.jwks}`,
      },
      code_challenge_method: 'S256'
    };

    this.userManager = new UserManager(settings);
    this.setupEventHandlers();
    this.loadInitialUser();
  }

  private setupEventHandlers() {
    this.userManager.events.addUserLoaded(user => {
      // Just pass through the token from Authentik
      this.ngZone.run(() => this.userSubject.next(user));
    });

    this.userManager.events.addUserUnloaded(() => {
      this.ngZone.run(() => this.userSubject.next(null));
    });

    this.userManager.events.addSilentRenewError(error => {
      console.error('Silent renew error:', error);
      this.userSubject.next(null);
    });

    this.userManager.events.addUserSignedOut(() => {
      this.ngZone.run(() => {
        this.userSubject.next(null);
        this.router.navigate(['/login']);
      });
    });
  }

  private async loadInitialUser() {
    try {
      const user = await this.userManager.getUser();
      if (user) {
        const expiresIn = user.expires_in;
        if (expiresIn && expiresIn < 60) {
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

  async login(): Promise<void> {
    try {
      console.log('Starting login...');
      await this.userManager.signinRedirect();
    } catch (error) {
      console.error('Login error:', error);
      this.userSubject.next(null);
      throw error;
    }
  }

  async completeAuthentication(): Promise<void> {
    try {
      console.log('Completing authentication...');
      const user = await this.userManager.signinRedirectCallback();
      console.log('Received user:', user);
      this.userSubject.next(user);
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Authentication completion error:', error);
      this.router.navigate(['/login']);
    }
  }

  async logout(): Promise<void> {
    try {
      const user = await this.userManager.getUser();
      if (user?.refresh_token) {
        await this.userManager.revokeTokens(['refresh_token']);
      }
      await this.userManager.removeUser();
      this.userSubject.next(null);
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
      await this.userManager.removeUser();
      this.userSubject.next(null);
      throw error;
    }
  }

  async renewToken(): Promise<User | null> {
    if (this.isRefreshing) {
      return this.userManager.getUser();
    }

    this.isRefreshing = true;
    try {
      const currentUser = await this.userManager.getUser();
      if (currentUser?.refresh_token) {
        console.log('Using refresh token for renewal');
        const user = await this.userManager.signinSilent({
          scope: 'openid profile email'
        });
        this.userSubject.next(user);
        return user;
      }
      console.log('No refresh token available');
      return null;
    } catch (error) {
      console.error('Token renewal error:', error);
      this.userSubject.next(null);
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  isAuthenticated(): Promise<boolean> {
    return this.userManager.getUser().then(user => {
      return user !== null && !user.expired;
    });
  }

  getToken(): Promise<string | null> {
    return this.userManager.getUser().then(user => {
      return user?.access_token ?? null;
    });
  }

  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  private async encodeToken(payload: any): Promise<string> {
    try {
      const header = {
        alg: 'HS256',
        typ: 'JWT'
      };
      const encodedHeader = btoa(JSON.stringify(header))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      const encodedPayload = btoa(JSON.stringify(payload))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      const signature = await this.generateSignature(encodedHeader, encodedPayload);
      return `${encodedHeader}.${encodedPayload}.${signature}`;
    } catch (error) {
      console.error('Error encoding token:', error);
      return '';
    }
  }

  private async generateSignature(header: string, payload: string): Promise<string> {
    const data = `${header}.${payload}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode('reallyreallyreallyreallyverysafesecret');
    const messageData = encoder.encode(data);
    
    // Import the key for HMAC
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    return btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}





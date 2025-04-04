import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';
import { StatusService } from '../../services/status.service';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-callback',
  standalone: true,
  template: '<div>Processing login...</div>'
})
export class CallbackComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private sessionService: SessionService,
    private router: Router,
    private route: ActivatedRoute,
    private statusService: StatusService
  ) {}

  ngOnInit(): void {
    this.statusService.showMessage('Completing login...', 0);
    
    // Handle potentially encoded URL
    this.handleEncodedUrl();
    
    // Check if this is a popup callback
    if (window.opener && window.opener !== window) {
      // This is a popup callback
      this.handlePopupCallback();
    } else {
      // This is a redirect callback
      this.handleRedirectCallback();
    }
  }

  /**
   * Handles the case where the URL might be encoded incorrectly
   * This fixes issues where the entire URL including query params is encoded
   */
  private handleEncodedUrl(): void {
    const fullUrl = window.location.href;
    
    // Check if we have an encoded URL (contains %3F which is '?')
    if (fullUrl.includes('%3F') || fullUrl.includes('%3D') || fullUrl.includes('%26')) {
      console.log('Detected encoded URL, attempting to fix:', fullUrl);
      
      try {
        // Extract the encoded part
        const encodedPart = fullUrl.split('/callback')[1];
        if (encodedPart) {
          // Decode it
          const decodedPart = decodeURIComponent(encodedPart);
          
          // Construct proper URL
          const fixedUrl = window.location.origin + '/callback' + decodedPart;
          console.log('Redirecting to properly formatted URL:', fixedUrl);
          
          // Replace the current URL with the fixed one
          window.history.replaceState({}, document.title, fixedUrl);
        }
      } catch (error) {
        console.error('Error handling encoded URL:', error);
      }
    }
  }

  private async handlePopupCallback(): Promise<void> {
    try {
      await this.sessionService.completePopupSignIn();
      // The popup will be closed automatically by the OIDC client
    } catch (error) {
      console.error('Error handling popup callback:', error);
      this.statusService.showMessage('Login failed', 3000);
    }
  }

  private async handleRedirectCallback(): Promise<void> {
    try {
      const user = await this.authService.completeLogin();
      if (user) {
        // Get the stored redirect URL or default to home
        const redirectUrl = this.statusService.getRedirectUrl() || '/';
        this.router.navigate([redirectUrl]);
      } else {
        this.statusService.showMessage('Login failed', 3000);
        this.router.navigate(['/login']);
      }
    } catch (error) {
      console.error('Error completing authentication:', error);
      this.statusService.showMessage('Login failed', 3000);
      this.router.navigate(['/login']);
    } finally {
      this.statusService.clearMessage();
    }
  }
}

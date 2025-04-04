import { Component } from '@angular/core';
import { Client } from '../api/api';
import { AuthService } from '../auth/auth.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../environments/environment';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-content>
          <div class="login-content">
            <h1>👋 Welcome to {{appTitle}}</h1>
            <p class="welcome-text">Your comprehensive solution for managing construction site diaries, equipment, inspections, and more.</p>
            <button mat-raised-button color="primary" (click)="login()" class="login-button">
              <mat-icon>login</mat-icon>
              Login to Continue
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      padding: 20px;
    }
    .login-card {
      max-width: 600px;
      width: 100%;
      text-align: center;
      padding: 2rem;
    }
    .login-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
    }
    h1 {
      font-size: 2.5rem;
      margin: 0;
      color: #2196F3;
    }
    .welcome-text {
      font-size: 1.2rem;
      color: rgba(0, 0, 0, 0.7);
      margin: 0;
      line-height: 1.5;
    }
    .login-button {
      font-size: 1.1rem;
      padding: 0.75rem 2rem;
    }
    .login-button mat-icon {
      margin-right: 0.5rem;
    }
  `],
  providers: [Client, AuthService]
})
export class LoginComponent {
  appTitle = environment.appTitle;
  private returnUrl: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Capture return URL from query parameters if available
    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || null;
      console.log('Return URL from query params:', this.returnUrl);
    });

    // If already authenticated, redirect to home or return URL
    this.authService.isAuthenticated().then(isAuth => {
      if (isAuth) {
        console.log('User is already authenticated, redirecting to:', this.returnUrl || '/');
        this.router.navigate([this.returnUrl || '/']);
      }
    });
  }

  login() {
    console.log('Logging in with return URL:', this.returnUrl || undefined);
    this.authService.login(this.returnUrl || undefined);
  }

  /**
   * Completes the login process for redirect flow.
   * This is used when the authentication flow uses redirects instead of popups.
   */
  completeLogin() {
    this.authService.completeLogin(this.returnUrl || undefined);
  }

  logout(){
    this.authService.logout();
  }

  isAuthenticated(): Promise< boolean> {
    return this.authService.isAuthenticated()
  }

  get userName(): string | null {
    return "this.authService.userName;"
  }
}

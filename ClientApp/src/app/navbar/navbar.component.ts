import { Component } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <nav>
      <div class="nav-links">
        <a routerLink="/">Home</a>
        <a *ngIf="isAuthenticated" routerLink="/test">Test DB</a>
      </div>
      <div class="auth-buttons">
        <button *ngIf="!isAuthenticated" (click)="login()">Login</button>
        <button *ngIf="isAuthenticated" (click)="logout()">Logout</button>
      </div>
    </nav>
  `,
  styles: [`
    nav {
      display: flex;
      justify-content: space-between;
      padding: 1rem;
      background-color: #f8f9fa;
    }
    .nav-links {
      display: flex;
      gap: 1rem;
    }
    .auth-buttons {
      display: flex;
      gap: 1rem;
    }
    button, a {
      padding: 0.5rem 1rem;
      cursor: pointer;
      text-decoration: none;
      color: inherit;
    }
    a:hover {
      text-decoration: underline;
    }
  `]
})
export class NavbarComponent {
  isAuthenticated = false;

  constructor(private authService: AuthService) {
    this.authService.user$.subscribe(user => {
      this.isAuthenticated = !!user && !user.expired;
    });
  }

  login() {
    this.authService.login();
  }

  logout() {
    this.authService.logout();
  }
}

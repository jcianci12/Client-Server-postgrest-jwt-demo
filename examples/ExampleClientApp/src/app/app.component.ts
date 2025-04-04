import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { Client } from './api/api';
import { NavbarComponent } from "./navbar/navbar.component";
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from './auth/auth.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { StatusComponent } from "./components/status/status.component";
import { filter } from 'rxjs/operators';
import { UIStateService } from './services/ui-state.service';
import { StatusService } from './services/status.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent,
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
    StatusComponent
  ],
  template: `
    <div class="app-container">
      <!-- Navigation -->
      <header class="app-header">
        <app-navbar></app-navbar>
      </header>

      <!-- Status Messages -->
      <app-status></app-status>

      <!-- Main Content -->
      <main class="app-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .app-header {
      flex: 0 0 auto;
    }
    .app-content {
      flex: 1 1 auto;
      padding: 20px;
    }
  `],
  providers: [Client]
})
export class AppComponent implements OnInit {
  constructor(
    private auth: AuthService,
    private matDialog: MatDialog,
    private uiStateService: UIStateService,
    private router: Router,
    private statusService: StatusService
  ) {}

  ngOnInit(): void {
    // Track navigation for the last visited URL
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // Store the URL in StatusService for auth redirect purposes
      this.statusService.setLastVisitedUrl(event.url);
      this.uiStateService.setLastVisitedUrl(event.url);
    });

    // Subscribe to user changes to handle session state
    this.auth.user$.subscribe(user => {
      if (user && !user.expired) {
        this.uiStateService.clearSessionState();
        if (user.profile.name) {
          this.uiStateService.showMessage(`Welcome back, ${user.profile.name}!`, 5000);
        } else {
          this.uiStateService.showMessage(`Welcome!`, 5000);
        }
      } else if (user?.expired) {
        this.uiStateService.setSessionExpired(true);
        this.uiStateService.showSessionRenewalMessage();
      }
    });
  }
}

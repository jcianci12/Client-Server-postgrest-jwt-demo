import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../environments/environment';
import { Title } from '@angular/platform-browser';
import { Observable, map, filter, Subject, takeUntil } from 'rxjs';
import { CompanyResponse } from '../api/api';
import { UserStateService } from '../services/user-state.service';
import { MatDividerModule } from '@angular/material/divider';
import { JobsiteNavComponent } from '../jobsite-nav/jobsite-nav.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatMenuModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatDividerModule,
    JobsiteNavComponent
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  appTitle: string;
  currentCompany$: Observable<CompanyResponse | null>;
  isAuthenticated$: Observable<boolean>;
  currentJobsiteId?: number;

  // Cleanup subject
  private destroy$ = new Subject<void>();

  constructor(
    public authService: AuthService,
    private titleService: Title,
    private router: Router,
    private userState: UserStateService
  ) {
    this.appTitle = environment.appTitle;
    this.titleService.setTitle(this.appTitle);
    this.currentCompany$ = this.userState.currentCompany$;
    this.isAuthenticated$ = this.authService.user$.pipe(
      map(user => user !== null && !user.expired)
    );

    // Subscribe to router events to extract jobsite ID
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(event => {
      const matches = event.url.match(/\/jobsites\/(\d+)/);
      this.currentJobsiteId = matches ? parseInt(matches[1], 10) : undefined;
    });
  }

  ngOnInit() {
    // All initialization is handled in the constructor
    // This method is kept to maintain the component lifecycle interface
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout() {
    this.authService.logout();
  }
}

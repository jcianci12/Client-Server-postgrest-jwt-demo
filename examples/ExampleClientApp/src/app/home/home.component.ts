import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { UIStateService } from '../services/ui-state.service';
import { Subscription } from 'rxjs';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    NgOptimizedImage
  ],
  template: `
    <div class="home-container">
      <div class="hero-section">
        <div class="hero-content">
          <h1>Welcome to Work Site Diary</h1>
          <p class="subtitle">Your comprehensive solution for managing construction site operations</p>
          <button mat-raised-button color="primary" (click)="handleButtonClick()">
            {{ isAuthenticated() ? 'My Jobsites' : 'Get Started' }}
          </button>
        </div>
      </div>

      <ng-container *ngIf="!isAuthenticated()">
        <div class="features-section">
          <mat-card>
            <img mat-card-image ngSrc="assets/images/site-diary.jpg" alt="Construction site diary" width="400" height="250" priority>
            <mat-card-header>
              <mat-card-title>Site Diaries</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              Keep detailed records of daily activities, weather conditions, and progress reports.
            </mat-card-content>
          </mat-card>

          <mat-card>
            <img mat-card-image ngSrc="assets/images/equipment.jpg" alt="Construction equipment" width="400" height="250">
            <mat-card-header>
              <mat-card-title>Equipment Management</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              Track and manage construction equipment, maintenance schedules, and usage logs.
            </mat-card-content>
          </mat-card>

          <mat-card>
            <img mat-card-image ngSrc="assets/images/safety.jpg" alt="Safety inspection" width="400" height="250">
            <mat-card-header>
              <mat-card-title>Safety Inspections</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              Conduct and document safety inspections, identify hazards, and maintain compliance.
            </mat-card-content>
          </mat-card>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .home-container {
      padding: 0;
      max-width: 100%;
      margin: 0 auto;
    }

    .hero-section {
      text-align: center;
      margin-bottom: 60px;
      background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7));
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      height: 600px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .hero-content {
      padding: 20px;
      max-width: 800px;
    }

    h1 {
      font-size: 3.5em;
      margin-bottom: 20px;
      color: white;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    }

    .subtitle {
      font-size: 1.5em;
      margin-bottom: 30px;
      color: rgba(255, 255, 255, 0.9);
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    }

    .features-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 30px;
      margin: 40px auto;
      padding: 0 20px;
      max-width: 1200px;
    }

    mat-card {
      height: 100%;
      transition: transform 0.3s ease;
      cursor: pointer;
    }

    mat-card:hover {
      transform: translateY(-5px);
    }

    mat-card-content {
      padding: 16px;
      font-size: 1.1em;
      line-height: 1.5;
    }

    [mat-card-image] {
      object-fit: cover;
      width: 100%;
      height: 250px;
    }

    @media (max-width: 768px) {
      .hero-section {
        height: 400px;
      }

      h1 {
        font-size: 2.5em;
      }

      .subtitle {
        font-size: 1.2em;
      }
    }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  isAuthenticated = signal(false);
  private subscription: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private uiStateService: UIStateService
  ) {}

  ngOnInit() {
    this.uiStateService.showLoading();

    // Subscribe to auth state changes
    this.subscription = this.authService.user$.subscribe(user => {
      this.isAuthenticated.set(!!user && !user.expired);
      this.uiStateService.hideLoading();
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  handleButtonClick() {
    if (this.isAuthenticated()) {
      this.router.navigate(['/jobsites']);
    } else {
      this.authService.login();
    }
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { StatusService } from '../services/status.service';
import { finalize } from 'rxjs';
import { Client, JobsiteResponse } from '../api/api';

@Component({
  selector: 'app-jobsite-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    RouterModule
  ],
  template: `
    <div class="jobsite-details-container">
      <mat-card class="mat-mdc-card">
        <mat-card-header>
          <mat-card-title>{{jobsite?.name}}</mat-card-title>
          <div class="header-actions">
            <button mat-button color="primary" (click)="editJobsite()" *ngIf="jobsite">
              <mat-icon>edit</mat-icon>
              Edit Jobsite
            </button>
            <button mat-button (click)="goBack()">
              <mat-icon>arrow_back</mat-icon>
              Back to Jobsites
            </button>
          </div>
        </mat-card-header>
        <mat-card-content>

          <div class="content-area">
            <router-outlet></router-outlet>
          </div>
        </mat-card-content>
      </mat-card>

      <div *ngIf="error" class="error-message">
        {{error}}
      </div>
    </div>
  `,
  styles: [`
    .jobsite-details-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .header-actions {
      margin-left: auto;
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .error-message {
      color: var(--mat-red-500);
      margin-top: 16px;
      text-align: center;
    }
    .content-area {
      padding: 20px 0;
    }
  `]
})
export class JobsiteDetailsComponent implements OnInit {
  jobsite?: JobsiteResponse;
  error?: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private statusService: StatusService,
    private client: Client
  ) {}

  ngOnInit() {
    // Get the jobsite ID from the route parameters and share with child routes
    this.route.params.subscribe({
      next: (params) => {
        const id = params['id'];
        if (id) {
          console.log('JobsiteDetailsComponent loading jobsite:', id);
          this.loadJobsite(+id);
        } else {
          console.error('No jobsite ID found in route parameters');
          this.error = 'No jobsite ID found';
        }
      },
      error: (error) => {
        console.error('Error getting route parameters:', error);
        this.error = 'Error loading jobsite';
      }
    });
  }

  loadJobsite(id: number) {
    this.statusService.showLoading();
    console.log('Fetching jobsite details for ID:', id);

    this.client.get_jobsite_api_jobsites__jobsite_id__get(id)
      .pipe(finalize(() => this.statusService.hideLoading()))
      .subscribe({
        next: (jobsite) => {
          console.log('Received jobsite details:', jobsite);
          this.jobsite = jobsite;
        },
        error: (error) => {
          console.error('Error loading jobsite:', error);
          this.error = 'Failed to load jobsite';
          this.statusService.showMessage('Failed to load jobsite');
        }
      });
  }

  goBack() {
    this.router.navigate(['/jobsites']);
  }

  editJobsite() {
    if (this.jobsite) {
      this.router.navigate(['/jobsites', this.jobsite.id, 'edit']);
    }
  }
}

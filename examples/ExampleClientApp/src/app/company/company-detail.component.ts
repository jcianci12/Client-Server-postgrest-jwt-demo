import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { Client, CompanyResponse } from '../api/api';
import { StatusService } from '../services/status.service';
import { finalize } from 'rxjs';
import { CompanyUsersComponent } from '../dashboard/company-users.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CompanyCardComponent } from '../shared/company-card.component';

@Component({
  selector: 'app-company-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    CompanyUsersComponent,
    MatProgressSpinnerModule,
    CompanyCardComponent
  ],
  template: `
    <div class="company-detail-container">
      <div *ngIf="isLoading" class="loading-spinner">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <!-- Company Details Card -->
      <ng-container *ngIf="!isLoading">
        <app-company-card 
          *ngIf="company" 
          [company]="company"
          [showEditButton]="true"
          (edit)="editCompany()">
        </app-company-card>

        <!-- Users List -->
        <app-company-users 
          *ngIf="company?.id"
          [companyId]="company!.id">
        </app-company-users>

        <div *ngIf="error" class="error-message">
          {{error}}
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .company-detail-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .error-message {
      color: var(--mat-red-500);
      margin-top: 16px;
      text-align: center;
      padding: 16px;
      background: rgba(244, 67, 54, 0.1);
      border-radius: 4px;
    }

    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 20px;
    }

    @media (max-width: 600px) {
      .company-detail-container {
        padding: 12px;
      }
    }
  `]
})
export class CompanyDetailComponent implements OnInit {
  company?: CompanyResponse;
  error?: string;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private client: Client,
    private statusService: StatusService
  ) {}

  ngOnInit() {
    // Get the company ID from the route parameters
    this.route.params.subscribe(params => {
      const companyId = Number(params['id']);
      if (companyId && !isNaN(companyId)) {
        this.loadCompany(companyId);
      }
    });
  }

  loadCompany(companyId: number) {
    this.isLoading = true;
    this.error = undefined;
    this.statusService.showLoading();

    // Get the list of companies the user has access to
    this.client.list_user_companies_api_companies_my_companies_get()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.statusService.hideLoading();
        })
      )
      .subscribe({
        next: (companies: CompanyResponse[]) => {
          const company = companies.find(c => c.id === companyId);
          if (company) {
            this.company = company;
          } else {
            this.error = 'Company not found or you do not have access to it';
            this.statusService.showMessage('Company not found or access denied');
          }
        },
        error: (error: unknown) => {
          console.error('Error loading company:', error);
          this.error = 'Failed to load company details';
          this.statusService.showMessage('Failed to load company details');
        }
      });
  }

  editCompany() {
    if (this.company?.id) {
      this.router.navigate(['/company-setup', this.company.id]);
    }
  }
} 
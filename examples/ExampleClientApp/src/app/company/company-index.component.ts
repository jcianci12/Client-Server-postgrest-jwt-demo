import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { Client, CompanyResponse } from '../api/api';
import { StatusService } from '../services/status.service';
import { finalize, forkJoin, of, catchError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-company-index',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="company-container">
      <mat-card class="mat-mdc-card">
        <mat-card-header>
          <mat-card-title>Companies</mat-card-title>
          <div class="header-actions">
            <button mat-raised-button
                    color="primary"
                    (click)="createCompany()">
              <mat-icon>add</mat-icon>
              Create Company
            </button>
          </div>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="isLoading" class="loading-spinner">
            <mat-spinner diameter="40"></mat-spinner>
          </div>

          <div *ngIf="!isLoading">
            <div *ngIf="currentCompany" class="current-company">
              <h3>Current Company</h3>
              <div class="company-item active">
                <h3>{{currentCompany.name}}</h3>
                <p>{{currentCompany.address}}</p>
                <p>Contact: {{currentCompany.contact_number}}</p>
                <button mat-button color="primary" (click)="viewCompany(currentCompany)">
                  View Details
                </button>
              </div>
            </div>

            <div *ngIf="otherCompanies.length > 0" class="other-companies">
              <h3>Other Companies</h3>
              <div *ngFor="let company of otherCompanies" class="company-item">
                <h3>{{company.name}}</h3>
                <p>{{company.address}}</p>
                <p>Contact: {{company.contact_number}}</p>
                <button mat-button color="primary" (click)="selectCompany(company)">
                  Select Company
                </button>
              </div>
            </div>

            <div *ngIf="!currentCompany && otherCompanies.length === 0" class="no-companies">
              <p>No companies found. Create your first company to get started.</p>
            </div>
          </div>

          <div *ngIf="error" class="error-message">
            {{error}}
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .company-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header-actions {
      margin-left: auto;
    }
    .company-item {
      padding: 16px;
      margin: 16px 0;
      background: var(--mat-list-item-unselected-container-color);
      border-radius: 4px;
      transition: all 0.3s ease;
    }
    .company-item.active {
      border-left: 4px solid var(--mat-primary-500);
      background: var(--mat-list-item-selected-container-color);
    }
    .company-item h3 {
      margin: 0 0 8px 0;
    }
    .company-item p {
      margin: 4px 0;
      color: var(--mat-list-item-secondary-text-color);
    }
    .error-message {
      color: var(--mat-red-500);
      margin-top: 16px;
      text-align: center;
    }
    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 20px;
    }
    .current-company, .other-companies {
      margin-top: 20px;
    }
    .current-company h3, .other-companies h3 {
      color: var(--mat-primary-text-color);
      margin-bottom: 16px;
    }
    .no-companies {
      text-align: center;
      padding: 32px;
      color: var(--mat-list-item-secondary-text-color);
      background: var(--mat-list-item-unselected-container-color);
      border-radius: 4px;
      margin-top: 16px;
    }
  `]
})
export class CompanyIndexComponent implements OnInit {
  companies: CompanyResponse[] = [];
  currentCompany?: CompanyResponse;
  otherCompanies: CompanyResponse[] = [];
  error?: string;
  isLoading = false;

  constructor(
    private router: Router,
    private client: Client,
    private statusService: StatusService
  ) {}

  ngOnInit() {
    this.loadCompanies();
  }

  loadCompanies() {
    this.isLoading = true;
    this.error = undefined;

    // Load both current company and all companies in parallel
    forkJoin({
      current: this.client.get_current_company_api_companies_current_get().pipe(
        catchError(error => {
          if (error.status === 404) {
            return of(undefined);
          }
          throw error;
        })
      ),
      all: this.client.list_companies_api_companies__get()
    }).pipe(
      finalize(() => {
        this.isLoading = false;
        this.statusService.hideLoading();
      })
    ).subscribe({
      next: ({ current, all }) => {
        this.currentCompany = current;
        this.companies = all;

        // Filter out current company from other companies
        this.otherCompanies = all.filter(company =>
          !current || company.id !== current.id
        );
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading companies:', error);
        this.error = 'Failed to load companies. Please try again.';
        this.statusService.showMessage('Failed to load companies');
      }
    });
  }

  createCompany() {
    this.router.navigate(['/company-setup']);
  }

  selectCompany(company: CompanyResponse) {
    if (!company.id) return;

    this.statusService.showLoading();
    this.client.set_current_company_api_users_current_company__company_id__put(company.id)
      .pipe(finalize(() => this.statusService.hideLoading()))
      .subscribe({
        next: () => {
          this.statusService.showMessage('Company selected successfully');
          this.router.navigate(['/dashboard']);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error selecting company:', error);
          this.statusService.showMessage('Failed to select company');
        }
      });
  }

  viewCompany(company: CompanyResponse) {
    if (!company.id) return;
    this.router.navigate(['/company', company.id]);
  }
}

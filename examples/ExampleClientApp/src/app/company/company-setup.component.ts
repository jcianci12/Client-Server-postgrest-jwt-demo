import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StatusService } from '../services/status.service';
import { finalize } from 'rxjs';
import { Client, CompanyResponse, CompanyCreate, CompanyUpdate } from '../api/api';
import { UserStateService } from '../services/user-state.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-company-setup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="setup-container">
      <div *ngIf="isLoading" class="loading-spinner">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <mat-card *ngIf="!isLoading" class="mat-mdc-card">
        <mat-card-header>
          <mat-card-title>{{ isEditing ? 'Edit Company' : 'Company Registration' }}</mat-card-title>
          <mat-card-subtitle>{{ isEditing ? 'Update your company details' : 'Set up your company profile to get started' }}</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="companyForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="mat-mdc-form-field">
              <mat-label>Company Name</mat-label>
              <input matInput formControlName="name" required>
              <mat-error *ngIf="companyForm.get('name')?.errors?.['required']">
                Company name is required
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="mat-mdc-form-field">
              <mat-label>Company Address</mat-label>
              <textarea matInput formControlName="address" required rows="3"></textarea>
              <mat-error *ngIf="companyForm.get('address')?.errors?.['required']">
                Company address is required
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="mat-mdc-form-field">
              <mat-label>Contact Number</mat-label>
              <input matInput formControlName="contact_number" required>
              <mat-error *ngIf="companyForm.get('contact_number')?.errors?.['required']">
                Contact number is required
              </mat-error>
              <mat-error *ngIf="companyForm.get('contact_number')?.errors?.['pattern']">
                Please enter a valid phone number
              </mat-error>
            </mat-form-field>

            <div *ngIf="error" class="error-message">
              {{error}}
            </div>

            <div class="form-actions">
              <button mat-button type="button" (click)="cancel()">Cancel</button>
              <button mat-raised-button 
                      color="primary" 
                      type="submit"
                      [disabled]="!companyForm.valid || companyForm.pristine">
                {{ isEditing ? 'Update Company' : 'Register Company' }}
              </button>
            </div>
          </form>
        </mat-card-content>
        <mat-card-actions *ngIf="isEditing && companyId">
          <button mat-button color="primary" (click)="viewCompanyDetails()">
            Back to Company Details
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .setup-container {
      padding: 20px;
      max-width: 600px;
      margin: 0 auto;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .mat-mdc-form-field {
      width: 100%;
    }
    .error-message {
      color: var(--mat-red-500);
      margin: 8px 0;
      padding: 8px;
      border-radius: 4px;
      background-color: var(--mat-red-100);
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 16px;
    }
    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 20px;
    }
  `]
})
export class CompanySetupComponent implements OnInit {
  companyForm: FormGroup;
  error: string | null = null;
  isLoading = false;
  isEditing = false;
  companyId?: number;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private statusService: StatusService,
    private client: Client,
    private userState: UserStateService
  ) {
    this.companyForm = this.fb.group({
      name: ['', Validators.required],
      address: ['', Validators.required],
      contact_number: ['', [Validators.required, Validators.pattern('^[0-9+-]+$')]]
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = Number(params['id']);
      if (id && !isNaN(id)) {
        this.companyId = id;
        this.isEditing = true;
        this.loadCompany(id);
      }
    });
  }

  loadCompany(id: number) {
    this.isLoading = true;
    this.client.list_user_companies_api_companies_my_companies_get()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (companies) => {
          const company = companies.find(c => c.id === id);
          if (company) {
            this.companyForm.patchValue({
              name: company.name,
              address: company.address,
              contact_number: company.contact_number
            });
          } else {
            this.error = 'Company not found';
            this.statusService.showMessage('Company not found');
            this.router.navigate(['/companies']);
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error loading company:', error);
          this.error = 'Failed to load company';
          this.statusService.showMessage('Failed to load company');
          this.router.navigate(['/companies']);
        }
      });
  }

  onSubmit() {
    if (this.companyForm.valid) {
      this.statusService.showLoading();
      
      if (this.isEditing && this.companyId) {
        // Use the update endpoint for editing
        const updateRequest = new CompanyUpdate({
          name: this.companyForm.get('name')?.value,
          address: this.companyForm.get('address')?.value,
          contact_number: this.companyForm.get('contact_number')?.value
        });

        this.client.update_company_api_companies__company_id__patch(this.companyId, updateRequest)
          .pipe(finalize(() => this.statusService.hideLoading()))
          .subscribe({
            next: (company: CompanyResponse) => {
              this.userState.setCurrentCompany(company);
              this.router.navigate(['/company', company.id]);
              this.statusService.showMessage('Company updated successfully');
            },
            error: (error: HttpErrorResponse) => {
              console.error('Error updating company:', error);
              this.error = 'Failed to update company';
              this.statusService.showMessage(this.error);
            }
          });
      } else {
        // Create a new company
        const createRequest = new CompanyCreate({
          name: this.companyForm.get('name')?.value,
          address: this.companyForm.get('address')?.value,
          contact_number: this.companyForm.get('contact_number')?.value
        });

        this.client.create_company_api_companies__post(createRequest)
          .pipe(finalize(() => this.statusService.hideLoading()))
          .subscribe({
            next: (company: CompanyResponse) => {
              this.userState.setCurrentCompany(company);
              this.router.navigate(['/company', company.id]);
              this.statusService.showMessage('Company created successfully');
            },
            error: (error: HttpErrorResponse) => {
              console.error('Error creating company:', error);
              this.error = 'Failed to create company';
              this.statusService.showMessage(this.error);
            }
          });
      }
    }
  }

  cancel() {
    if (this.isEditing && this.companyId) {
      this.router.navigate(['/company', this.companyId]);
    } else {
      this.router.navigate(['/companies']);
    }
  }

  viewCompanyDetails() {
    if (this.companyId) {
      this.router.navigate(['/company', this.companyId]);
    }
  }
}

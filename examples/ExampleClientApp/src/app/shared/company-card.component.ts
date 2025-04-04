import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CompanyResponse, CompanyMember, UserRole } from '../api/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-company-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <mat-card *ngIf="company" class="company-card">
      <mat-card-header>
        <mat-card-title>{{ company.name }}</mat-card-title>
        <div *ngIf="showEditButton" class="header-actions">
          <button mat-raised-button
                  color="primary"
                  (click)="onEditClick()">
            <mat-icon>edit</mat-icon>
            Edit Company
          </button>
        </div>
      </mat-card-header>
      <mat-card-content>
        <div class="company-details">
          <p><strong>Address:</strong> {{ company.address || 'Not specified' }}</p>
          <p><strong>Contact:</strong> {{ company.contact_number || 'Not specified' }}</p>
          <p *ngIf="companyOwner"><strong>Owner:</strong> {{ companyOwner.name }} ({{ companyOwner.email }})</p>
          <p *ngIf="!companyOwner && company.members?.length"><strong>Owner:</strong> Not specified</p>
          <ng-content></ng-content>
        </div>
      </mat-card-content>
      <mat-card-actions *ngIf="showActions">
        <ng-container *ngIf="!isCurrentCompany && allowSelectCompany">
          <button mat-button color="primary" (click)="onSelectClick()">
            <mat-icon>check_circle</mat-icon>
            Select Company
          </button>
        </ng-container>
        <button mat-button color="primary" (click)="onViewClick()">
          <mat-icon>visibility</mat-icon>
          View Details
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .company-card {
      margin-bottom: 20px;
      width: 100%;
    }
    .header-actions {
      margin-left: auto;
    }
    .company-details {
      padding: 8px 0;
    }
    .company-details p {
      margin: 8px 0;
      color: var(--mat-list-item-secondary-text-color);
    }
  `]
})
export class CompanyCardComponent implements OnInit {
  @Input() company?: CompanyResponse;
  @Input() showEditButton = false;
  @Input() showActions = false;
  @Input() isCurrentCompany = false;
  @Input() allowSelectCompany = false;
  
  @Output() edit = new EventEmitter<CompanyResponse>();
  @Output() select = new EventEmitter<CompanyResponse>();
  @Output() view = new EventEmitter<CompanyResponse>();

  companyOwner?: CompanyMember;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.findCompanyOwner();
  }

  /**
   * Finds the company owner from the members array
   * The owner is typically the member with the Admin role
   */
  findCompanyOwner(): void {
    if (!this.company?.members?.length) return;

    // First try to find a member with Admin role
    this.companyOwner = this.company.members.find(member => 
      member.role === UserRole.Company_Admin
    );

    // If no admin found, try to find a member with System_admin role
    if (!this.companyOwner) {
      this.companyOwner = this.company.members.find(member => 
        member.role === UserRole.System_admin
      );
    }

    // If still no owner found, just use the first member
    if (!this.companyOwner && this.company.members.length > 0) {
      this.companyOwner = this.company.members[0];
    }
  }

  onEditClick(): void {
    if (this.company) {
      this.edit.emit(this.company);
    }
  }

  onSelectClick(): void {
    if (this.company) {
      this.select.emit(this.company);
    }
  }

  onViewClick(): void {
    if (this.company) {
      this.view.emit(this.company);
    }
  }
} 
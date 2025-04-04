import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { StatusService } from '../services/status.service';
import { finalize } from 'rxjs';
import { AddUserDialogComponent } from './add-user-dialog.component';
import { EditUserDialogComponent } from './edit-user-dialog.component';
import { UserResponse, Client } from '../api/api';

@Component({
  selector: 'app-company-users',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule
  ],
  template: `
    <mat-card class="mat-mdc-card">
      <mat-card-header>
        <mat-card-title>Company Users</mat-card-title>
        <div class="header-actions">
          <button mat-raised-button
                  color="primary"
                  (click)="addUser()">
            Add User
          </button>
        </div>
      </mat-card-header>
      <mat-card-content>
        <mat-list class="mat-mdc-list">
          <ng-container *ngIf="users.length > 0; else noUsers">
            <mat-list-item *ngFor="let user of users" class="mat-mdc-list-item">
              <mat-icon matListIcon>person</mat-icon>
              <span matListItemTitle>{{user.name}}</span>
              <span matListItemLine>{{user.email}}</span>
              <span matListItemLine>Role: {{user.role || 'Not assigned'}}</span>
              <div matListItemMeta>
                <button mat-icon-button color="primary" (click)="editUser(user)" aria-label="Edit user">
                  <mat-icon>edit</mat-icon>
                </button>
              </div>
            </mat-list-item>
          </ng-container>
          <ng-template #noUsers>
            <mat-list-item class="mat-mdc-list-item">
              <span matListItemTitle>No users found</span>
              <span matListItemLine>Add users using the button above</span>
            </mat-list-item>
          </ng-template>
        </mat-list>
        <div *ngIf="error" class="error-message">
          {{error}}
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .header-actions {
      margin-left: auto;
    }
    .error-message {
      color: red;
      padding: 16px;
    }
    :host ::ng-deep .mat-mdc-list-item {
      margin: 8px 0;
    }
    :host ::ng-deep .mat-mdc-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  `]
})
export class CompanyUsersComponent implements OnInit {
  @Input() companyId!: number;
  users: UserResponse[] = [];
  error?: string;

  constructor(
    private statusService: StatusService,
    private client: Client,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  addUser() {
    const dialogRef = this.dialog.open(AddUserDialogComponent, {
      width: '400px',
      data: { companyId: this.companyId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers(); // Refresh the user list
        this.statusService.showMessage('User added successfully');
      }
    });
  }

  editUser(user: UserResponse) {
    const dialogRef = this.dialog.open(EditUserDialogComponent, {
      width: '400px',
      data: { user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers(); // Refresh the user list
        this.statusService.showMessage('User updated successfully');
      }
    });
  }

  loadUsers() {
    if (!this.companyId) return;

    this.statusService.showLoading();
    this.client.list_users_for_company_api_users_company__company_id__get(this.companyId)
      .pipe(finalize(() => this.statusService.hideLoading()))
      .subscribe({
        next: (users: any[]) => {
          this.users = users;
        },
        error: (error: any) => {
          console.error('Error loading users:', error);
          this.error = 'Failed to load company users';
          this.statusService.showMessage('Failed to load company users');
        }
      });
  }
}

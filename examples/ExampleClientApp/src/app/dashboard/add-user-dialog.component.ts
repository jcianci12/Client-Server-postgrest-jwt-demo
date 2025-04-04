import { Component, Inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { StatusService } from '../services/status.service';
import { RolesService, RoleOption } from '../services/roles.service';
import { finalize } from 'rxjs';
import { UserCreate, UserResponse, UserRole, Role, Company_id } from '../api/api';
import { Client } from '../api/api';

@Component({
  selector: 'app-add-user-dialog',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    FormsModule
  ],
  template: `
    <div class="mat-mdc-dialog-content">
      <h2 mat-dialog-title>Add User to Company</h2>
      <mat-dialog-content>
        <p class="description">
          Add a user by their email address. They will have access to the company when they sign in with Google using this email.
        </p>
        <form #addUserForm="ngForm">
          <mat-form-field appearance="outline" class="mat-mdc-form-field full-width">
            <mat-label>User's Name</mat-label>
            <input matInput [(ngModel)]="name" name="name" required
                   placeholder="John Doe">
          </mat-form-field>

          <mat-form-field appearance="outline" class="mat-mdc-form-field full-width">
            <mat-label>User's Email</mat-label>
            <input matInput [(ngModel)]="email" name="email" required type="email"
                   placeholder="user@example.com">
            <mat-hint>Must match their Google account email</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="mat-mdc-form-field full-width">
            <mat-label>Role</mat-label>
            <mat-select [(ngModel)]="role" name="role" required>
              <mat-option *ngFor="let roleOption of roleOptions$ | async" [value]="roleOption.value">
                {{roleOption.label}}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </form>
        <div *ngIf="error" class="error-message">
          {{error}}
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="cancel()">Cancel</button>
        <button mat-raised-button
                color="primary"
                (click)="addUser()"
                [disabled]="!addUserForm.form.valid">
          Add User
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    :host ::ng-deep .mat-mdc-form-field {
      width: 100%;
      margin-bottom: 16px;
    }
    .error-message {
      color: red;
      margin-top: 8px;
    }
    .description {
      margin-bottom: 16px;
      color: rgba(0, 0, 0, 0.6);
    }
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
  `]
})
export class AddUserDialogComponent {
  email: string = '';
  name: string = '';
  role: UserRole | '' = '';
  error?: string;
  roleOptions$ = this.rolesService.roleOptions$;

  constructor(
    private dialogRef: MatDialogRef<AddUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: { companyId: number },
    private statusService: StatusService,
    public client: Client,
    private rolesService: RolesService
  ) {}

  addUser() {
    if (!this.email || !this.name || !this.role || !this.data.companyId) return;

    const validRole = this.rolesService.validateAndFormatRole(this.role);
    if (!validRole) {
      this.error = 'Invalid role selected';
      this.statusService.showMessage('Invalid role selected');
      return;
    }

    this.statusService.showLoading();

    const request = new UserCreate({
      email: this.email,
      name: this.name,
      role: validRole as unknown as Role,
      company_id: this.data.companyId as unknown as Company_id
    });

    this.client.create_user_api_users__post(request).pipe(
      finalize(() => this.statusService.hideLoading())
    ).subscribe({
      next: (user: UserResponse) => {
        this.dialogRef.close(true);
        this.statusService.showMessage('User created successfully');
      },
      error: (error: any) => {
        console.error('Complete error object:', JSON.stringify(error, null, 2));
        let errorMessage = 'Failed to create user';

        try {
          const errorResponse = JSON.parse(error.response);
          errorMessage = errorResponse.detail || errorMessage;
        } catch (e) {
          console.error('Error parsing error response:', e);
        }

        this.error = errorMessage;
        this.statusService.showMessage(errorMessage);
      }
    });
  }

  cancel() {
    this.dialogRef.close();
  }
}

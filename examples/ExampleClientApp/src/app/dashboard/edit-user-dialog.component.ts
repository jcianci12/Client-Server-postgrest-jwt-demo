import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { StatusService } from '../services/status.service';
import { RolesService } from '../services/roles.service';
import { finalize } from 'rxjs';
import { UserResponse, UserRole, Client, UserUpdate, role } from '../api/api';

@Component({
  selector: 'app-edit-user-dialog',
  standalone: true,
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
      <h2 mat-dialog-title>Edit User Role</h2>
      <mat-dialog-content>
        <div class="user-info">
          <p><strong>Name:</strong> {{user.name}}</p>
          <p><strong>Email:</strong> {{user.email}}</p>
          <p><strong>Current Role:</strong> {{rolesService.getRoleLabel(user.role)}}</p>
        </div>

        <form #editUserForm="ngForm">
          <mat-form-field appearance="outline" class="mat-mdc-form-field full-width">
            <mat-label>New Role</mat-label>
            <mat-select [(ngModel)]="selectedRole" name="role" required>
              <mat-option *ngFor="let role of roleOptions$ | async" [value]="role.value">
                {{role.label}}
              </mat-option>
            </mat-select>
            <mat-hint>Select the new role for this user</mat-hint>
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
                (click)="updateRole()"
                [disabled]="!editUserForm.form.valid || !isRoleChanged()">
          Update Role
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
    .user-info {
      margin-bottom: 20px;
      padding: 10px;
      background: rgba(0, 0, 0, 0.03);
      border-radius: 4px;
    }
    .user-info p {
      margin: 5px 0;
    }
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
  `]
})
export class EditUserDialogComponent {
  user: UserResponse;
  selectedRole: UserRole | null = null;
  error?: string;
  roleOptions$ = this.rolesService.roleOptions$;

  constructor(
    private dialogRef: MatDialogRef<EditUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: { user: UserResponse },
    private statusService: StatusService,
    private client: Client,
    public rolesService: RolesService
  ) {
    this.user = data.user;
    // Ensure we're using the validated role value
    this.selectedRole = this.rolesService.validateAndFormatRole(data.user.role as role);
  }

  isRoleChanged(): boolean {
    const currentRole = this.rolesService.validateAndFormatRole(this.user.role as role);
    return this.selectedRole !== null && currentRole !== this.selectedRole;
  }

  cancel() {
    this.dialogRef.close();
  }

  updateRole() {
    if (!this.selectedRole || !this.isRoleChanged()) return;

    this.statusService.showLoading();

    const userUpdate = new UserUpdate({
      role: this.selectedRole as unknown as role
    });

    this.client.update_user_api_users__user_id__put(this.user.id, userUpdate).pipe(
      finalize(() => this.statusService.hideLoading())
    ).subscribe({
      next: () => {
        this.dialogRef.close(true);
        this.statusService.showMessage('User role updated successfully');
      },
      error: (error: { response: string }) => {
        console.error('Error updating user role:', error);
        let errorMessage = 'Failed to update user role';

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
}

import { Injectable, inject, OnDestroy } from '@angular/core';
import { UserRole, role } from '../api/api';
import { BehaviorSubject, catchError, map, of, Subject, takeUntil } from 'rxjs';
import { Client } from '../api/api';
import { SessionService } from './session.service';
import { User } from 'oidc-client-ts';

export interface RoleOption {
  value: UserRole;
  label: string;
}

@Injectable({
  providedIn: 'root'
})
export class RolesService implements OnDestroy {
  private currentRoleSubject = new BehaviorSubject<UserRole | null>(null);
  public currentRole$ = this.currentRoleSubject.asObservable();
  private apiClient = inject(Client);
  private sessionService = inject(SessionService);
  private initialized = false;
  private roleOptionsInitialized = false;
  private roleOptionsSubject = new BehaviorSubject<RoleOption[]>([]);
  public roleOptions$ = this.roleOptionsSubject.asObservable();
  private destroy$ = new Subject<void>();
  private user: User | null = null;

  constructor() {
    console.log('RolesService constructed');

    // Subscribe to user changes
    this.sessionService.user$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      this.user = user;
      if (user) {
        this.initializeRoleOptions();  // Initialize options when user is authenticated
      } else {
        this.clearState();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private clearState() {
    console.log('Clearing role state');
    this.currentRoleSubject.next(null);
    this.initialized = false;
    this.roleOptionsInitialized = false;
    this.roleOptionsSubject.next([]);
  }

  private initializeRoleOptions(): void {
    if (this.roleOptionsInitialized) return;
    if (!this.user) {
      console.log('No authenticated user, skipping role options initialization');
      return;
    }

    // Generate role options from the UserRole enum
    const roleOptions: RoleOption[] = Object.values(UserRole).map(role => ({
      value: role as UserRole,
      label: this.formatRoleLabel(role)
    }));

    this.roleOptionsSubject.next(roleOptions);
    this.roleOptionsInitialized = true;
    console.log('Role options initialized:', roleOptions);
  }

  private formatRoleLabel(role: string): string {
    // Convert enum values like "System_admin" to "System Admin"
    return role.replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private async fetchCurrentRole(): Promise<void> {
    // Don't proceed if already initialized or no authenticated user
    const user = await this.sessionService.getUser();
    if (this.initialized || !user) {
      console.log('Skipping role fetch:', this.initialized ? 'already initialized' : 'no authenticated user');
      return;
    }

    console.log('User authenticated, fetching current role from /auth/me');
    this.apiClient.read_users_me_api_auth_me_get().pipe(
      map(user => {
        console.log('Received user data:', user);
        return this.validateAndFormatRole(user?.role as role);
      }),
      catchError(error => {
        console.error('Error fetching user role:', error);
        return of(null);
      })
    ).subscribe(role => {
      if (role) {
        this.initializeRoleOptions();
        console.log('Setting current role to:', role);
        this.currentRoleSubject.next(role);
        this.initialized = true;
      }
    });
  }

  setCurrentRole(role: UserRole | null) {
    if (!this.sessionService.getUser()) {
      console.log('Cannot set role: no authenticated user');
      return;
    }

    if (role) {
      this.initializeRoleOptions();
    }

    console.log('Manually setting current role to:', role);
    this.currentRoleSubject.next(role);
    this.initialized = true;
  }

  async getCurrentRole(): Promise<UserRole | null> {
    const user = await this.sessionService.getUser();
    if (!user) {
      console.log('Cannot get role: no authenticated user');
      return null;
    }

    if (!this.initialized) {
      await this.fetchCurrentRole();
    }
    return this.currentRoleSubject.value;
  }

  getRoleOptions(): RoleOption[] {
    return this.roleOptionsSubject.value;
  }

  async getRoleLabel(value: UserRole | role | undefined | null): Promise<string> {
    if (!value) return '';
    const roleOption = this.getRoleOptions().find(r => r.value === value);
    if (roleOption) return roleOption.label;
    return this.formatRoleLabel(String(value));
  }

  isValidRole(role: UserRole | role | undefined | null): boolean {
    if (!role) return false;
    return Object.values(UserRole).includes(role as UserRole);
  }

  validateAndFormatRole(role: UserRole | role | undefined | null): UserRole | null {
    if (!role) return null;
    if (this.isValidRole(role)) {
      return role as UserRole;
    }
    console.error(`Invalid role value: ${role}. Expected one of: ${Object.values(UserRole).join(', ')}`);
    return null;
  }

  // Call this method when user logs in or when role needs to be refreshed
  async refreshRole(): Promise<void> {
    const user = await this.sessionService.getUser();
    if (!user) {
      console.log('Cannot refresh role: no authenticated user');
      return;
    }

    console.log('Refreshing role');
    this.initialized = false;
    await this.fetchCurrentRole();
  }
}

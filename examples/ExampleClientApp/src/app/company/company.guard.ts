import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, map, catchError, of } from 'rxjs';
import { StatusService } from '../services/status.service';
import { UserStateService } from '../services/user-state.service';

/**
 * Guard that checks if the user has a company selected.
 * If not, redirects to company setup.
 * 
 * This guard is applied to all routes that require a company context,
 * which includes most of the application except for:
 * 1. Public routes (login, callback, check-in flow)
 * 2. Company setup/management routes
 * 
 * The guard works in conjunction with AuthGuard:
 * - AuthGuard ensures the user is authenticated
 * - CompanyGuard ensures the authenticated user has a company context
 */
@Injectable({
  providedIn: 'root'
})
export class CompanyGuard implements CanActivate {
  constructor(
    private router: Router,
    private userState: UserStateService,
    private statusService: StatusService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    // Don't check company on company-setup or onboarding routes
    if (state.url.includes('/company-setup') || 
        state.url.includes('/onboarding')) {
      console.log('CompanyGuard: Skipping company check for setup/onboarding route');
      return of(true);
    }

    console.log('CompanyGuard: Checking if user has a company');
    this.statusService.showMessage('Checking company access...', 0);

    return this.userState.checkCurrentCompany().pipe(
      map(company => {
        if (!company) {
          console.log('CompanyGuard: No company found, redirecting to company setup');
          this.statusService.showMessage('Please set up a company to continue', 3000);
          this.router.navigate(['/company-setup']);
          return false;
        }
        console.log('CompanyGuard: Company found, allowing access', company);
        this.statusService.clearMessage();
        return true;
      }),
      catchError(error => {
        console.error('CompanyGuard: Error checking company', error);
        this.statusService.showMessage('Error checking company access', 3000);
        this.router.navigate(['/company-setup']);
        return of(false);
      })
    );
  }
}

import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { map, finalize, Observable, of, switchMap } from 'rxjs';
import { StatusService } from '../services/status.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router,
    private status: StatusService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    this.status.showMessage('Checking authentication...', 0);

    // Check the user observable
    return this.auth.user$.pipe(
      map(user => {
        if (!user || user.expired) {
          this.redirectToLogin(state.url);
          return false;
        }
        return true;
      }),
      finalize(() => {
        this.status.clearMessage();
      })
    );
  }

  private redirectToLogin(returnUrl: string): void {
    console.log('User not authenticated, redirecting to login with returnUrl:', returnUrl);
    this.status.showMessage('Please log in to continue...', 2000);

    // Store the URL we're trying to access so we can redirect back after login
    this.status.setLastVisitedUrl(returnUrl);

    this.router.navigate(['/login'], {
      queryParams: { returnUrl: returnUrl }
    });
  }
}

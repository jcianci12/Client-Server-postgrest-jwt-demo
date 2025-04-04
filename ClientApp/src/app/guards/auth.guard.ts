import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return from(this.authService.isAuthenticated().then(isAuth => {
      if (isAuth) {
        return true;
      }
      this.router.navigate(['/login']);
      return false;
    }));
  }
}

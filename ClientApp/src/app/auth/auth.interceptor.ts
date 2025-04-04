import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { from, switchMap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return from(authService.getToken()).pipe(
    switchMap(token => {
      if (token) {
        // Add required headers for PostgREST
        const headers = {
          Authorization: `Bearer ${token}`,
          'Prefer': 'return=representation'  // Return the updated/created record
        };

        req = req.clone({
          setHeaders: headers
        });
      }
      return next(req);
    })
  );
};

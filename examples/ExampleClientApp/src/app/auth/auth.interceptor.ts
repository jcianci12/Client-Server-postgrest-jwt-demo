import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize, switchMap, first, catchError } from 'rxjs/operators';
import { UIStateService } from '../services/ui-state.service';
import { AuthService } from './auth.service';
import { SessionService } from '../services/session.service';
import { from, throwError } from 'rxjs';
import { User } from 'oidc-client-ts';

// Add a request counter to handle concurrent requests
let activeRequests = 0;

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const uiStateService: UIStateService = inject(UIStateService);
  const authService = inject(AuthService);
  const sessionService = inject(SessionService);

  // Only show loading on the first request
  if (activeRequests === 0) {
    uiStateService.showLoading();
  }
  activeRequests++;

  // Skip authentication for Authentik requests and public endpoints
  if (req.url.includes('authentik') || req.url.includes('/public/')) {
    return next(req).pipe(
      finalize(() => {
        activeRequests--;
        if (activeRequests === 0) {
          uiStateService.hideLoading();
        }
      })
    );
  }

  // Get the user and add the token if available
  return from(sessionService.getUser()).pipe(
    first(),
    switchMap((user: User | null) => {
      if (user?.access_token) {
        const cloned = req.clone({
          headers: req.headers.set('Authorization', `Bearer ${user.access_token}`),
        });
        return next(cloned);
      }
      // If no user or token, attempt silent token renewal
      return from(authService.renewToken()).pipe(
        switchMap((renewedUser: User | null) => {
          if (renewedUser?.access_token) {
            const cloned = req.clone({
              headers: req.headers.set('Authorization', `Bearer ${renewedUser.access_token}`),
            });
            return next(cloned);
          }
          return next(req);
        }),
        catchError((renewError: unknown) => {
          activeRequests--;
          if (activeRequests === 0) {
            uiStateService.hideLoading();
          }
          return throwError(() => renewError);
        })
      );
    }),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        uiStateService.showMessage('Session expired. Logging in again...');
        return from(authService.login()).pipe(
          switchMap((user: User | null) => {
            if (user?.access_token) {
              const cloned = req.clone({
                headers: req.headers.set('Authorization', `Bearer ${user.access_token}`),
              });
              return next(cloned);
            }
            activeRequests--;
            if (activeRequests === 0) {
              uiStateService.hideLoading();
            }
            return throwError(() => new Error('Login failed'));
          }),
          catchError((loginError: unknown) => {
            activeRequests--;
            if (activeRequests === 0) {
              uiStateService.hideLoading();
            }
            return throwError(() => loginError);
          })
        );
      }
      activeRequests--;
      if (activeRequests === 0) {
        uiStateService.hideLoading();
      }
      return throwError(() => error);
    }),
    finalize(() => {
      activeRequests--;
      if (activeRequests === 0) {
        uiStateService.hideLoading();
      }
    })
  );
};

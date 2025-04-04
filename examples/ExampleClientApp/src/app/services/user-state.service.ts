import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, of, throwError, tap } from 'rxjs';
import { User } from 'oidc-client-ts';
import { Client, CompanyResponse } from '../api/api';
import { StatusService } from './status.service';
import { RolesService } from './roles.service';

@Injectable({
  providedIn: 'root'
})
export class UserStateService {
  private currentCompanySubject = new BehaviorSubject<CompanyResponse | null>(null);
  private userSubject = new BehaviorSubject<User | null>(null);
  
  currentCompany$ = this.currentCompanySubject.asObservable();
  user$ = this.userSubject.asObservable();
  
  private apiClient = inject(Client);
  private statusService = inject(StatusService);
  private rolesService = inject(RolesService);

  constructor() {
    console.log('UserStateService constructed');
  }

  updateUser(user: User | null) {
    this.userSubject.next(user);
    if (user) {
      this.rolesService.refreshRole();
    } else {
      this.rolesService.setCurrentRole(null);
    }
  }

  setCurrentCompany(company: CompanyResponse | null) {
    this.currentCompanySubject.next(company);
  }

  checkCurrentCompany(): Observable<CompanyResponse | null> {
    return this.apiClient.get_current_company_api_companies_current_get().pipe(
      tap(company => this.setCurrentCompany(company)),
      catchError(error => {
        console.error('Error fetching current company:', error);
        return of(null);
      })
    );
  }
}

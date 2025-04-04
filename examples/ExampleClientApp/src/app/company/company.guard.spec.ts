import { TestBed } from '@angular/core/testing';
import { CompanyGuard } from './company.guard';
import { Router } from '@angular/router';
import { Client } from '../api/api';
import { mockClient } from './testing/mock-client';
import { of, throwError } from 'rxjs';

describe('CompanyGuard', () => {
  let guard: CompanyGuard;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        CompanyGuard,
        { provide: Router, useValue: routerSpy },
        { provide: Client, useValue: mockClient }
      ]
    });

    guard = TestBed.inject(CompanyGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow activation when company exists', (done) => {
    guard.canActivate().subscribe(result => {
      expect(result).toBe(true);
      expect(routerSpy.navigate).not.toHaveBeenCalled();
      done();
    });
  });

  it('should redirect to setup when no company exists', (done) => {
    mockClient.get_current_company_api_companies_current_get.and.returnValue(of(null));

    guard.canActivate().subscribe(result => {
      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/company-setup']);
      done();
    });
  });

  it('should redirect to setup on error', (done) => {
    mockClient.get_current_company_api_companies_current_get.and.returnValue(throwError(() => new Error('Test error')));

    guard.canActivate().subscribe(result => {
      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/company-setup']);
      done();
    });
  });
});

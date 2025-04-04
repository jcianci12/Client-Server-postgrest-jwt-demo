import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { CompanySetupComponent } from '../company/company-setup.component';
import { Client, CompanyResponse, CompanyCreate, UserCreate, UserResponse, address, contact_number, Contact_number } from '../api/api';
import { StatusService } from '../services/status.service';
import { UserStateService } from '../services/user-state.service';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { User } from 'oidc-client-ts';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('Onboarding Flow Integration', () => {
  let component: CompanySetupComponent;
  let fixture: ComponentFixture<CompanySetupComponent>;
  let router: jasmine.SpyObj<Router>;
  let authService: jasmine.SpyObj<AuthService>;
  let client: jasmine.SpyObj<Client>;
  let statusService: StatusService;
  let userState: UserStateService;

  // Mock data
  const mockUser = new User({
    access_token: 'test_token',
    token_type: 'Bearer',
    profile: {
      sub: '123',
      name: 'Test User',
      email: 'test@example.com',
      iss: 'https://test-issuer.com',
      aud: 'test-client',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000)
    },
    expires_at: 1234567890
  });

  const mockAddress = new address({
    street: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zip: '12345'
  });

  const mockContactNumber = new Contact_number({
    country_code: '+1',
    number: '1234567890'
  });

  const mockCompany = new CompanyResponse({
    id: 1,
    name: 'Test Company',
    address: mockAddress,
    contact_number: mockContactNumber,
    created_at: new Date(),
    updated_at: new Date()
  });

  beforeEach(async () => {
    // Create spies
    router = jasmine.createSpyObj('Router', ['navigate']);
    authService = jasmine.createSpyObj('AuthService', ['login', 'logout'], {
      user$: new BehaviorSubject(mockUser)
    });
    client = jasmine.createSpyObj('Client', [
      'get_current_company_api_companies_current_get',
      'create_company_api_companies__post',
      'create_user_api_users__post'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        CompanySetupComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: authService },
        { provide: Client, useValue: client },
        StatusService,
        UserStateService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CompanySetupComponent);
    component = fixture.componentInstance;
    statusService = TestBed.inject(StatusService);
    userState = TestBed.inject(UserStateService);
  });

  describe('Authentication Flow', () => {
    it('should redirect new user to company setup', fakeAsync(() => {
      // Setup: User has no company
      client.get_current_company_api_companies_current_get.and.returnValue(throwError(() => ({ status: 404 })));
      
      // Initialize component
      fixture.detectChanges();
      tick();

      // Verify redirect didn't happen (we're already on company setup)
      expect(router.navigate).not.toHaveBeenCalled();
      expect(component).toBeTruthy();
    }));

    it('should redirect existing user to dashboard', fakeAsync(() => {
      // Setup: User has existing company
      client.get_current_company_api_companies_current_get.and.returnValue(of(mockCompany));
      
      // Initialize component
      fixture.detectChanges();
      tick();

      // Verify redirect to dashboard
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    }));
  });

  describe('Company Setup Flow', () => {
    beforeEach(() => {
      client.get_current_company_api_companies_current_get.and.returnValue(throwError(() => ({ status: 404 })));
    });

    it('should validate company form fields', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // Form should be invalid initially
      expect(component.companyForm.valid).toBeFalsy();

      // Fill in valid data
      component.companyForm.patchValue({
        name: 'Test Company',
        address: mockAddress,
        contact_number: mockContactNumber
      });

      // Form should be valid
      expect(component.companyForm.valid).toBeTruthy();
    }));

    it('should create company successfully', fakeAsync(() => {
      client.create_company_api_companies__post.and.returnValue(of(mockCompany));
      
      fixture.detectChanges();
      tick();

      // Fill and submit form
      component.companyForm.patchValue({
        name: 'Test Company',
        address: mockAddress,
        contact_number: mockContactNumber
      });

      component.onSubmit();
      tick();

      // Verify company creation and redirect
      expect(client.create_company_api_companies__post).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    }));

    it('should handle API errors during company creation', fakeAsync(() => {
      const errorMessage = 'Company creation failed';
      client.create_company_api_companies__post.and.returnValue(
        throwError(() => new Error(errorMessage))
      );

      fixture.detectChanges();
      tick();

      // Fill and submit form
      component.companyForm.patchValue({
        name: 'Test Company',
        address: mockAddress,
        contact_number: mockContactNumber
      });

      component.onSubmit();
      tick();

      // Verify error handling
      expect(component.error).toBeTruthy();
      expect(router.navigate).not.toHaveBeenCalled();
    }));
  });
}); 
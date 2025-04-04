import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompanySetupComponent } from './company-setup.component';
import { Router } from '@angular/router';
import { Client, CompanyCreate } from '../api/api';
import { StatusService } from '../services/status.service';
import { mockClient, mockCompanyResponse, mockAddress, mockContactNumber } from './testing/mock-client';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { throwError } from 'rxjs';

describe('CompanySetupComponent', () => {
  let component: CompanySetupComponent;
  let fixture: ComponentFixture<CompanySetupComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let statusService: StatusService;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [CompanySetupComponent, NoopAnimationsModule],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: Client, useValue: mockClient },
        StatusService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CompanySetupComponent);
    component = fixture.componentInstance;
    statusService = TestBed.inject(StatusService);
    spyOn(statusService, 'showLoading');
    spyOn(statusService, 'hideLoading');
    spyOn(statusService, 'showMessage');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.companyForm.get('name')?.value).toBe('');
    expect(component.companyForm.get('address')?.value).toBe('');
    expect(component.companyForm.get('contact_number')?.value).toBe('');
  });

  it('should validate required fields', () => {
    expect(component.companyForm.valid).toBeFalsy();

    component.companyForm.patchValue({
      name: 'Test Company',
      address: mockAddress,
      contact_number: mockContactNumber
    });

    expect(component.companyForm.valid).toBeTruthy();
  });

  it('should submit form and create company', () => {
    const formData = new CompanyCreate({
      name: 'Test Company',
      address: mockAddress,
      contact_number: mockContactNumber
    });

    component.companyForm.patchValue(formData);

    component.onSubmit();

    expect(mockClient.create_company_api_companies_post).toHaveBeenCalledWith(formData);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
    expect(statusService.showMessage).toHaveBeenCalledWith('Company created successfully');
  });

  it('should handle error on form submission', () => {
    mockClient.create_company_api_companies_post.and.returnValue(throwError(() => new Error('Test error')));

    component.companyForm.patchValue({
      name: 'Test Company',
      address: mockAddress,
      contact_number: mockContactNumber
    });

    component.onSubmit();

    expect(component.error).toBeTruthy();
    expect(statusService.showMessage).toHaveBeenCalledWith('Failed to create company');
  });

  it('should navigate back on cancel', () => {
    component.cancel();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });
});

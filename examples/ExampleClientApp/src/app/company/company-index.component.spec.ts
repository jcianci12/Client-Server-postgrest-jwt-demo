import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompanyIndexComponent } from './company-index.component';
import { Router } from '@angular/router';
import { Client, CompanyResponse } from '../api/api';
import { StatusService } from '../services/status.service';
import { mockClient, mockCompanyResponse } from './testing/mock-client';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

describe('CompanyIndexComponent', () => {
  let component: CompanyIndexComponent;
  let fixture: ComponentFixture<CompanyIndexComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let statusService: StatusService;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [CompanyIndexComponent, NoopAnimationsModule],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: Client, useValue: mockClient },
        StatusService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CompanyIndexComponent);
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

  it('should load companies on init', () => {
    expect(mockClient.get_companies_api_companies_get).toHaveBeenCalled();
    expect(component.companies).toEqual([mockCompanyResponse as CompanyResponse]);
  });

  it('should handle error when loading companies', () => {
    mockClient.get_companies_api_companies_get.and.returnValue(throwError(() => new Error('Test error')));
    
    component.ngOnInit();
    
    expect(component.error).toBeTruthy();
    expect(statusService.showMessage).toHaveBeenCalledWith('Failed to load companies');
  });

  it('should select company and navigate to dashboard', () => {
    component.selectCompany(mockCompanyResponse as CompanyResponse);

    expect(mockClient.set_current_company_api_users_current_company__company_id__put).toHaveBeenCalledWith(mockCompanyResponse.id);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(statusService.showMessage).toHaveBeenCalledWith(`Selected ${mockCompanyResponse.name} as your current company`);
  });

  it('should handle error when selecting company', () => {
    mockClient.set_current_company_api_users_current_company__company_id__put.and.returnValue(throwError(() => new Error('Test error')));
    
    component.selectCompany(mockCompanyResponse as CompanyResponse);
    
    expect(component.error).toBeTruthy();
    expect(statusService.showMessage).toHaveBeenCalledWith('Failed to set current company');
  });
});

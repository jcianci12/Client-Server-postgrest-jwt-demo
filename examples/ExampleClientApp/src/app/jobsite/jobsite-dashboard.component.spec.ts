import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { JobsiteDashboardComponent } from './jobsite-dashboard.component';
import { StatusService } from '../services/status.service';
import { MatDialog, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { Client, JobsiteResponse, DiaryEntryResponse, JobsiteStatus, weather4, CompanyResponse, UserRole } from '../api/api';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EditJobsiteDialogComponent } from './edit-jobsite-dialog.component';
import { AuthService } from '../auth/auth.service';
import { SessionService } from '../services/session.service';
import { UserStateService } from '../services/user-state.service';
import { RolesService } from '../services/roles.service';
import { NgZone, ViewContainerRef, Component, ComponentRef } from '@angular/core';
import { User } from 'oidc-client-ts';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ApplicationConfig, ChangeDetectorRef } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Overlay, OverlayContainer, ScrollStrategyOptions, BlockScrollStrategy, OverlayModule } from '@angular/cdk/overlay';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { JobsiteService } from '../services/jobsite.service';
import { OnDestroy } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';

@Component({
  selector: 'app-mock-dialog',
  template: '',
  standalone: true
})
class MockDialogContainerComponent implements OnDestroy {
  ngOnDestroy() {}
}

const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi())
  ]
};

describe('JobsiteDashboardComponent', () => {
  let component: JobsiteDashboardComponent;
  let fixture: ComponentFixture<JobsiteDashboardComponent>;
  let mockClient: jasmine.SpyObj<Client>;
  let mockStatusService: jasmine.SpyObj<StatusService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockAuthService: any;
  let roleSubject: BehaviorSubject<string>;

  // Mock data
  const mockJobsites: JobsiteResponse[] = [
    new JobsiteResponse({
      id: 1,
      name: 'Test Jobsite',
      address: '123 Test St',
      status: JobsiteStatus.Active,
      company_id: 1,
      created_at: new Date(),
      updated_at: new Date(),
      diary_entry_count: 5,
      company: new CompanyResponse({
        id: 1,
        name: 'Test Company',
        created_at: new Date(),
        updated_at: new Date()
      })
    })
  ];

  const mockDiaryEntries: DiaryEntryResponse[] = [
    new DiaryEntryResponse({
      id: 1,
      site_id: 1,
      date: new Date(),
      weather: new weather4({ value: 'Sunny' }),
      work_completed: 'Test activity',
      created_at: new Date(),
      updated_at: new Date(),
      created_by_id: 1
    })
  ];

  const mockUser = new User({
    access_token: 'test_token',
    token_type: 'Bearer',
    profile: {
      sub: '123',
      name: 'Test User',
      iss: 'https://test-issuer.com',
      aud: 'test-client',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000)
    },
    scope: 'openid profile',
    expires_at: 1234567890,
    session_state: 'test_session'
  });

  const mockCompany = new CompanyResponse({
    id: 1,
    name: 'Test Company',
    created_at: new Date(),
    updated_at: new Date()
  });

  beforeEach(async () => {
    mockClient = jasmine.createSpyObj('Client', [
      'get_jobsites_api_jobsites_get',
      'get_site_diary_entries_api_diary__site_id__get'
    ]);

    mockStatusService = jasmine.createSpyObj('StatusService', [
      'showMessage',
      'setLastVisitedJobsite'
    ]);

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    (mockDialog.open as jasmine.Spy).and.returnValue({
      afterClosed: () => of(true)
    });

    roleSubject = new BehaviorSubject<string>('Admin');
    mockAuthService = {
      currentRole$: roleSubject.asObservable()
    };

    await TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: Client, useValue: mockClient },
        { provide: StatusService, useValue: mockStatusService },
        { provide: Router, useValue: mockRouter },
        { provide: MatDialog, useValue: mockDialog },
        { 
          provide: Overlay, 
          useValue: {
            scrollStrategies: {
              block: () => ({
                attach: () => {},
                enable: () => {},
                disable: () => {},
                _attachedOverlay: null
              })
            },
            position: () => ({
              global: () => ({
                centerHorizontally: () => ({
                  centerVertically: () => ({})
                })
              })
            }),
            create: () => ({
              attach: () => {},
              dispose: () => {}
            })
          }
        },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    mockClient.get_jobsites_api_jobsites_get.and.returnValue(of([mockJobsites[0]]));
    mockClient.get_site_diary_entries_api_diary__site_id__get.and.returnValue(of([]));

    fixture = TestBed.createComponent(JobsiteDashboardComponent);
    component = fixture.componentInstance;
    component.jobsites = [];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should handle 403 Forbidden error', fakeAsync(() => {
    const error = { status: 403, message: 'Forbidden' };
    mockClient.get_jobsites_api_jobsites_get.and.returnValue(throwError(() => error));
    component.loadJobsites();
    tick(100);
    fixture.detectChanges();
    tick(100);
    expect(mockStatusService.showMessage).toHaveBeenCalledWith('Failed to load jobsites');
  }));

  it('should load jobsites successfully', fakeAsync(() => {
    mockClient.get_jobsites_api_jobsites_get.and.returnValue(of(mockJobsites));
    component.loadJobsites();
    tick(100);
    fixture.detectChanges();
    tick(100);
    expect(mockStatusService.showLoading).toHaveBeenCalled();
    expect(mockStatusService.hideLoading).toHaveBeenCalled();
    expect(component.jobsites).toEqual(mockJobsites);
  }));

  it('should redirect to login if not authenticated', fakeAsync(() => {
    const error = { status: 401, message: 'Unauthorized' };
    mockClient.get_jobsites_api_jobsites_get.and.returnValue(throwError(() => error));
    component.loadJobsites();
    tick(100);
    fixture.detectChanges();
    tick(100);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  }));

  it('should open dialog and reload on success', fakeAsync(() => {
    component.addJobsite();
    tick(100);
    fixture.detectChanges();
    tick(100);
    expect(mockDialog.open).toHaveBeenCalled();
    expect(mockClient.get_jobsites_api_jobsites_get).toHaveBeenCalled();
  }));

  it('should open dialog with jobsite data and reload on success', fakeAsync(() => {
    const jobsite = mockJobsites[0];
    component.editJobsite(jobsite);
    tick(100);
    fixture.detectChanges();
    tick(100);
    expect(mockDialog.open).toHaveBeenCalled();
    expect(mockClient.get_jobsites_api_jobsites_get).toHaveBeenCalled();
  }));

  it('should navigate to jobsite overview', fakeAsync(() => {
    const jobsite = mockJobsites[0];
    component.viewJobsite(jobsite);
    tick(100);
    fixture.detectChanges();
    tick(100);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/jobsites', jobsite.id]);
  }));

  it('should display jobsite cards', fakeAsync(() => {
    component.jobsites = mockJobsites;
    fixture.detectChanges();
    tick(100);
    fixture.detectChanges();
    tick(100);
    const cards = fixture.nativeElement.querySelectorAll('mat-card');
    expect(cards.length).toBe(1);
  }));

  it('should show no jobsites message when empty', fakeAsync(() => {
    component.jobsites = [];
    fixture.detectChanges();
    tick(100);
    fixture.detectChanges();
    tick(100);
    const message = fixture.nativeElement.querySelector('.no-jobsites');
    expect(message.textContent).toContain('No jobsites found');
  }));

  it('should display correct status labels', fakeAsync(() => {
    component.jobsites = mockJobsites;
    fixture.detectChanges();
    tick(100);
    fixture.detectChanges();
    tick(100);
    const statusLabel = fixture.nativeElement.querySelector('.status-label');
    expect(statusLabel.textContent.trim().toLowerCase()).toBe('active');
  }));

  it('should redirect to login if not authenticated', fakeAsync(() => {
    mockClient.get_jobsites_api_jobsites_get.and.returnValue(throwError(() => ({ status: 401 })));
    fixture = TestBed.createComponent(JobsiteDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    expect(mockStatusService.showMessage).toHaveBeenCalledWith('Please log in to continue');
  }));

  it('should handle 403 Forbidden error', fakeAsync(() => {
    mockClient.get_jobsites_api_jobsites_get.and.returnValue(throwError(() => ({ status: 403 })));
    fixture = TestBed.createComponent(JobsiteDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
    expect(mockStatusService.showMessage).toHaveBeenCalledWith('Failed to load jobsites');
  }));

  it('should display jobsite cards', fakeAsync(() => {
    mockClient.get_jobsites_api_jobsites_get.and.returnValue(of([mockJobsites[0]]));
    fixture = TestBed.createComponent(JobsiteDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
    const cards = fixture.debugElement.queryAll(By.css('.jobsite-card'));
    expect(cards.length).toBe(1);
  }));

  it('should open dialog and reload on success', fakeAsync(() => {
    fixture = TestBed.createComponent(JobsiteDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    component.addJobsite();
    tick();
    
    expect(mockDialog.open).toHaveBeenCalled();
    expect(mockClient.get_jobsites_api_jobsites_get).toHaveBeenCalled();
  }));

  it('should open dialog with jobsite data and reload on success', fakeAsync(() => {
    fixture = TestBed.createComponent(JobsiteDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    component.editJobsite(mockJobsites[0]);
    tick();
    
    expect(mockDialog.open).toHaveBeenCalled();
    expect(mockClient.get_jobsites_api_jobsites_get).toHaveBeenCalled();
  }));
}); 
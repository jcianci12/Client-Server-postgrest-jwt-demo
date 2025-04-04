import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AddUserDialogComponent } from './add-user-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TEST_PROVIDERS, MockClient, MockStatusService } from '../testing/test-helpers';
import { of, throwError } from 'rxjs';
import { RolesService } from '../services/roles.service';
import { UserRole, UserResponse, Role, Company_id, UserCreate } from '../api/api';
import { StatusService } from '../services/status.service';

describe('AddUserDialogComponent', () => {
  let component: AddUserDialogComponent;
  let fixture: ComponentFixture<AddUserDialogComponent>;
  let mockClient: MockClient;
  let dialogRef: MatDialogRef<AddUserDialogComponent>;
  let mockRolesService: jasmine.SpyObj<RolesService>;
  let statusService: StatusService;

  const mockCompanyId = 1;

  beforeEach(async () => {
    mockRolesService = jasmine.createSpyObj('RolesService', ['validateAndFormatRole', 'getRoleOptions']);
    mockRolesService.getRoleOptions.and.returnValue([
      { value: UserRole.Employee, label: 'Employee' },
      { value: UserRole.System_admin, label: 'System Admin' }
    ]);
    mockRolesService.validateAndFormatRole.and.returnValue(UserRole.Employee);

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        NoopAnimationsModule,
        AddUserDialogComponent
      ],
      providers: [
        ...TEST_PROVIDERS,
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: MAT_DIALOG_DATA, useValue: { companyId: mockCompanyId } },
        { provide: RolesService, useValue: mockRolesService },
        { provide: StatusService, useClass: MockStatusService }
      ]
    }).compileComponents();

    mockClient = TestBed.inject(MockClient);
    dialogRef = TestBed.inject(MatDialogRef);
    statusService = TestBed.inject(StatusService);
    fixture = TestBed.createComponent(AddUserDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('User Addition', () => {
    const validUserData = {
      name: 'Test User',
      email: 'test@example.com',
      role: UserRole.Employee
    };

    beforeEach(() => {
      component.name = validUserData.name;
      component.email = validUserData.email;
      component.role = validUserData.role;
      fixture.detectChanges();
    });

    it('should create user successfully', fakeAsync(() => {
      const mockResponse = UserResponse.fromJS({
        id: 1,
        email: validUserData.email,
        name: validUserData.name,
        role: validUserData.role as unknown as Role
      });

      spyOn(mockClient, 'create_user_api_users__post').and.returnValue(of(mockResponse));

      component.addUser();
      tick();

      const expectedRequest = UserCreate.fromJS({
        email: validUserData.email,
        name: validUserData.name,
        role: validUserData.role as unknown as Role,
        company_id: mockCompanyId as unknown as Company_id
      });

      expect(mockClient.create_user_api_users__post).toHaveBeenCalledWith(expectedRequest);
      expect(dialogRef.close).toHaveBeenCalledWith(true);
      expect(component.error).toBeFalsy();
    }));

    it('should handle invalid role', fakeAsync(() => {
      mockRolesService.validateAndFormatRole.and.returnValue(null);
      component.role = '' as UserRole;
      
      component.addUser();
      tick();

      expect(component.error).toBe('Invalid role selected');
      expect(dialogRef.close).not.toHaveBeenCalled();
    }));

    it('should handle API error', fakeAsync(() => {
      const errorResponse = {
        error: { detail: 'User already exists' }
      };
      spyOn(mockClient, 'create_user_api_users__post').and.returnValue(
        throwError(() => errorResponse)
      );

      component.addUser();
      tick();

      expect(mockClient.create_user_api_users__post).toHaveBeenCalled();
      expect(component.error).toBe('User already exists');
      expect(dialogRef.close).not.toHaveBeenCalled();
    }));
  });
});
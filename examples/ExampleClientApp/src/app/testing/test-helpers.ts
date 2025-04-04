import { HttpClient, HttpEvent, HttpHeaders, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { API_BASE_URL, Client, UserRole as ApiUserRole } from '../api/api';

// Mock Status Service
interface StatusState {
  loading: boolean;
  message?: string;
}

@Injectable()
export class MockStatusService {
  private state = new BehaviorSubject<StatusState>({ loading: false });

  showLoading() {
    this.state.next({ ...this.state.value, loading: true });
  }

  hideLoading() {
    this.state.next({ ...this.state.value, loading: false });
  }

  showMessage(message: string) {
    this.state.next({ ...this.state.value, message });
  }

  clearMessage() {
    this.state.next({ ...this.state.value, message: undefined });
  }

  setLoading(loading: boolean) {
    this.state.next({ ...this.state.value, loading });
  }

  setLastVisitedJobsite(jobsite: any) {
    // Mock implementation
  }

  getLastVisitedJobsite() {
    return null;
  }

  clearLastVisitedJobsite() {
    // Mock implementation
  }
}

// Mock HttpClient
@Injectable()
export class MockHttpClient {
  get<T>(url: string): Observable<T> {
    return of({} as T);
  }

  post<T>(url: string, body: any): Observable<T> {
    return of({} as T);
  }

  put<T>(url: string, body: any): Observable<T> {
    return of({} as T);
  }

  delete<T>(url: string): Observable<T> {
    return of({} as T);
  }
}

// Mock MatDialog
@Injectable()
export class MockMatDialog {
  private dialogRefs: MatDialogRef<any>[] = [];

  open(component: any, config?: any): MatDialogRef<any> {
    const dialogRef = {
      afterClosed: () => of(undefined),
      close: (result?: any) => {
        const index = this.dialogRefs.indexOf(dialogRef as MatDialogRef<any>);
        if (index > -1) {
          this.dialogRefs.splice(index, 1);
        }
      },
      componentInstance: {},
      beforeClosed: () => of(undefined),
      backdropClick: () => of(undefined),
      keydownEvents: () => of(undefined),
      updatePosition: (position?: any) => {},
      updateSize: (width?: string, height?: string) => {},
      getState: () => 'open',
      addPanelClass: (classes: string | string[]) => {},
      removePanelClass: (classes: string | string[]) => {},
      _containerInstance: {
        _config: config || {}
      }
    } as unknown as MatDialogRef<any>;

    this.dialogRefs.push(dialogRef);
    return dialogRef;
  }

  closeAll() {
    while (this.dialogRefs.length) {
      const ref = this.dialogRefs[0];
      ref.close();
    }
  }
}

// Mock Client
@Injectable()
export class MockClient {
  test_auth_api_auth_test_get(): Observable<any> {
    return of({ message: 'Test success' });
  }

  login_api_auth_token_post(): Observable<any> {
    return of({ access_token: 'test_token' });
  }

  read_users_me_api_auth_me_get(): Observable<any> {
    return of({
      email: 'test@example.com',
      role: ApiUserRole.System_admin,
    });
  }

  create_user_api_users__post(body: any): Observable<any> {
    return of({
      id: 1,
      email: body.email,
      role: body.role,
    });
  }

  create_company_api_companies__post(body: any): Observable<any> {
    return of({
      id: 1,
      name: body.name,
      address: body.address,
      contact_number: body.contact_number,
      created_at: new Date(),
      updated_at: new Date(),
      members: []
    });
  }

  read_companies_api_companies__get(): Observable<any> {
    return of([{
      id: 1,
      name: 'Test Company',
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        postal_code: '12345'
      },
      contact_number: {
        country_code: '+1',
        number: '1234567890'
      },
      created_at: new Date(),
      updated_at: new Date(),
      members: []
    }]);
  }

  read_jobsites_api_jobsites__get(): Observable<any> {
    return of([{
      id: 1,
      name: 'Test Jobsite',
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        postal_code: '12345'
      },
      status: 'Active',
      created_at: new Date(),
      updated_at: new Date()
    }]);
  }

  create_jobsite_api_jobsites__post(body: any): Observable<any> {
    return of({
      id: 1,
      name: body.name,
      address: body.address,
      status: body.status,
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  update_jobsite_api_jobsites__jobsite_id__put(jobsite_id: number, body: any): Observable<any> {
    return of({
      id: jobsite_id,
      name: body.name,
      address: body.address,
      status: body.status,
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  delete_jobsite_api_jobsites__jobsite_id__delete(jobsite_id: number): Observable<any> {
    return of({});
  }

  read_inspections_api_jobsites__jobsite_id__inspections__get(jobsite_id: number): Observable<any> {
    return of([{
      id: 1,
      jobsite_id: jobsite_id,
      inspector: 'Test Inspector',
      inspection_date: new Date(),
      notes: 'Test Notes',
      created_at: new Date(),
      updated_at: new Date()
    }]);
  }

  create_inspection_api_jobsites__jobsite_id__inspections__post(jobsite_id: number, body: any): Observable<any> {
    return of({
      id: 1,
      jobsite_id: jobsite_id,
      inspector: body.inspector,
      inspection_date: body.inspection_date,
      notes: body.notes,
      created_at: new Date(),
      updated_at: new Date()
    });
  }
}

// Common test providers
export const TEST_PROVIDERS = [
  { provide: Client, useClass: MockClient },
  { provide: API_BASE_URL, useValue: 'http://test.api' },
  { provide: MatDialog, useClass: MockMatDialog },
  { provide: HttpClient, useClass: MockHttpClient },
  { provide: 'StatusService', useClass: MockStatusService }
];

// Helper function to create a mock client with custom behavior
export function createMockClient(overrides: Partial<Client> = {}): Client {
  const mockClient = new MockClient();
  return { ...mockClient, ...overrides } as Client;
} 
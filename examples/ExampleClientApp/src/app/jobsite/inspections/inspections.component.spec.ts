import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { InspectionsComponent } from './inspections.component';
import { ActivatedRoute } from '@angular/router';
import { StatusService } from '../../services/status.service';
import { Client, InspectionResponse, InspectionCreate, InspectionUpdate } from '../../api/api';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { of, Subject, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AddInspectionDialogComponent } from './add-inspection-dialog/add-inspection-dialog.component';
import { EditInspectionDialogComponent } from './edit-inspection-dialog/edit-inspection-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Component, OnDestroy } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

class MatDialogMock {
  open<T = any>(component: any, config?: any) {
    return {
      afterClosed: () => of<T>(null as any)
    };
  }
}

@Component({
  selector: 'app-mock-dialog',
  template: '',
  standalone: true
})
class MockDialogComponent implements OnDestroy {
  ngOnDestroy() {}
}

describe('InspectionsComponent', () => {
  let component: InspectionsComponent;
  let fixture: ComponentFixture<InspectionsComponent>;
  let mockClient: jasmine.SpyObj<Client>;
  let mockDialog: MatDialogMock;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockStatusService: jasmine.SpyObj<StatusService>;
  let mockParamMap: Subject<any>;

  const mockInspection = new InspectionResponse({
    id: 1,
    company_name: 'Test Company',
    item_inspected: 'Test Item',
    notes: undefined,
    jobsite_id: 1,
    created_at: new Date(),
    updated_at: undefined
  });

  const mockInspections: InspectionResponse[] = [mockInspection];

  beforeEach(async () => {
    mockClient = jasmine.createSpyObj('Client', [
      'get_inspections_by_jobsite_api_inspections_jobsites__jobsite_id__inspections__get',
      'create_inspection_api_inspections__post',
      'update_inspection_api_inspections_inspections__inspection_id__put',
      'delete_inspection_api_inspections_inspections__inspection_id__delete'
    ]);

    mockDialog = new MatDialogMock();
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    mockStatusService = jasmine.createSpyObj('StatusService', ['setStatus']);
    mockParamMap = new Subject();

    await TestBed.configureTestingModule({
      imports: [
        InspectionsComponent,
        NoopAnimationsModule,
        MatDialogModule,
        MatSnackBarModule,
        MatTableModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MockDialogComponent,
        AddInspectionDialogComponent,
        EditInspectionDialogComponent,
        ConfirmDialogComponent,
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        ReactiveFormsModule
      ],
      providers: [
        { provide: Client, useValue: mockClient },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: StatusService, useValue: mockStatusService },
        {
          provide: ActivatedRoute,
          useValue: {
            parent: {
              params: mockParamMap.asObservable()
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InspectionsComponent);
    component = fixture.componentInstance;
    component.siteId = 1;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load inspections when jobsite ID is provided', fakeAsync(() => {
    mockClient.get_inspections_by_jobsite_api_inspections_jobsites__jobsite_id__inspections__get
      .and.returnValue(of(mockInspections));

    fixture.detectChanges();
    mockParamMap.next({ id: '1' });
    tick();
    fixture.detectChanges();

    expect(mockClient.get_inspections_by_jobsite_api_inspections_jobsites__jobsite_id__inspections__get)
      .toHaveBeenCalledWith(1);
    expect(component.inspectionsList).toEqual(mockInspections);
  }));

  it('should show error snackbar when loading inspections fails', fakeAsync(() => {
    mockClient.get_inspections_by_jobsite_api_inspections_jobsites__jobsite_id__inspections__get
      .and.returnValue(throwError(() => new Error('Test error')));

    fixture.detectChanges();
    mockParamMap.next({ id: '1' });
    tick();
    fixture.detectChanges();

    expect(mockSnackBar.open)
      .toHaveBeenCalledWith('Error loading inspections', 'Close', { duration: 3000 });
  }));

  it('should open add inspection dialog and create inspection on submit', fakeAsync(() => {
    const dialogData = {
      company_name: 'New Company',
      item_inspected: 'New Item',
      notes: undefined
    };

    spyOn(mockDialog, 'open').and.returnValue({
      afterClosed: () => of(dialogData)
    });
    
    const newInspection = new InspectionResponse({
      id: 2,
      company_name: dialogData.company_name,
      item_inspected: dialogData.item_inspected,
      notes: dialogData.notes,
      jobsite_id: 1,
      created_at: new Date(),
      updated_at: undefined
    });

    mockClient.create_inspection_api_inspections__post.and.returnValue(of(newInspection));
    mockClient.get_inspections_by_jobsite_api_inspections_jobsites__jobsite_id__inspections__get
      .and.returnValue(of([...mockInspections, newInspection]));

    component.addInspection();
    tick();

    expect(mockDialog.open).toHaveBeenCalledWith(AddInspectionDialogComponent, {
      width: '500px',
      data: { jobsiteId: 1 }
    });

    expect(mockClient.create_inspection_api_inspections__post).toHaveBeenCalledWith(
      new InspectionCreate({
        company_name: dialogData.company_name,
        item_inspected: dialogData.item_inspected,
        notes: dialogData.notes,
        jobsite_id: 1
      })
    );

    expect(mockSnackBar.open)
      .toHaveBeenCalledWith('Inspection added successfully', 'Close', { duration: 3000 });
  }));

  it('should open edit inspection dialog and update inspection on submit', fakeAsync(() => {
    const dialogData = {
      company_name: 'Updated Company',
      item_inspected: 'Updated Item',
      notes: undefined
    };

    spyOn(mockDialog, 'open').and.returnValue({
      afterClosed: () => of(dialogData)
    });

    const updatedInspection = new InspectionResponse({
      ...mockInspection,
      company_name: dialogData.company_name,
      item_inspected: dialogData.item_inspected,
      notes: dialogData.notes
    });

    mockClient.update_inspection_api_inspections_inspections__inspection_id__put.and.returnValue(of(updatedInspection));
    mockClient.get_inspections_by_jobsite_api_inspections_jobsites__jobsite_id__inspections__get
      .and.returnValue(of([updatedInspection]));

    component.editInspection(mockInspection);
    tick();

    expect(mockDialog.open).toHaveBeenCalledWith(EditInspectionDialogComponent, {
      width: '500px',
      data: { inspection: mockInspection }
    });

    expect(mockClient.update_inspection_api_inspections_inspections__inspection_id__put)
      .toHaveBeenCalledWith(mockInspection.id, 
        new InspectionUpdate({
          company_name: dialogData.company_name,
          item_inspected: dialogData.item_inspected,
          notes: dialogData.notes
        })
      );

    expect(mockSnackBar.open)
      .toHaveBeenCalledWith('Inspection updated successfully', 'Close', { duration: 3000 });
  }));

  it('should open confirm dialog and delete inspection on confirm', fakeAsync(() => {
    spyOn(mockDialog, 'open').and.returnValue({
      afterClosed: () => of(true)
    });

    mockClient.delete_inspection_api_inspections_inspections__inspection_id__delete.and.returnValue(of(void 0));
    mockClient.get_inspections_by_jobsite_api_inspections_jobsites__jobsite_id__inspections__get
      .and.returnValue(of([]));

    component.deleteInspection(mockInspection);
    tick();

    expect(mockDialog.open).toHaveBeenCalledWith(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Inspection',
        message: 'Are you sure you want to delete this inspection?'
      }
    });

    expect(mockClient.delete_inspection_api_inspections_inspections__inspection_id__delete)
      .toHaveBeenCalledWith(mockInspection.id);

    expect(mockSnackBar.open)
      .toHaveBeenCalledWith('Inspection deleted successfully', 'Close', { duration: 3000 });
  }));
}); 
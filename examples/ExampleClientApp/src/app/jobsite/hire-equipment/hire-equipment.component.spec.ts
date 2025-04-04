import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { HireEquipmentComponent } from './hire-equipment.component';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Client, HireEquipmentResponse, HireEquipmentUpdate, HireEquipmentCreate } from '../../api/api';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UIStateService } from '../../services/ui-state.service';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { HireEquipmentDialogComponent } from './hire-equipment-dialog.component';
import { Overlay } from '@angular/cdk/overlay';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@Component({
  selector: 'app-mock-dialog',
  template: '',
  standalone: true
})
class MockDialogComponent implements OnDestroy {
  ngOnDestroy() {}
}

describe('HireEquipmentComponent', () => {
  let component: HireEquipmentComponent;
  let fixture: ComponentFixture<HireEquipmentComponent>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let client: jasmine.SpyObj<Client>;
  let uiStateService: jasmine.SpyObj<UIStateService>;

  const mockEquipment: HireEquipmentResponse = {
    id: 1,
    item: 'Test Equipment',
    supplier_name: 'Test Supplier',
    reference_number: 'REF123',
    cost_per_day: 100,
    on_hire: new Date(),
    expected_return: new Date(),
    status: 'Active',
    jobsite_id: 1,
    created_at: new Date(),
    updated_at: new Date(),
    init: function() { return this; },
    toJSON: function() { return {}; }
  };

  beforeEach(async () => {
    client = jasmine.createSpyObj('Client', [
      'get_hire_equipment_by_jobsite_api_hire_equipment_jobsite__jobsite_id___get',
      'update_hire_equipment_api_hire_equipment__hire_equipment_id___put',
      'delete_hire_equipment_api_hire_equipment__hire_equipment_id___delete',
      'create_hire_equipment_api_hire_equipment__post'
    ]);

    snackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    dialog = jasmine.createSpyObj('MatDialog', ['open']);
    uiStateService = jasmine.createSpyObj('UIStateService', ['showLoading', 'hideLoading']);

    await TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        NoopAnimationsModule,
        CommonModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule,
        MatCardModule,
        MatChipsModule,
        HireEquipmentComponent
      ],
      providers: [
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: Client, useValue: client },
        { provide: UIStateService, useValue: uiStateService },
        { 
          provide: ActivatedRoute, 
          useValue: { 
            parent: { params: of({ id: '1' }) },
            params: of({ id: '1' })
          } 
        },
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
        }
      ]
    }).compileComponents();

    // Set up default successful responses
    client.get_hire_equipment_by_jobsite_api_hire_equipment_jobsite__jobsite_id___get.and.returnValue(of([mockEquipment]));
    client.update_hire_equipment_api_hire_equipment__hire_equipment_id___put.and.returnValue(of(mockEquipment));
    client.delete_hire_equipment_api_hire_equipment__hire_equipment_id___delete.and.returnValue(of(void 0));
    client.create_hire_equipment_api_hire_equipment__post.and.returnValue(of(mockEquipment));

    // Set up default dialog behavior
    const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    mockDialogRef.afterClosed.and.returnValue(of(mockEquipment));
    dialog.open.and.returnValue(mockDialogRef);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HireEquipmentComponent);
    component = fixture.componentInstance;
    component.jobsiteId = 1;
    
    // Ensure all injected services are initialized
    TestBed.inject(MatDialog);
    TestBed.inject(MatSnackBar);
    TestBed.inject(Client);
    TestBed.inject(UIStateService);
    TestBed.inject(ActivatedRoute);
    TestBed.inject(Overlay);
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load hire equipment on init', fakeAsync(() => {
    component.ngOnInit();
    tick(100);
    fixture.detectChanges();
    tick(100);

    expect(client.get_hire_equipment_by_jobsite_api_hire_equipment_jobsite__jobsite_id___get).toHaveBeenCalledWith(1);
    expect(component.hireEquipment).toEqual([mockEquipment]);
  }));

  it('should handle error when loading hire equipment', fakeAsync(() => {
    client.get_hire_equipment_by_jobsite_api_hire_equipment_jobsite__jobsite_id___get
      .and.returnValue(throwError(() => new Error('Failed to load')));

    component.loadHireEquipment();
    tick(100);
    fixture.detectChanges();
    tick(100);

    expect(snackBar.open).toHaveBeenCalledWith('Error loading hire equipment', 'Close', { duration: 3000 });
    expect(uiStateService.hideLoading).toHaveBeenCalled();
  }));

  it('should update equipment status', fakeAsync(() => {
    const updateData = new HireEquipmentUpdate({
      status: 'Returned'
    });
    
    component.updateStatus(mockEquipment);
    tick(100);
    fixture.detectChanges();
    tick(100);

    expect(client.update_hire_equipment_api_hire_equipment__hire_equipment_id___put)
      .toHaveBeenCalledWith(mockEquipment.id, updateData);
    expect(snackBar.open).toHaveBeenCalledWith('Equipment status updated successfully', 'Close', { duration: 3000 });
    expect(uiStateService.hideLoading).toHaveBeenCalled();
  }));

  it('should handle error when updating equipment status', fakeAsync(() => {
    client.update_hire_equipment_api_hire_equipment__hire_equipment_id___put
      .and.returnValue(throwError(() => new Error('Update failed')));

    component.updateStatus(mockEquipment);
    tick(100);
    fixture.detectChanges();
    tick(100);

    expect(snackBar.open).toHaveBeenCalledWith('Error updating equipment status', 'Close', { duration: 3000 });
    expect(uiStateService.hideLoading).toHaveBeenCalled();
  }));

  it('should delete hire equipment after confirmation', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(true);
    
    component.deleteHireEquipment(mockEquipment.id);
    tick(100);
    fixture.detectChanges();
    tick(100);

    expect(client.delete_hire_equipment_api_hire_equipment__hire_equipment_id___delete)
      .toHaveBeenCalledWith(mockEquipment.id);
    expect(snackBar.open).toHaveBeenCalledWith('Hire equipment deleted successfully', 'Close', { duration: 3000 });
    expect(uiStateService.hideLoading).toHaveBeenCalled();
  }));

  it('should handle error when deleting hire equipment', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(true);
    client.delete_hire_equipment_api_hire_equipment__hire_equipment_id___delete
      .and.returnValue(throwError(() => new Error('Delete failed')));

    component.deleteHireEquipment(mockEquipment.id);
    tick(100);
    fixture.detectChanges();
    tick(100);

    expect(snackBar.open).toHaveBeenCalledWith('Error deleting hire equipment', 'Close', { duration: 3000 });
    expect(uiStateService.hideLoading).toHaveBeenCalled();
  }));

  it('should open add dialog and create hire equipment', fakeAsync(() => {
    const mockDialogData = {
      jobsite_id: 1,
      item: 'New Equipment',
      on_hire: new Date(),
      init: function() { return this; },
      toJSON: function() { return {}; }
    };

    (dialog.open as jasmine.Spy).and.returnValue({
      afterClosed: () => of(mockDialogData)
    });

    component.openAddDialog();
    tick(100);
    fixture.detectChanges();
    tick(100);

    expect(dialog.open).toHaveBeenCalledWith(HireEquipmentDialogComponent, {
      width: '500px',
      data: { jobsiteId: 1 }
    });
    expect(client.create_hire_equipment_api_hire_equipment__post).toHaveBeenCalledWith(mockDialogData);
    expect(uiStateService.hideLoading).toHaveBeenCalled();
  }));

  it('should open edit dialog and update hire equipment', fakeAsync(() => {
    const mockDialogData = {
      status: 'Returned',
      init: function() { return this; },
      toJSON: function() { return {}; }
    };

    (dialog.open as jasmine.Spy).and.returnValue({
      afterClosed: () => of(mockDialogData)
    });

    component.openEditDialog(mockEquipment);
    tick(100);
    fixture.detectChanges();
    tick(100);

    expect(dialog.open).toHaveBeenCalledWith(HireEquipmentDialogComponent, {
      width: '500px',
      data: { equipment: mockEquipment }
    });
    expect(client.update_hire_equipment_api_hire_equipment__hire_equipment_id___put)
      .toHaveBeenCalledWith(mockEquipment.id, mockDialogData);
    expect(uiStateService.hideLoading).toHaveBeenCalled();
  }));

  it('should handle dialog cancel', fakeAsync(() => {
    (dialog.open as jasmine.Spy).and.returnValue({
      afterClosed: () => of(null)
    });

    component.openAddDialog();
    tick(100);
    fixture.detectChanges();
    tick(100);

    expect(client.create_hire_equipment_api_hire_equipment__post).not.toHaveBeenCalled();
    expect(uiStateService.hideLoading).toHaveBeenCalled();
  }));
}); 
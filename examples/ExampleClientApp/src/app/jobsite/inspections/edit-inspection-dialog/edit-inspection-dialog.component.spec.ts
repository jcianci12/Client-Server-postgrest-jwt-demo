import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditInspectionDialogComponent } from './edit-inspection-dialog.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { InspectionResponse } from '../../../api/api';
import { By } from '@angular/platform-browser';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

describe('EditInspectionDialogComponent', () => {
  let component: EditInspectionDialogComponent;
  let fixture: ComponentFixture<EditInspectionDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<EditInspectionDialogComponent>>;

  const mockInspection = new InspectionResponse({
    id: 1,
    company_name: 'Test Company',
    item_inspected: 'Test Item',
    notes: undefined,
    jobsite_id: 1,
    created_at: new Date(),
    updated_at: undefined
  });

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [
        EditInspectionDialogComponent,
        NoopAnimationsModule,
        FormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { inspection: mockInspection } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditInspectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with inspection data', () => {
    expect(component.formData).toEqual({
      company_name: mockInspection.company_name,
      item_inspected: mockInspection.item_inspected,
      notes: mockInspection.notes?.toString() || ''
    });
  });

  it('should handle undefined notes', () => {
    const inspectionWithoutNotes = new InspectionResponse({
      ...mockInspection,
      notes: undefined
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [
        EditInspectionDialogComponent,
        NoopAnimationsModule,
        FormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { inspection: inspectionWithoutNotes } }
      ]
    }).compileComponents();

    const newFixture = TestBed.createComponent(EditInspectionDialogComponent);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();

    expect(newComponent.formData.notes).toBe('');
  });

  it('should close dialog with null on cancel', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalledWith();
  });

  it('should submit updated form data', () => {
    const updatedData = {
      company_name: 'Updated Company',
      item_inspected: 'Updated Item',
      notes: 'Updated Notes'
    };

    component.formData = updatedData;
    component.onSubmit();

    expect(mockDialogRef.close).toHaveBeenCalledWith(updatedData);
  });

  it('should handle form validation', () => {
    // Get the company name input field
    const companyNameInput = fixture.debugElement.query(By.css('input[name="company_name"]')).nativeElement;
    
    // Initially valid with all required fields
    expect(companyNameInput.validity.valid).toBeTruthy();

    // Invalid when required field is empty
    companyNameInput.value = '';
    companyNameInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(companyNameInput.validity.valid).toBeFalsy();

    // Valid again when required field is filled
    companyNameInput.value = 'Test Company';
    companyNameInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(companyNameInput.validity.valid).toBeTruthy();
  });
}); 
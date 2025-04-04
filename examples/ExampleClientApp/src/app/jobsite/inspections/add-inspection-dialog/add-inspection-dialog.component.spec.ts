import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddInspectionDialogComponent } from './add-inspection-dialog.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';

describe('AddInspectionDialogComponent', () => {
  let component: AddInspectionDialogComponent;
  let fixture: ComponentFixture<AddInspectionDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AddInspectionDialogComponent>>;

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [
        AddInspectionDialogComponent,
        NoopAnimationsModule,
        ReactiveFormsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { jobsiteId: 1 } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddInspectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form', () => {
    expect(component.inspectionForm.get('company_name')?.value).toBe('');
    expect(component.inspectionForm.get('item_inspected')?.value).toBe('');
    expect(component.inspectionForm.get('notes')?.value).toBe('');
  });

  it('should validate required fields', () => {
    const form = component.inspectionForm;
    expect(form.valid).toBeFalsy();

    form.controls['company_name'].setValue('Test Company');
    expect(form.valid).toBeFalsy();

    form.controls['item_inspected'].setValue('Test Item');
    expect(form.valid).toBeTruthy();
  });

  it('should close dialog with null on cancel', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalledWith();
  });

  it('should not submit if form is invalid', () => {
    component.onSubmit();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it('should submit form data with jobsite ID when valid', () => {
    const testData = {
      company_name: 'Test Company',
      item_inspected: 'Test Item',
      notes: 'Test Notes'
    };

    component.inspectionForm.setValue(testData);
    component.onSubmit();

    expect(mockDialogRef.close).toHaveBeenCalledWith({
      ...testData,
      jobsite_id: 1
    });
  });

  it('should allow empty notes', () => {
    const testData = {
      company_name: 'Test Company',
      item_inspected: 'Test Item',
      notes: ''
    };

    component.inspectionForm.setValue(testData);
    expect(component.inspectionForm.valid).toBeTruthy();
  });
}); 
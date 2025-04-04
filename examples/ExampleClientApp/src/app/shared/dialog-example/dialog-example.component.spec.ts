import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { DialogExampleComponent, DialogData } from './dialog-example.component';

describe('DialogExampleComponent', () => {
  let component: DialogExampleComponent;
  let fixture: ComponentFixture<DialogExampleComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<DialogExampleComponent>>;
  
  const mockDialogData: DialogData = {
    title: 'Test Title',
    message: 'Test Message',
    inputValue: 'Initial Value'
  };

  beforeEach(async () => {
    // Create a spy for the MatDialogRef
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [
        DialogExampleComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DialogExampleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the title and message from the input data', () => {
    const titleElement = fixture.debugElement.query(By.css('h2')).nativeElement;
    const messageElement = fixture.debugElement.query(By.css('p')).nativeElement;
    
    expect(titleElement.textContent).toContain(mockDialogData.title);
    expect(messageElement.textContent).toContain(mockDialogData.message);
  });

  it('should initialize the input value from the data', () => {
    const inputElement = fixture.debugElement.query(By.css('input')).nativeElement;
    expect(inputElement.value).toBe(mockDialogData.inputValue);
  });

  it('should close the dialog with null when cancel is clicked', () => {
    const cancelButton = fixture.debugElement.query(By.css('[data-testid="cancel-button"]')).nativeElement;
    cancelButton.click();
    
    expect(dialogRef.close).toHaveBeenCalledWith(null);
  });

  it('should close the dialog with the input value when submit is clicked', () => {
    // Change the input value
    const newValue = 'New Test Value';
    component.inputValue = newValue;
    
    // Click the submit button
    const submitButton = fixture.debugElement.query(By.css('[data-testid="submit-button"]')).nativeElement;
    submitButton.click();
    
    expect(dialogRef.close).toHaveBeenCalledWith(newValue);
  });

  it('should update the input value when the user types', () => {
    const inputElement = fixture.debugElement.query(By.css('input')).nativeElement;
    const newValue = 'User typed value';
    
    inputElement.value = newValue;
    inputElement.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    
    expect(component.inputValue).toBe(newValue);
  });
}); 
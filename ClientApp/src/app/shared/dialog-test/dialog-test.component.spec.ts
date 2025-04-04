import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { DialogTestComponent } from './dialog-test.component';
import { DialogExampleComponent } from '../dialog-example/dialog-example.component';

describe('DialogTestComponent', () => {
  let component: DialogTestComponent;
  let fixture: ComponentFixture<DialogTestComponent>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of('test result') });

  beforeEach(async () => {
    // Create spies for the MatDialog and MatSnackBar
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    
    // Configure the dialog spy to return our dialogRefSpyObj
    dialogSpy.open.and.returnValue(dialogRefSpyObj);

    await TestBed.configureTestingModule({
      imports: [
        DialogTestComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DialogTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open the dialog when the button is clicked', () => {
    // Find and click the button
    const button = fixture.debugElement.query(By.css('[data-testid="open-dialog-button"]')).nativeElement;
    button.click();
    
    // Verify that the dialog was opened with the correct component and config
    expect(dialogSpy.open).toHaveBeenCalledWith(
      DialogExampleComponent,
      jasmine.objectContaining({
        width: '400px',
        data: jasmine.objectContaining({
          title: 'Example Dialog',
          message: jasmine.any(String)
        })
      })
    );
  });

  it('should update dialogResult and show snackbar when dialog returns a value', () => {
    // Set up the dialog to return a specific value
    const testResult = 'test result';
    dialogRefSpyObj.afterClosed = jasmine.createSpy().and.returnValue(of(testResult));
    
    // Trigger the dialog
    component.openDialog();
    
    // Verify the result was stored and snackbar was shown
    expect(component.dialogResult).toBe(testResult);
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      `Dialog returned: ${testResult}`,
      'Close',
      jasmine.any(Object)
    );
  });

  it('should show a different snackbar message when dialog is cancelled', () => {
    // Set up the dialog to return null (cancelled)
    dialogRefSpyObj.afterClosed = jasmine.createSpy().and.returnValue(of(null));
    
    // Trigger the dialog
    component.openDialog();
    
    // Verify the snackbar was shown with the cancelled message
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Dialog was cancelled',
      'Close',
      jasmine.any(Object)
    );
  });

  // Test for advanced dialog testing techniques
  describe('Dialog Integration', () => {
    // This is a more advanced test that shows how to test dialog interactions
    it('should pass the current dialogResult to the dialog', () => {
      // Set an initial value
      const initialValue = 'previous value';
      component.dialogResult = initialValue;
      
      // Open the dialog
      component.openDialog();
      
      // Verify the dialog was opened with the current value
      expect(dialogSpy.open).toHaveBeenCalledWith(
        DialogExampleComponent,
        jasmine.objectContaining({
          data: jasmine.objectContaining({
            inputValue: initialValue
          })
        })
      );
    });
  });
}); 
# Angular Material Dialog Testing Guide

This guide demonstrates how to test Angular Material dialogs in your application. We've created example components and tests that you can use as a reference.

## Components

1. **DialogExampleComponent** (`src/app/shared/dialog-example/dialog-example.component.ts`)
   - A reusable dialog component that accepts data and returns a result
   - Shows how to structure a dialog with inputs and actions

2. **DialogTestComponent** (`src/app/shared/dialog-test/dialog-test.component.ts`)
   - A test page with a button to open the dialog
   - Shows how to open a dialog and handle its result

## Test Files

1. **DialogExampleComponent Tests** (`src/app/shared/dialog-example/dialog-example.component.spec.ts`)
   - Tests for the dialog component itself
   - Shows how to mock `MatDialogRef` and `MAT_DIALOG_DATA`

2. **DialogTestComponent Tests** (`src/app/shared/dialog-test/dialog-test.component.spec.ts`)
   - Tests for the component that opens the dialog
   - Shows how to mock `MatDialog` and test dialog opening/closing

## Key Testing Techniques

### Testing Dialog Components

1. **Mocking Dependencies**
   ```typescript
   // Create a spy for the MatDialogRef
   dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

   await TestBed.configureTestingModule({
     imports: [DialogExampleComponent, NoopAnimationsModule],
     providers: [
       { provide: MatDialogRef, useValue: dialogRef },
       { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
     ]
   }).compileComponents();
   ```

2. **Testing Dialog Content**
   ```typescript
   it('should display the title and message from the input data', () => {
     const titleElement = fixture.debugElement.query(By.css('h2')).nativeElement;
     const messageElement = fixture.debugElement.query(By.css('p')).nativeElement;
     
     expect(titleElement.textContent).toContain(mockDialogData.title);
     expect(messageElement.textContent).toContain(mockDialogData.message);
   });
   ```

3. **Testing Dialog Actions**
   ```typescript
   it('should close the dialog with null when cancel is clicked', () => {
     const cancelButton = fixture.debugElement.query(By.css('[data-testid="cancel-button"]')).nativeElement;
     cancelButton.click();
     
     expect(dialogRef.close).toHaveBeenCalledWith(null);
   });
   ```

### Testing Components that Open Dialogs

1. **Mocking MatDialog**
   ```typescript
   // Create spies for the MatDialog and MatSnackBar
   dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
   
   // Configure the dialog spy to return our dialogRefSpyObj
   dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of('test result') });
   dialogSpy.open.and.returnValue(dialogRefSpyObj);
   
   await TestBed.configureTestingModule({
     imports: [DialogTestComponent, NoopAnimationsModule],
     providers: [
       { provide: MatDialog, useValue: dialogSpy },
       { provide: MatSnackBar, useValue: snackBarSpy }
     ]
   }).compileComponents();
   ```

2. **Testing Dialog Opening**
   ```typescript
   it('should open the dialog when the button is clicked', () => {
     const button = fixture.debugElement.query(By.css('[data-testid="open-dialog-button"]')).nativeElement;
     button.click();
     
     expect(dialogSpy.open).toHaveBeenCalledWith(
       DialogExampleComponent,
       jasmine.objectContaining({
         width: '400px',
         data: jasmine.objectContaining({
           title: 'Example Dialog'
         })
       })
     );
   });
   ```

3. **Testing Dialog Results**
   ```typescript
   it('should update dialogResult and show snackbar when dialog returns a value', () => {
     const testResult = 'test result';
     dialogRefSpyObj.afterClosed = jasmine.createSpy().and.returnValue(of(testResult));
     
     component.openDialog();
     
     expect(component.dialogResult).toBe(testResult);
     expect(snackBarSpy.open).toHaveBeenCalledWith(
       `Dialog returned: ${testResult}`,
       'Close',
       jasmine.any(Object)
     );
   });
   ```

## Manual Testing

You can manually test the dialog components by:

1. Navigating to `/dialog-test` in your application
2. Clicking the "Open Dialog" button
3. Entering text in the dialog and clicking "Submit" or "Cancel"

Alternatively, you can use the `test-dialog.ts` utility:

```typescript
import { testDialog } from '../shared/test-dialog';

// In your component:
constructor(private dialog: MatDialog) {}

testDialogManually(): void {
  testDialog(this.dialog);
}
```

## Best Practices

1. **Use data-testid attributes** for reliable element selection in tests
2. **Mock MatDialogRef and MAT_DIALOG_DATA** when testing dialog components
3. **Mock MatDialog** when testing components that open dialogs
4. **Test both success and cancellation paths** for dialog interactions
5. **Use NoopAnimationsModule** in tests to avoid animation-related issues
6. **Test data passing** both into and out of dialogs

## Common Issues

1. **Animation errors**: Make sure to import `NoopAnimationsModule` in your test module
2. **Dialog not opening in tests**: Ensure you're properly mocking `MatDialog` and its `open` method
3. **Dialog content not rendering**: Check that you're providing the correct mock data
4. **Dialog actions not working**: Verify that event bindings are correctly set up

## Further Reading

- [Angular Material Dialog Documentation](https://material.angular.io/components/dialog/overview)
- [Angular Testing Guide](https://angular.io/guide/testing) 
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { DialogExampleComponent, DialogData } from './dialog-example/dialog-example.component';

/**
 * This is a simple script to test our dialog components manually.
 * 
 * To use:
 * 1. Import this file in your component
 * 2. Inject MatDialog in your component
 * 3. Call testDialog(dialog) from your component
 */
export function testDialog(dialog: MatDialog): void {
  console.log('Testing dialog component...');
  
  const dialogData: DialogData = {
    title: 'Test Dialog',
    message: 'This is a test dialog from the test-dialog.ts script.',
    inputValue: 'Initial test value'
  };

  const dialogRef = dialog.open(DialogExampleComponent, {
    width: '400px',
    data: dialogData
  });

  dialogRef.afterClosed().subscribe(result => {
    console.log('Dialog result:', result);
  });
}

/**
 * Simple test component that can be used to test the dialog
 */
@Component({
  selector: 'app-dialog-tester',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  template: `
    <button mat-raised-button color="primary" (click)="openDialog()">
      Test Dialog
    </button>
  `
})
export class DialogTesterComponent {
  constructor(private dialog: MatDialog) {}

  openDialog(): void {
    testDialog(this.dialog);
  }
} 
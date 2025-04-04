import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DialogExampleComponent, DialogData } from '../dialog-example/dialog-example.component';

@Component({
  selector: 'app-dialog-test',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    MatSnackBarModule
  ],
  template: `
    <div class="container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Dialog Testing Example</mat-card-title>
          <mat-card-subtitle>Click the button to open a dialog</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>This is an example of how to use and test Angular Material dialogs.</p>
          <p *ngIf="dialogResult">Last dialog result: <strong>{{ dialogResult }}</strong></p>
        </mat-card-content>
        <mat-card-actions>
          <button 
            mat-raised-button 
            color="primary" 
            (click)="openDialog()"
            data-testid="open-dialog-button">
            Open Dialog
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      max-width: 800px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    
    mat-card {
      margin-bottom: 1rem;
    }
    
    mat-card-actions {
      padding: 1rem;
    }
  `]
})
export class DialogTestComponent {
  dialogResult: string | null = null;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  openDialog(): void {
    const dialogData: DialogData = {
      title: 'Example Dialog',
      message: 'This is a test dialog. Enter some text and click Submit.',
      inputValue: this.dialogResult || ''
    };

    const dialogRef = this.dialog.open(DialogExampleComponent, {
      width: '400px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== null && result !== undefined) {
        this.dialogResult = result;
        this.snackBar.open(`Dialog returned: ${result}`, 'Close', {
          duration: 3000
        });
      } else {
        this.snackBar.open('Dialog was cancelled', 'Close', {
          duration: 3000
        });
      }
    });
  }
} 
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-check-in-instructions',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    RouterModule
  ],
  template: `
    <div class="instructions-container">
      <div class="instructions-card">
        <div class="status-header" [ngClass]="statusClass">
          <mat-icon>{{ statusIcon }}</mat-icon>
          <h2>{{ statusTitle }}</h2>
        </div>
        
        <div class="instructions-content">
          <p>{{ instructions }}</p>
          
          <div class="supervisor-info">
            <h3>Site Supervisor:</h3>
            <p>John Smith (555-123-4567)</p>
          </div>
        </div>
        
        <div class="instructions-actions">
          <button 
            mat-raised-button 
            color="primary" 
            (click)="continue()">
            CONTINUE
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .instructions-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
      background-color: #f5f5f5;
    }
    
    .instructions-card {
      display: flex;
      flex-direction: column;
      max-width: 500px;
      width: 100%;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    
    .status-header {
      display: flex;
      align-items: center;
      padding: 16px 24px;
      color: white;
    }
    
    .status-header.visitor {
      background-color: #2196F3; /* Blue for visitors */
    }
    
    .status-header.contractor-inducted {
      background-color: #4CAF50; /* Green for inducted contractors */
    }
    
    .status-header.contractor-not-inducted {
      background-color: #FF9800; /* Amber for non-inducted contractors */
    }
    
    .status-header mat-icon {
      margin-right: 12px;
      font-size: 24px;
      height: 24px;
      width: 24px;
    }
    
    .status-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    }
    
    .instructions-content {
      padding: 24px;
    }
    
    .instructions-content p {
      margin: 0 0 16px;
      font-size: 16px;
      line-height: 1.5;
    }
    
    .supervisor-info {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #eee;
    }
    
    .supervisor-info h3 {
      margin: 0 0 8px;
      font-size: 16px;
      font-weight: 500;
    }
    
    .supervisor-info p {
      margin: 0;
      color: #666;
    }
    
    .instructions-actions {
      padding: 16px 24px;
      display: flex;
      justify-content: center;
      border-top: 1px solid #eee;
    }
  `]
})
export class CheckInInstructionsComponent implements OnInit {
  checkInType: 'visitor' | 'contractor' | null = null;
  inducted: boolean | null = null;
  
  statusClass = 'visitor';
  statusIcon = 'info';
  statusTitle = 'Visitor';
  instructions = 'Please report to the site supervisor. Visitors must be accompanied by a supervisor at all times.';
  
  constructor(private router: Router) {}
  
  ngOnInit(): void {
    // Get data from session storage
    const checkInTypeStr = sessionStorage.getItem('check_in_type');
    const inductedStr = sessionStorage.getItem('inducted');
    
    if (!checkInTypeStr) {
      // If missing required data, redirect to home
      this.router.navigate(['/home']);
      return;
    }
    
    this.checkInType = checkInTypeStr as 'visitor' | 'contractor';
    
    if (this.checkInType === 'contractor' && inductedStr) {
      this.inducted = inductedStr === 'true';
      
      if (this.inducted) {
        // Inducted contractor
        this.statusClass = 'contractor-inducted';
        this.statusIcon = 'check_circle';
        this.statusTitle = 'Contractor (Inducted)';
        this.instructions = 'Please check in with the site supervisor and you may proceed to work.';
      } else {
        // Non-inducted contractor
        this.statusClass = 'contractor-not-inducted';
        this.statusIcon = 'warning';
        this.statusTitle = 'Contractor (Not Inducted)';
        this.instructions = 'Please see the site supervisor for site induction before starting work.';
      }
    }
  }
  
  continue(): void {
    // Navigate to the confirmation page
    this.router.navigate(['/check-in/confirmation']);
  }
} 
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-contractor-induction',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    RouterModule
  ],
  template: `
    <div class="induction-container">
      <div class="induction-card">
        <h1 class="induction-title">Have you been inducted into this site?</h1>
        
        <div class="induction-buttons">
          <button 
            mat-raised-button 
            color="primary" 
            class="induction-button yes-button"
            (click)="selectInductionStatus(true)">
            <mat-icon>check_circle</mat-icon>
            YES
          </button>
          
          <button 
            mat-raised-button 
            color="warn" 
            class="induction-button no-button"
            (click)="selectInductionStatus(false)">
            <mat-icon>cancel</mat-icon>
            NO
          </button>
        </div>
        
        <div class="induction-info">
          <p>Site induction is required before starting work</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .induction-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
      background-color: #f5f5f5;
    }
    
    .induction-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      max-width: 500px;
      width: 100%;
      padding: 32px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    .induction-title {
      margin: 0 0 32px;
      text-align: center;
      font-size: 24px;
    }
    
    .induction-buttons {
      display: flex;
      gap: 16px;
      margin-bottom: 32px;
      width: 100%;
    }
    
    .induction-button {
      flex: 1;
      padding: 16px;
      font-size: 16px;
      font-weight: bold;
    }
    
    .induction-button mat-icon {
      margin-right: 8px;
    }
    
    .induction-info {
      text-align: center;
      color: #666;
    }
    
    @media (max-width: 480px) {
      .induction-buttons {
        flex-direction: column;
      }
    }
  `]
})
export class ContractorInductionComponent implements OnInit {
  jobsiteId: string | null = null;
  checkInType: string | null = null;
  
  constructor(private router: Router) {}
  
  ngOnInit(): void {
    // Check if we have a jobsite ID and check-in type in session storage
    this.jobsiteId = sessionStorage.getItem('jobsite_id');
    this.checkInType = sessionStorage.getItem('check_in_type');
    
    if (!this.jobsiteId || !this.checkInType) {
      // If missing required data, redirect to home
      this.router.navigate(['/home']);
      return;
    }
    
    // Ensure this page is only accessed by contractors
    if (this.checkInType !== 'contractor') {
      this.router.navigate(['/check-in/type']);
    }
  }
  
  selectInductionStatus(inducted: boolean): void {
    // Store the induction status in session storage
    sessionStorage.setItem('inducted', inducted.toString());
    
    // Navigate to the check-in form
    this.router.navigate(['/check-in/form']);
  }
} 
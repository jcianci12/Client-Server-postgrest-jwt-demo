import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-check-in-type',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    RouterModule
  ],
  template: `
    <div class="check-in-type-container">
      <div class="type-selection-card">
        <h1 class="type-selection-title">Are you a visitor or contractor?</h1>
        
        <div class="type-buttons">
          <button 
            mat-raised-button 
            color="primary" 
            class="type-button visitor-button"
            (click)="selectType('visitor')">
            <mat-icon>person</mat-icon>
            VISITOR
          </button>
          
          <button 
            mat-raised-button 
            color="accent" 
            class="type-button contractor-button"
            (click)="selectType('contractor')">
            <mat-icon>build</mat-icon>
            CONTRACTOR
          </button>
        </div>
        
        <div class="type-descriptions">
          <div class="type-description">
            <h3>Visitor:</h3>
            <p>Someone visiting the site temporarily</p>
          </div>
          
          <div class="type-description">
            <h3>Contractor:</h3>
            <p>Someone performing work on this site</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .check-in-type-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
      background-color: #f5f5f5;
    }
    
    .type-selection-card {
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
    
    .type-selection-title {
      margin: 0 0 32px;
      text-align: center;
      font-size: 24px;
    }
    
    .type-buttons {
      display: flex;
      gap: 16px;
      margin-bottom: 32px;
      width: 100%;
    }
    
    .type-button {
      flex: 1;
      padding: 16px;
      font-size: 16px;
      font-weight: bold;
    }
    
    .type-button mat-icon {
      margin-right: 8px;
    }
    
    .type-descriptions {
      width: 100%;
    }
    
    .type-description {
      margin-bottom: 16px;
    }
    
    .type-description h3 {
      margin: 0 0 4px;
      font-size: 16px;
    }
    
    .type-description p {
      margin: 0;
      color: #666;
    }
    
    @media (max-width: 480px) {
      .type-buttons {
        flex-direction: column;
      }
    }
  `]
})
export class CheckInTypeComponent implements OnInit {
  jobsiteId: string | null = null;
  
  constructor(private router: Router) {}
  
  ngOnInit(): void {
    // Check if we have a jobsite ID in session storage
    this.jobsiteId = sessionStorage.getItem('jobsite_id');
    
    if (!this.jobsiteId) {
      // If no jobsite ID, redirect to home
      this.router.navigate(['/home']);
    }
  }
  
  selectType(type: 'visitor' | 'contractor'): void {
    // Store the selected type in session storage
    sessionStorage.setItem('check_in_type', type);
    
    if (type === 'contractor') {
      // If contractor, navigate to induction status page
      this.router.navigate(['/check-in/induction']);
    } else {
      // If visitor, navigate directly to the form
      this.router.navigate(['/check-in/form']);
    }
  }
} 
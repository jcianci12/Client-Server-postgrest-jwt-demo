import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-check-in-confirmation',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    RouterModule,
    DatePipe
  ],
  template: `
    <div class="confirmation-container">
      <div class="confirmation-card">
        <div class="confirmation-header">
          <mat-icon class="success-icon">check_circle</mat-icon>
          <h1>Check-in Successful</h1>
        </div>
        
        <div class="confirmation-details">
          <div class="detail-row">
            <span class="detail-label">Name:</span>
            <span class="detail-value">{{ name }}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Type:</span>
            <span class="detail-value">{{ type }}</span>
          </div>
          
          <div class="detail-row" *ngIf="company">
            <span class="detail-label">Company:</span>
            <span class="detail-value">{{ company }}</span>
          </div>
          
          <div class="detail-row" *ngIf="inductionStatus">
            <span class="detail-label">Status:</span>
            <span class="detail-value">{{ inductionStatus }}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Jobsite:</span>
            <span class="detail-value">{{ jobsiteName }}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Time:</span>
            <span class="detail-value">{{ checkInTime | date:'shortTime' }}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Date:</span>
            <span class="detail-value">{{ checkInTime | date:'mediumDate' }}</span>
          </div>
          
          <div class="detail-row" *ngIf="diaryEntryId">
            <span class="detail-label">Diary ID:</span>
            <span class="detail-value">{{ diaryEntryId }}</span>
          </div>
        </div>
        
        <div class="confirmation-message">
          <p>{{ message || 'Your check-in has been recorded in the site diary.' }}</p>
        </div>
        
        <div class="confirmation-actions">
          <button 
            mat-raised-button 
            color="primary" 
            (click)="done()">
            DONE
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirmation-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
      background-color: #f5f5f5;
    }
    
    .confirmation-card {
      display: flex;
      flex-direction: column;
      max-width: 500px;
      width: 100%;
      padding: 32px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    .confirmation-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 24px;
    }
    
    .success-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      color: #4CAF50;
      margin-bottom: 16px;
    }
    
    .confirmation-header h1 {
      margin: 0;
      font-size: 24px;
      text-align: center;
    }
    
    .confirmation-details {
      margin-bottom: 24px;
    }
    
    .detail-row {
      display: flex;
      margin-bottom: 8px;
      font-size: 16px;
    }
    
    .detail-label {
      font-weight: 500;
      width: 80px;
      flex-shrink: 0;
    }
    
    .detail-value {
      color: #666;
    }
    
    .confirmation-message {
      text-align: center;
      margin-bottom: 24px;
      padding: 16px;
      background-color: #E8F5E9;
      border-radius: 4px;
    }
    
    .confirmation-message p {
      margin: 0;
      color: #2E7D32;
    }
    
    .confirmation-actions {
      display: flex;
      justify-content: center;
    }
  `]
})
export class CheckInConfirmationComponent implements OnInit {
  name = '';
  type = '';
  company = '';
  inductionStatus = '';
  jobsiteName = '';
  message = '';
  diaryEntryId?: number;
  checkInTime: Date = new Date();
  
  constructor(private router: Router) {}
  
  ngOnInit(): void {
    // Get data from session storage
    const name = sessionStorage.getItem('check_in_name');
    const type = sessionStorage.getItem('check_in_type');
    const company = sessionStorage.getItem('check_in_company');
    const inducted = sessionStorage.getItem('inducted');
    
    // Get API response data
    const jobsiteName = sessionStorage.getItem('check_in_jobsite_name');
    const message = sessionStorage.getItem('check_in_message');
    const checkInTimeStr = sessionStorage.getItem('check_in_time');
    const diaryEntryIdStr = sessionStorage.getItem('check_in_diary_entry_id');
    
    if (!name || !type) {
      // If missing required data, redirect to home
      this.router.navigate(['/home']);
      return;
    }
    
    this.name = name;
    
    // Format the type for display
    if (type === 'visitor') {
      this.type = 'Visitor';
    } else if (type === 'contractor') {
      this.type = 'Contractor';
      
      // Set company if available
      if (company) {
        this.company = company;
      }
      
      // Set induction status if available
      if (inducted !== null) {
        this.inductionStatus = inducted === 'true' ? 'Inducted' : 'Not Inducted';
      }
    }
    
    // Set API response data
    if (jobsiteName) {
      this.jobsiteName = jobsiteName;
    }
    
    if (message) {
      this.message = message;
    }
    
    if (checkInTimeStr) {
      try {
        this.checkInTime = new Date(checkInTimeStr);
      } catch (error) {
        console.error('Error parsing check-in time:', error);
      }
    }
    
    if (diaryEntryIdStr) {
      try {
        this.diaryEntryId = parseInt(diaryEntryIdStr, 10);
      } catch (error) {
        console.error('Error parsing diary entry ID:', error);
      }
    }
  }
  
  done(): void {
    // Clear session storage
    sessionStorage.removeItem('qr_token');
    sessionStorage.removeItem('jobsite_id');
    sessionStorage.removeItem('jobsite_name');
    sessionStorage.removeItem('jobsite_address');
    sessionStorage.removeItem('check_in_type');
    sessionStorage.removeItem('inducted');
    sessionStorage.removeItem('check_in_name');
    sessionStorage.removeItem('check_in_contact');
    sessionStorage.removeItem('check_in_company');
    
    // Clear API response data
    sessionStorage.removeItem('check_in_success');
    sessionStorage.removeItem('check_in_message');
    sessionStorage.removeItem('check_in_jobsite_name');
    sessionStorage.removeItem('check_in_time');
    sessionStorage.removeItem('check_in_diary_entry_id');
    
    // Navigate to home
    this.router.navigate(['/home']);
  }
} 
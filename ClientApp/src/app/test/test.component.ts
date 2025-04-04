import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <h2>PostgREST API Test</h2>

      <div class="section">
        <h3>1. Test Table</h3>
        <div *ngIf="testData.length > 0">
          <table>
            <tr>
              <th>ID</th>
              <th>Data</th>
              <th>User ID</th>
            </tr>
            <tr *ngFor="let item of testData">
              <td>{{item.id}}</td>
              <td>{{item.data}}</td>
              <td>{{item.user_id}}</td>
            </tr>
          </table>
        </div>
        <button (click)="fetchTestData()">Fetch Test Data</button>
      </div>

      <div class="section">
        <h3>2. Insert New Record</h3>
        <input [(ngModel)]="newData" placeholder="Data">
        <button (click)="insertRecord()">Insert Record</button>
      </div>

      <div class="section">
        <h3>3. Update Record</h3>
        <input [(ngModel)]="updateId" placeholder="ID to update">
        <input [(ngModel)]="updateData" placeholder="New data">
        <button (click)="updateRecord()">Update Record</button>
      </div>

      <div class="section">
        <h3>4. Delete Record</h3>
        <input [(ngModel)]="deleteId" placeholder="ID to delete">
        <button (click)="deleteRecord()">Delete Record</button>
      </div>

      <div class="section">
        <h3>Response Message</h3>
        <p [class.error]="error" [class.success]="!error">{{message}}</p>
      </div>

      <div class="section">
        <h3>5. JWT Debug Info</h3>
        <button (click)="fetchJwtDebug()">Get JWT Debug Info</button>
        <pre *ngIf="jwtDebugInfo">{{jwtDebugInfo | json}}</pre>
      </div>

      <div class="section">
        <h3>6. Comprehensive Test</h3>
        <button (click)="runComprehensiveTest()">Run Comprehensive Test</button>
        <div *ngIf="testResults" class="test-results">
          <h4>Test Results: <span [class.success]="testResults.status === 'success'" [class.error]="testResults.status === 'error'">
            {{testResults.status | titlecase}}
          </span></h4>

          <div class="steps-container">
            <div *ngFor="let step of testResults.steps; let i = index" class="test-step" [class.completed]="step.status >= 200 && step.status < 300">
              <div class="step-header">
                <span class="step-number">{{i + 1}}</span>
                <h5>{{step.operation | titlecase}}</h5>
                <span class="step-status" [class.success]="step.status >= 200 && step.status < 300" [class.error]="step.status >= 400">
                  {{step.status}}
                </span>
              </div>

              <div class="step-content" *ngIf="step.response">
                <div class="response-data">
                  <pre>{{step.response | json}}</pre>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="testResults.error" class="error-message">
            <h5>Error Details:</h5>
            <p>{{testResults.error}}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    div {
      padding: 20px;
    }
    .section {
      margin: 20px 0;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    button {
      padding: 8px 16px;
      margin: 5px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover {
      background-color: #0056b3;
    }
    input {
      padding: 8px;
      margin: 5px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
    }
    .error {
      color: red;
    }
    .success {
      color: green;
    }
    pre {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
      max-height: 400px;
      overflow-y: auto;
    }
    .test-results {
      margin-top: 15px;
    }
    .steps-container {
      margin-top: 15px;
    }
    .test-step {
      margin: 10px 0;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background-color: #f8f9fa;
    }
    .test-step.completed {
      border-left: 4px solid #28a745;
    }
    .step-header {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
    }
    .step-number {
      background-color: #007bff;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      margin-right: 10px;
      font-size: 0.9em;
    }
    .step-status {
      margin-left: auto;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: bold;
    }
    .step-status.success {
      background-color: #d4edda;
      color: #155724;
    }
    .step-status.error {
      background-color: #f8d7da;
      color: #721c24;
    }
    .step-content {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #eee;
    }
    .response-data {
      background-color: white;
      padding: 10px;
      border-radius: 4px;
    }
    .error-message {
      margin-top: 15px;
      padding: 10px;
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
      color: #721c24;
    }
    .success {
      color: #28a745;
    }
    .error {
      color: #dc3545;
    }
  `]
})
export class TestComponent implements OnInit {
  testData: any[] = [];
  message: string = '';
  error: boolean = false;
  newData: string = '';
  updateId: string = '';
  updateData: string = '';
  deleteId: string = '';
  jwtDebugInfo: any = null;
  testResults: any = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Initialize component
  }

  private async getHeaders(): Promise<HttpHeaders> {
    const token = await this.authService.getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  async fetchTestData() {
    try {
      const headers = await this.getHeaders();
      this.http.get('http://localhost:8000/test', { headers }).subscribe({
        next: (response: any) => {
          this.testData = response;
          this.message = 'Data fetched successfully';
          this.error = false;
        },
        error: (error) => {
          this.message = `Error fetching data: ${error.message}`;
          this.error = true;
        }
      });
    } catch (error) {
      this.message = `Error: ${error}`;
      this.error = true;
    }
  }

  async insertRecord() {
    try {
      const headers = await this.getHeaders();
      const data = {
        data: this.newData
      };
      this.http.post('http://localhost:8000/test', data, { headers }).subscribe({
        next: (response) => {
          this.message = 'Record inserted successfully';
          this.error = false;
          this.fetchTestData();
          this.newData = '';
        },
        error: (error) => {
          this.message = `Error inserting record: ${error.message}`;
          this.error = true;
        }
      });
    } catch (error) {
      this.message = `Error: ${error}`;
      this.error = true;
    }
  }

  async updateRecord() {
    try {
      const headers = await this.getHeaders();
      const data = { data: this.updateData };
      this.http.patch(`http://localhost:8000/test?id=eq.${this.updateId}`, data, { headers }).subscribe({
        next: (response) => {
          this.message = 'Record updated successfully';
          this.error = false;
          this.fetchTestData();
          this.updateId = '';
          this.updateData = '';
        },
        error: (error) => {
          this.message = `Error updating record: ${error.message}`;
          this.error = true;
        }
      });
    } catch (error) {
      this.message = `Error: ${error}`;
      this.error = true;
    }
  }

  async deleteRecord() {
    try {
      const headers = await this.getHeaders();
      this.http.delete(`http://localhost:8000/test?id=eq.${this.deleteId}`, { headers }).subscribe({
        next: (response) => {
          this.message = 'Record deleted successfully';
          this.error = false;
          this.fetchTestData();
          this.deleteId = '';
        },
        error: (error) => {
          this.message = `Error deleting record: ${error.message}`;
          this.error = true;
        }
      });
    } catch (error) {
      this.message = `Error: ${error}`;
      this.error = true;
    }
  }

  async fetchJwtDebug() {
    try {
      // First get settings without auth
      this.http.get('http://localhost:8000/debug/jwt').subscribe({
        next: async (response: any) => {
          this.jwtDebugInfo = response;

          // If we have a token, get the token debug info too
          try {
            const headers = await this.getHeaders();
            this.http.get('http://localhost:8000/debug/jwt', { headers }).subscribe({
              next: (authResponse: any) => {
                this.jwtDebugInfo = {
                  ...this.jwtDebugInfo,
                  authenticated: authResponse
                };
                this.message = 'JWT debug info fetched successfully';
                this.error = false;
              }
            });
          } catch (error) {
            // Just show the unauthed response
            this.message = 'JWT settings fetched (no valid token available)';
            this.error = false;
          }
        },
        error: (error) => {
          this.message = `Error fetching JWT debug info: ${error.message}`;
          this.error = true;
        }
      });
    } catch (error) {
      this.message = `Error: ${error}`;
      this.error = true;
    }
  }

  async runComprehensiveTest() {
    try {
      const headers = await this.getHeaders();
      this.http.post('http://localhost:8000/runtest', {}, { headers }).subscribe({
        next: (response: any) => {
          this.testResults = response;
          this.message = response.status === 'success' ? 'Comprehensive test completed successfully' : 'Test failed';
          this.error = response.status !== 'success';
        },
        error: (error) => {
          this.message = `Error running comprehensive test: ${error.message}`;
          this.error = true;
        }
      });
    } catch (error) {
      this.message = `Error: ${error}`;
      this.error = true;
    }
  }
}

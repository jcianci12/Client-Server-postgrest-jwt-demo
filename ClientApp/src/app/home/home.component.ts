import { Component } from '@angular/core';
import { TestComponent } from '../test/test.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [TestComponent],
  template: `
    <div class="container">
      <h1>Welcome to the Application</h1>
      <p>This is a basic home page with PostgREST test functionality.</p>
      <app-test></app-test>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      color: #333;
      margin-bottom: 20px;
    }
    p {
      color: #666;
      margin-bottom: 30px;
    }
  `]
})
export class HomeComponent {}

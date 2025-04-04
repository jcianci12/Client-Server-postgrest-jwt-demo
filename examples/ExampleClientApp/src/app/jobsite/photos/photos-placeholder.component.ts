import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-photos-placeholder',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Photos</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="placeholder-content">
          <mat-icon class="placeholder-icon">photo_library</mat-icon>
          <p>Photo gallery feature coming soon</p>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .placeholder-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
      color: var(--mat-gray-500);
    }
    .placeholder-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 16px;
    }
  `]
})
export class PhotosPlaceholderComponent {} 
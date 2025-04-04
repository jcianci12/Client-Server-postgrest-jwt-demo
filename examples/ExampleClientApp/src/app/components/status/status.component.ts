import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { UIStateService, MessageType } from '../../services/ui-state.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-status',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressBarModule,
    MatCardModule,
    MatButtonModule
  ],
  template: `
    <ng-container *ngIf="uiStateService.state$ | async as state">
      <!-- Loading bar -->
      <mat-progress-bar *ngIf="state.loading"
                        mode="indeterminate"
                        class="loading-bar">
      </mat-progress-bar>

      <!-- Status message -->
      <div *ngIf="state.message || state.sessionExpired"
           [@slideInOut]
           class="status-message-container"
           [ngClass]="{'session-renewal': state.messageType === 'session-renewal' || state.sessionExpired}">
        <mat-card class="status-message" [ngClass]="getMessageClass(state.messageType)">
          <mat-card-content>
            <div class="message-content">
              <span>{{state.message || 'Your session has expired.'}}</span>
              <button *ngIf="state.messageType === 'session-renewal' || state.sessionExpired"
                      mat-raised-button
                      color="primary"
                      (click)="renewSession()">
                Renew Session
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </ng-container>
  `,
  styles: [`
    .loading-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
    }
    .status-message-container {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      pointer-events: none;
    }
    .status-message {
      pointer-events: auto;
      background-color: #323232;
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      min-width: 200px;
      text-align: center;
    }
    .status-message.info {
      background-color: #323232;
    }
    .status-message.success {
      background-color: #43a047;
    }
    .status-message.warning {
      background-color: #fb8c00;
    }
    .status-message.error {
      background-color: #e53935;
    }
    .status-message.session-renewal {
      background-color: var(--mat-warn-500);
      color: white;
    }
    .session-renewal {
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      max-width: 100%;
      transform: none;
      padding: 0;
    }
    .session-renewal .status-message {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      border-radius: 4px 4px 0 0;
    }
    .message-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }
    @media (max-width: 600px) {
      .message-content {
        flex-direction: column;
        gap: 8px;
      }
    }
  `],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('200ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateY(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class StatusComponent {
  private authService = inject(AuthService);

  constructor(public uiStateService: UIStateService) {}

  getMessageClass(type?: MessageType): string {
    return type || 'info';
  }

  async renewSession(): Promise<void> {
    this.uiStateService.clearSessionState();
    await this.authService.login();
  }
}

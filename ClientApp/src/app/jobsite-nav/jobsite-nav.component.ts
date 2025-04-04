import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface NavLink {
  path: string;
  label: string;
  icon: string;
  active?: boolean;
}

@Component({
  selector: 'app-jobsite-nav',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <nav class="jobsite-nav">
      <a *ngFor="let link of jobsiteNavLinks"
         [routerLink]="link.path"
         routerLinkActive="active"
         [routerLinkActiveOptions]="{exact: true}"
         mat-button
         class="nav-link">
        <mat-icon>{{link.icon}}</mat-icon>
        <span class="nav-label">{{link.label}}</span>
      </a>
    </nav>
  `,
  styles: [`
    .jobsite-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      background-color: white;
      box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
      display: flex;
      justify-content: center;
      padding: 8px;
      gap: 4px;
      overflow-x: auto;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 8px;
      color: rgba(0, 0, 0, 0.6);
    }

    .nav-link.active {
      color: #1976d2;
      background-color: rgba(25, 118, 210, 0.1);
    }

    @media (max-width: 600px) {
      .jobsite-nav {
        padding: 4px;
      }

      .nav-link {
        min-width: 48px;
        padding: 0 12px;
      }

      .nav-label {
        display: none;
      }

      mat-icon {
        margin: 0;
      }
    }

    /* Scrollbar styles */
    .jobsite-nav::-webkit-scrollbar {
      height: 2px;
    }

    .jobsite-nav::-webkit-scrollbar-track {
      background: transparent;
    }

    .jobsite-nav::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 2px;
    }
  `]
})
export class JobsiteNavComponent implements OnInit {
  @Input() jobsiteId!: number;

  jobsiteNavLinks: NavLink[] = [
    { path: 'overview', label: 'Overview', icon: 'visibility' },
    { path: 'diary', label: 'Diary', icon: 'book' },
    { path: 'equipment', label: 'Equipment', icon: 'construction' },
    { path: 'inspections', label: 'Inspections', icon: 'checklist' },
    { path: 'visitors', label: 'Visitors', icon: 'people' },
    { path: 'deliveries', label: 'Deliveries', icon: 'local_shipping' },
    { path: 'subcontractors', label: 'Subcontractors', icon: 'engineering' },
    { path: 'photos', label: 'Photos', icon: 'photo_library' },
    { path: 'qrcode', label: 'QR Code', icon: 'qr_code' }
  ];

  ngOnInit() {
    // Update paths with jobsite ID
    this.jobsiteNavLinks = this.jobsiteNavLinks.map(link => ({
      ...link,
      path: `/jobsites/${this.jobsiteId}/${link.path}`
    }));
  }
}

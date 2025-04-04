import { Component } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AsyncPipe, CommonModule } from '@angular/common';
import { UIStateService } from '../services/ui-state.service';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [MatProgressBarModule, AsyncPipe, CommonModule],
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.css'
})
export class LoadingComponent {
  constructor(public uiStateService: UIStateService) {}
}

import { Injectable } from '@angular/core';
import { Client, JobsiteResponse } from '../api/api';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class JobsiteService {
  constructor(private client: Client) {}

  getJobsites(): Observable<JobsiteResponse[]> {
    return this.client.get_jobsites_api_jobsites_get();
  }
} 
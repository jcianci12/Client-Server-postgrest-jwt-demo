import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { RouterModule, provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { environment } from './app/environments/environment';
import { API_BASE_URL, Client } from './app/api/api';
import { authInterceptor } from './app/auth/auth.interceptor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
     provideHttpClient(withFetch()
     , withInterceptors([authInterceptor])),


    { provide: API_BASE_URL, useValue: environment.baseUrl }, provideAnimationsAsync(),
    {provide: Client, useClass: Client},
  ]
})
.catch(err => console.error(err));

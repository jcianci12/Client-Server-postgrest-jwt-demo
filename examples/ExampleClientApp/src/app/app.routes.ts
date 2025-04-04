import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AuthGuard } from './guards/auth.guard';
// import { SilentRefreshComponent } from './silent-refresh/silent-refresh.component';
import { CallbackComponent } from './auth/callback/callback.component';
import { CompanySetupComponent } from './company/company-setup.component';
import { CompanyGuard } from './company/company.guard';
import { CompanyIndexComponent } from './company/company-index.component';
import { CompanyDetailComponent } from './company/company-detail.component';
import { LoginComponent } from './login/login.component';
import { JobsiteDashboardComponent } from './jobsite/jobsite-dashboard.component';
import { JobsiteDetailsComponent } from './jobsite/jobsite-details.component';
import { JobsiteOverviewComponent } from './jobsite/jobsite-overview.component';
import { DiaryComponent } from './jobsite/diary/diary.component';
import { HireEquipmentComponent } from './jobsite/hire-equipment/hire-equipment.component';
import { InspectionsComponent } from './jobsite/inspections/inspections.component';
import { VisitorsComponent } from './jobsite/visitors/visitors.component';
import { DeliveriesComponent } from './jobsite/deliveries/deliveries.component';
import { SubcontractorsComponent } from './jobsite/subcontractors/subcontractors.component';
import { PhotosPlaceholderComponent } from './jobsite/photos/photos-placeholder.component';
import { DeliveryComponent } from './jobsite/delivery/delivery.component';
import { JobsiteQrcodeComponent } from './jobsite/jobsite-qrcode.component';
import { CreateJobsitePageComponent } from './jobsite/create-jobsite-page.component';
import { EditJobsitePageComponent } from './jobsite/edit-jobsite-page.component';
// Import check-in components
import {
  QrScanResultComponent,
  CheckInTypeComponent,
  ContractorInductionComponent,
  CheckInFormComponent,
  CheckInInstructionsComponent,
  CheckInConfirmationComponent
} from './check-in';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'home', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'callback', component: CallbackComponent },
    { path: 'onboarding', component: CompanySetupComponent, canActivate: [AuthGuard] },
    { path: 'company-setup', component: CompanySetupComponent, canActivate: [AuthGuard] },
    { path: 'companies', component: CompanyIndexComponent, canActivate: [AuthGuard] },
    { path: 'company/:id', component: CompanyDetailComponent, canActivate: [AuthGuard] },
    { path: 'jobsites', component: JobsiteDashboardComponent, canActivate: [AuthGuard, CompanyGuard] },
    { path: 'jobsites/create', component: CreateJobsitePageComponent, canActivate: [AuthGuard, CompanyGuard] },
    { path: 'jobsites/:id/edit', component: EditJobsitePageComponent, canActivate: [AuthGuard, CompanyGuard] },
    {
      path: 'jobsites/:id',
      component: JobsiteDetailsComponent,
      canActivate: [AuthGuard, CompanyGuard],
      children: [
        { path: '', redirectTo: 'overview', pathMatch: 'full' },
        { path: 'overview', component: JobsiteOverviewComponent },
        { path: 'diary', component: DiaryComponent },
        { path: 'equipment', component: HireEquipmentComponent },
        { path: 'inspections', component: InspectionsComponent },
        { path: 'visitors', component: VisitorsComponent },
        { path: 'deliveries', component: DeliveriesComponent },
        { path: 'subcontractors', component: SubcontractorsComponent },
        { path: 'photos', component: PhotosPlaceholderComponent },
        { path: 'qrcode', component: JobsiteQrcodeComponent }
      ]
    },
    {
      path: 'jobsites/:id/deliveries',
      component: DeliveryComponent,
      canActivate: [AuthGuard, CompanyGuard]
    },
    // Check-in flow routes (public, no auth required)
    { path: 'qr-scan', component: QrScanResultComponent },
    { path: 'check-in/type', component: CheckInTypeComponent },
    { path: 'check-in/induction', component: ContractorInductionComponent },
    { path: 'check-in/form', component: CheckInFormComponent },
    { path: 'check-in/instructions', component: CheckInInstructionsComponent },
    { path: 'check-in/confirmation', component: CheckInConfirmationComponent },
    // Catch-all route for 404
    { path: '**', redirectTo: 'companies' }
];


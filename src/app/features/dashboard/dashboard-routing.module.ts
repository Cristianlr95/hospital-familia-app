import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StaffDashboardPage } from './pages/staff-dashboard/staff-dashboard.page';
import { TutorDashboardPage } from './pages/tutor-dashboard/tutor-dashboard.page';

const routes: Routes = [
  {
    path: 'tutor',
    component: TutorDashboardPage,
  },
  {
    path: 'staff',
    component: StaffDashboardPage,
  },
  {
    path: '',
    redirectTo: 'tutor',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}

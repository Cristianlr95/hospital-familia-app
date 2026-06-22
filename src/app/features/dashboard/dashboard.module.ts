import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StaffDashboardPage } from './pages/staff-dashboard/staff-dashboard.page';
import { TutorDashboardPage } from './pages/tutor-dashboard/tutor-dashboard.page';
import { FamilyCalendarComponent } from './components/family-calendar/family-calendar.component';

@NgModule({
  declarations: [TutorDashboardPage, StaffDashboardPage, FamilyCalendarComponent],
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule, DashboardRoutingModule],
})
export class DashboardModule {}

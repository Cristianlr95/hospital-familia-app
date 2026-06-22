import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StaffDashboardPage } from './pages/staff-dashboard/staff-dashboard.page';
import { TutorDashboardPage } from './pages/tutor-dashboard/tutor-dashboard.page';
import { EventsModule } from '../events/events.module';

@NgModule({
  declarations: [TutorDashboardPage, StaffDashboardPage],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    EventsModule,
    DashboardRoutingModule,
  ],
})
export class DashboardModule {}

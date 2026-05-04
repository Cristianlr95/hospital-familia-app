import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { TutorDashboardPage } from './pages/tutor-dashboard/tutor-dashboard.page';

@NgModule({
  declarations: [TutorDashboardPage],
  imports: [CommonModule, IonicModule, DashboardRoutingModule],
})
export class DashboardModule {}

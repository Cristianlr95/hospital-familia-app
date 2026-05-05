import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { LinkingRoutingModule } from './linking-routing.module';
import { LinkPatientPage } from './pages/link-patient/link-patient.page';

@NgModule({
  declarations: [LinkPatientPage],
  imports: [CommonModule, IonicModule, ReactiveFormsModule, LinkingRoutingModule],
})
export class LinkingModule {}

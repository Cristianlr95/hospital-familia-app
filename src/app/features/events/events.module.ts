import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { PatientEventCalendarComponent } from './components/patient-event-calendar/patient-event-calendar.component';

@NgModule({
  declarations: [PatientEventCalendarComponent],
  imports: [CommonModule, IonicModule],
  exports: [PatientEventCalendarComponent],
})
export class EventsModule {}

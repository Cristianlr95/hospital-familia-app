import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { PatientEventDto } from '../../../events/models/patient-event.models';

interface CalendarDay {
  date: Date;
  key: string;
  dayNumber: number;
  currentMonth: boolean;
  events: PatientEventDto[];
}

@Component({
  selector: 'app-family-calendar',
  templateUrl: './family-calendar.component.html',
  styleUrls: ['./family-calendar.component.scss'],
  standalone: false,
})
export class FamilyCalendarComponent implements OnChanges {
  @Input() events: PatientEventDto[] = [];
  @Input() title = 'Calendario familiar';
  @Output() eventSelected = new EventEmitter<PatientEventDto>();

  viewDate = this.startOfMonth(new Date());
  selectedDateKey = this.dateKey(new Date());
  calendarDays: CalendarDay[] = [];

  readonly weekdayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['events'] && this.events.length) {
      const firstEventDate = new Date(this.events[0].scheduledAt);
      this.viewDate = this.startOfMonth(firstEventDate);
      this.selectedDateKey = this.dateKey(firstEventDate);
    }
    this.buildCalendar();
  }

  get selectedEvents(): PatientEventDto[] {
    return this.eventsForDate(this.selectedDateKey);
  }

  get monthLabel(): string {
    const label = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' })
      .format(this.viewDate);
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  previousMonth(): void {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() - 1, 1);
    this.selectFirstRelevantDay();
    this.buildCalendar();
  }

  nextMonth(): void {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1);
    this.selectFirstRelevantDay();
    this.buildCalendar();
  }

  goToToday(): void {
    const today = new Date();
    this.viewDate = this.startOfMonth(today);
    this.selectedDateKey = this.dateKey(today);
    this.buildCalendar();
  }

  selectDay(day: CalendarDay): void {
    this.selectedDateKey = day.key;
    if (!day.currentMonth) {
      this.viewDate = this.startOfMonth(day.date);
      this.buildCalendar();
    }
  }

  eventTypeLabel(type: PatientEventDto['type']): string {
    return {
      SURGERY: 'Cirugía',
      EXAM: 'Examen',
      VISIT: 'Visita',
      STATE_CHANGE: 'Cambio de estado',
      DISCHARGE: 'Alta',
      OTHER: 'Otro',
    }[type];
  }

  eventStatusLabel(status: PatientEventDto['status']): string {
    return {
      SCHEDULED: 'Programado',
      IN_PROGRESS: 'En curso',
      COMPLETED: 'Completado',
      CANCELLED: 'Cancelado',
    }[status];
  }

  eventColor(type: PatientEventDto['type']): string {
    return {
      SURGERY: 'surgery',
      EXAM: 'exam',
      VISIT: 'visit',
      STATE_CHANGE: 'state',
      DISCHARGE: 'discharge',
      OTHER: 'other',
    }[type];
  }

  selectedDateLabel(): string {
    const date = this.parseDateKey(this.selectedDateKey);
    const label = new Intl.DateTimeFormat('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date);
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  trackDay(_: number, day: CalendarDay): string {
    return day.key;
  }

  trackEvent(_: number, event: PatientEventDto): number {
    return event.id;
  }

  private buildCalendar(): void {
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const gridStart = new Date(year, month, 1 - mondayOffset);

    this.calendarDays = Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const key = this.dateKey(date);
      return {
        date,
        key,
        dayNumber: date.getDate(),
        currentMonth: date.getMonth() === month,
        events: this.eventsForDate(key),
      };
    });
  }

  private selectFirstRelevantDay(): void {
    const event = this.events.find((item) => {
      const date = new Date(item.scheduledAt);
      return date.getFullYear() === this.viewDate.getFullYear()
        && date.getMonth() === this.viewDate.getMonth();
    });
    this.selectedDateKey = event
      ? this.dateKey(new Date(event.scheduledAt))
      : this.dateKey(this.viewDate);
  }

  private eventsForDate(key: string): PatientEventDto[] {
    return this.events
      .filter((event) => this.dateKey(new Date(event.scheduledAt)) === key)
      .sort((first, second) => (
        new Date(first.scheduledAt).getTime() - new Date(second.scheduledAt).getTime()
      ));
  }

  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private dateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseDateKey(key: string): Date {
    const [year, month, day] = key.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
}

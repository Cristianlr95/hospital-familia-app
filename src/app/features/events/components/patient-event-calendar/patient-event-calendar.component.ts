import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  ElementRef,
  Input,
  OnChanges,
  Output,
  QueryList,
  SimpleChanges,
  ViewChildren,
} from '@angular/core';
import { PatientEventDto, PatientEventRange } from '../../models/patient-event.models';
import {
  patientEventStatusLabel,
  patientEventTypeColor,
  patientEventTypeLabel,
} from '../../presentation/patient-event.presentation';

interface CalendarDay {
  readonly date: Date;
  readonly key: string;
  readonly dayNumber: number;
  readonly currentMonth: boolean;
  readonly events: readonly PatientEventDto[];
}

@Component({
  selector: 'app-patient-event-calendar',
  templateUrl: './patient-event-calendar.component.html',
  styleUrls: ['./patient-event-calendar.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientEventCalendarComponent implements OnChanges {
  @ViewChildren('dayButton', { read: ElementRef })
  private dayButtons?: QueryList<ElementRef<HTMLButtonElement>>;

  @Input() events: readonly PatientEventDto[] = [];
  @Input() selectedDate: string | null = null;
  @Input() title = 'Calendario familiar';
  @Input() locale = 'es-CL';
  @Input() loading = false;
  @Input() compact = false;

  @Output() selectedDateChange = new EventEmitter<string>();
  @Output() eventSelected = new EventEmitter<PatientEventDto>();
  @Output() visibleRangeChange = new EventEmitter<PatientEventRange>();

  viewDate = this.startOfMonth(new Date());
  activeDateKey = this.dateKey(new Date());
  calendarDays: readonly CalendarDay[] = [];
  private sortedEvents: readonly PatientEventDto[] = [];

  readonly weekdayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['events']) {
      this.sortedEvents = [...this.events].sort((first, second) => (
        new Date(first.scheduledAt).getTime() - new Date(second.scheduledAt).getTime()
      ));
    }

    if (changes['selectedDate'] && this.isDateKey(this.selectedDate)) {
      this.activeDateKey = this.selectedDate;
      this.viewDate = this.startOfMonth(this.parseDateKey(this.activeDateKey));
    } else if (changes['events'] && this.sortedEvents.length && !this.isDateKey(this.selectedDate)) {
      const firstEventDate = new Date(this.sortedEvents[0].scheduledAt);
      this.viewDate = this.startOfMonth(firstEventDate);
      this.activeDateKey = this.dateKey(firstEventDate);
    }

    this.buildCalendar();
  }

  get selectedEvents(): readonly PatientEventDto[] {
    return this.eventsForDate(this.activeDateKey);
  }

  get monthLabel(): string {
    return this.capitalize(new Intl.DateTimeFormat(this.locale, {
      month: 'long',
      year: 'numeric',
    }).format(this.viewDate));
  }

  previousMonth(): void {
    this.changeMonth(-1);
  }

  nextMonth(): void {
    this.changeMonth(1);
  }

  goToToday(): void {
    const today = new Date();
    this.viewDate = this.startOfMonth(today);
    this.setSelectedDate(this.dateKey(today));
    this.buildCalendar();
    this.emitVisibleRange();
  }

  selectDay(day: CalendarDay): void {
    if (!day.currentMonth) {
      this.viewDate = this.startOfMonth(day.date);
      this.emitVisibleRange();
    }
    this.setSelectedDate(day.key);
    this.buildCalendar();
  }

  handleDayKeydown(event: KeyboardEvent, day: CalendarDay): void {
    const offsets: Partial<Record<KeyboardEvent['key'], number>> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    let targetDate: Date | null = null;

    if (event.key in offsets) {
      targetDate = new Date(day.date);
      targetDate.setDate(targetDate.getDate() + (offsets[event.key] ?? 0));
    } else if (event.key === 'Home' || event.key === 'End') {
      const mondayIndex = (day.date.getDay() + 6) % 7;
      targetDate = new Date(day.date);
      targetDate.setDate(targetDate.getDate() + (event.key === 'Home' ? -mondayIndex : 6 - mondayIndex));
    } else if (event.key === 'PageUp' || event.key === 'PageDown') {
      targetDate = new Date(day.date);
      targetDate.setMonth(targetDate.getMonth() + (event.key === 'PageUp' ? -1 : 1));
    }

    if (!targetDate) {
      return;
    }

    event.preventDefault();
    this.selectDateAndFocus(targetDate);
  }

  selectEvent(event: PatientEventDto): void {
    this.eventSelected.emit(event);
  }

  eventTypeLabel(type: PatientEventDto['type']): string {
    return patientEventTypeLabel(type);
  }

  eventStatusLabel(status: PatientEventDto['status']): string {
    return patientEventStatusLabel(status);
  }

  eventColor(type: PatientEventDto['type']): string {
    return patientEventTypeColor(type);
  }

  selectedDateLabel(): string {
    return this.capitalize(new Intl.DateTimeFormat(this.locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(this.parseDateKey(this.activeDateKey)));
  }

  dayAriaLabel(day: CalendarDay): string {
    const date = new Intl.DateTimeFormat(this.locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(day.date);
    const count = day.events.length;
    return `${date}. ${count} ${count === 1 ? 'evento' : 'eventos'}`;
  }

  eventAriaLabel(event: PatientEventDto): string {
    const time = new Intl.DateTimeFormat(this.locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(event.scheduledAt));
    return `${patientEventTypeLabel(event.type)}: ${event.title}, ${time}, ${patientEventStatusLabel(event.status)}`;
  }

  trackDay(_: number, day: CalendarDay): string {
    return day.key;
  }

  trackEvent(_: number, event: PatientEventDto): number {
    return event.id;
  }

  private changeMonth(offset: number): void {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + offset, 1);
    const event = this.sortedEvents.find((item) => {
      const date = new Date(item.scheduledAt);
      return date.getFullYear() === this.viewDate.getFullYear()
        && date.getMonth() === this.viewDate.getMonth();
    });
    this.setSelectedDate(event ? this.dateKey(new Date(event.scheduledAt)) : this.dateKey(this.viewDate));
    this.buildCalendar();
    this.emitVisibleRange();
  }

  private setSelectedDate(dateKey: string): void {
    this.activeDateKey = dateKey;
    this.selectedDateChange.emit(dateKey);
  }

  private emitVisibleRange(): void {
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    this.visibleRangeChange.emit({
      from: new Date(Date.UTC(year, month, 1)).toISOString(),
      to: new Date(Date.UTC(year, month + 1, 1)).toISOString(),
    });
  }

  private selectDateAndFocus(date: Date): void {
    const monthChanged = date.getFullYear() !== this.viewDate.getFullYear()
      || date.getMonth() !== this.viewDate.getMonth();
    this.viewDate = this.startOfMonth(date);
    this.setSelectedDate(this.dateKey(date));
    this.buildCalendar();
    if (monthChanged) {
      this.emitVisibleRange();
    }

    queueMicrotask(() => {
      const target = this.dayButtons?.find((button) => (
        button.nativeElement.dataset['date'] === this.activeDateKey
      ));
      target?.nativeElement.focus();
    });
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

  private eventsForDate(key: string): readonly PatientEventDto[] {
    return this.sortedEvents.filter((event) => this.dateKey(new Date(event.scheduledAt)) === key);
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

  private isDateKey(value: string | null): value is string {
    return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}

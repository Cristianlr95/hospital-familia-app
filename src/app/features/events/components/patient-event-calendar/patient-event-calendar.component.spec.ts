import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { PatientEventDto } from '../../models/patient-event.models';
import { PatientEventCalendarComponent } from './patient-event-calendar.component';

describe('PatientEventCalendarComponent', () => {
  let component: PatientEventCalendarComponent;
  let fixture: ComponentFixture<PatientEventCalendarComponent>;

  const events: PatientEventDto[] = [
    {
      id: 2,
      patientPublicId: 'patient-1',
      patientDisplayName: 'María González',
      type: 'VISIT',
      status: 'COMPLETED',
      title: 'Visita familiar',
      scheduledAt: '2026-06-23T18:00:00',
      createdAt: '2026-06-20T10:00:00',
      updatedAt: '2026-06-20T10:00:00',
    },
    {
      id: 1,
      patientPublicId: 'patient-1',
      patientDisplayName: 'María González',
      type: 'EXAM',
      status: 'SCHEDULED',
      title: 'Examen de control',
      scheduledAt: '2026-06-23T16:42:00',
      createdAt: '2026-06-20T10:00:00',
      updatedAt: '2026-06-20T10:00:00',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PatientEventCalendarComponent],
      imports: [CommonModule, IonicModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientEventCalendarComponent);
    component = fixture.componentInstance;
    component.events = events;
    component.ngOnChanges({
      events: {
        currentValue: events,
        previousValue: [],
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    fixture.detectChanges();
  });

  it('uses OnPush-compatible immutable inputs and sorts selected events', () => {
    expect(component.selectedEvents.map((event) => event.id)).toEqual([1, 2]);
    expect(events.map((event) => event.id)).toEqual([2, 1]);
  });

  it('emits the selected local date', () => {
    spyOn(component.selectedDateChange, 'emit');
    const day = component.calendarDays.find((item) => item.key === '2026-06-23');

    expect(day).toBeDefined();
    component.selectDay(day!);

    expect(component.selectedDateChange.emit).toHaveBeenCalledWith('2026-06-23');
  });

  it('emits an event selected from the daily agenda', () => {
    spyOn(component.eventSelected, 'emit');
    component.selectEvent(events[0]);
    expect(component.eventSelected.emit).toHaveBeenCalledWith(events[0]);
  });

  it('provides descriptive accessible labels', () => {
    const day = component.calendarDays.find((item) => item.key === '2026-06-23');
    expect(component.dayAriaLabel(day!)).toContain('2 eventos');
    expect(component.eventAriaLabel(events[1])).toContain('Programado');
  });

  it('moves to the next month', () => {
    spyOn(component.visibleRangeChange, 'emit');
    const currentMonth = component.viewDate.getMonth();
    component.nextMonth();
    expect(component.viewDate.getMonth()).toBe((currentMonth + 1) % 12);
    expect(component.visibleRangeChange.emit).toHaveBeenCalledWith({
      from: '2026-07-01T00:00:00.000Z',
      to: '2026-08-01T00:00:00.000Z',
    });
  });

  it('supports arrow-key navigation across days', () => {
    spyOn(component.selectedDateChange, 'emit');
    const day = component.calendarDays.find((item) => item.key === '2026-06-23');
    const keyboardEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    spyOn(keyboardEvent, 'preventDefault');

    component.handleDayKeydown(keyboardEvent, day!);

    expect(keyboardEvent.preventDefault).toHaveBeenCalled();
    expect(component.selectedDateChange.emit).toHaveBeenCalledWith('2026-06-24');
  });
});

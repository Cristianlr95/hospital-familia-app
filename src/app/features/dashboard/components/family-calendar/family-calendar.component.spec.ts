import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FamilyCalendarComponent } from './family-calendar.component';
import { PatientEventDto } from '../../../events/models/patient-event.models';

describe('FamilyCalendarComponent', () => {
  let component: FamilyCalendarComponent;
  let fixture: ComponentFixture<FamilyCalendarComponent>;

  const events: PatientEventDto[] = [
    {
      id: 1,
      patientPublicId: 'patient-1',
      patientDisplayName: 'María González',
      type: 'EXAM',
      status: 'SCHEDULED',
      title: 'Examen de control',
      scheduledAt: '2026-06-23T16:42:00Z',
      createdAt: '2026-06-20T10:00:00Z',
      updatedAt: '2026-06-20T10:00:00Z',
    },
    {
      id: 2,
      patientPublicId: 'patient-1',
      patientDisplayName: 'María González',
      type: 'VISIT',
      status: 'COMPLETED',
      title: 'Visita familiar',
      scheduledAt: '2026-06-23T18:00:00Z',
      createdAt: '2026-06-20T10:00:00Z',
      updatedAt: '2026-06-20T10:00:00Z',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FamilyCalendarComponent],
      imports: [CommonModule, IonicModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(FamilyCalendarComponent);
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

  it('groups events in the selected local day', () => {
    expect(component.selectedEvents.length).toBe(2);
    expect(component.selectedEvents[0].title).toBe('Examen de control');
  });

  it('translates event statuses for family users', () => {
    expect(component.eventStatusLabel('SCHEDULED')).toBe('Programado');
    expect(component.eventStatusLabel('COMPLETED')).toBe('Completado');
  });

  it('moves to the next month', () => {
    const currentMonth = component.viewDate.getMonth();
    component.nextMonth();
    expect(component.viewDate.getMonth()).toBe((currentMonth + 1) % 12);
  });
});

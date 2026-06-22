import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { ActivityFeedService } from '../../../activity/services/activity-feed.service';
import { ContactRequestService } from '../../../contact/services/contact-request.service';
import { PatientEventDto, PatientEventRange } from '../../../events/models/patient-event.models';
import { PatientEventService } from '../../../events/services/patient-event.service';
import { LinkingService } from '../../../linking/services/linking.service';
import { NotificationPreferenceService } from '../../../notifications/services/notification-preference.service';
import { PatientStatusService } from '../../../patient/services/patient-status.service';
import { TutorDashboardPage } from './tutor-dashboard.page';

describe('TutorDashboardPage', () => {
  let component: TutorDashboardPage;
  let eventService: jasmine.SpyObj<PatientEventService>;
  let patientStatusService: jasmine.SpyObj<PatientStatusService>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    eventService = jasmine.createSpyObj<PatientEventService>('PatientEventService', ['getUpcomingEventsForTutor']);
    patientStatusService = jasmine.createSpyObj<PatientStatusService>('PatientStatusService', ['getMyStatuses']);
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'getCurrentUser',
      'validateSession',
      'updateProfile',
      'getSessions',
      'revokeSession',
      'revokeOtherSessions',
      'logout',
      'clearSession',
    ]);

    TestBed.configureTestingModule({
      providers: [
        FormBuilder,
        { provide: Router, useValue: jasmine.createSpyObj<Router>('Router', ['navigate']) },
        {
          provide: AuthService,
          useValue: authService,
        },
        { provide: ActivityFeedService, useValue: jasmine.createSpyObj('ActivityFeedService', ['getTutorFeed']) },
        { provide: LinkingService, useValue: jasmine.createSpyObj('LinkingService', ['getMyPatients', 'getMyRequests']) },
        { provide: ContactRequestService, useValue: jasmine.createSpyObj('ContactRequestService', ['getMyRequests', 'create']) },
        { provide: PatientEventService, useValue: eventService },
        {
          provide: NotificationPreferenceService,
          useValue: jasmine.createSpyObj('NotificationPreferenceService', [
            'getPreferences',
            'getNotifications',
            'updatePreferences',
            'markAsRead',
          ]),
        },
        { provide: PatientStatusService, useValue: patientStatusService },
      ],
    });

    component = TestBed.runInInjectionContext(() => new TutorDashboardPage());
  });

  it('loads deferred section data only once', () => {
    spyOn(component, 'loadActivityFeed');
    spyOn(component, 'loadNotificationPreferences');

    component.showSection('messages');
    component.showSection('messages');

    expect(component.loadActivityFeed).toHaveBeenCalledTimes(1);
    expect(component.loadNotificationPreferences).toHaveBeenCalledTimes(1);
  });

  it('keeps successful patient events when another patient request fails', () => {
    patientStatusService.getMyStatuses.and.returnValue(of([
      {
        patientPublicId: 'patient-1',
        displayName: 'Paciente Uno',
        careStatus: 'ESTABLE',
        currentService: 'Medicina',
        currentLocation: 'Piso 1',
        updatedAt: '2026-06-22T12:00:00Z',
      },
      {
        patientPublicId: 'patient-2',
        displayName: 'Paciente Dos',
        careStatus: 'ESTABLE',
        currentService: 'Medicina',
        currentLocation: 'Piso 2',
        updatedAt: '2026-06-22T12:00:00Z',
      },
    ]));

    const event: PatientEventDto = {
      id: 1,
      patientPublicId: 'patient-1',
      patientDisplayName: 'Paciente Uno',
      type: 'EXAM',
      status: 'SCHEDULED',
      title: 'Control',
      scheduledAt: '2026-06-23T12:00:00Z',
      createdAt: '2026-06-22T12:00:00Z',
      updatedAt: '2026-06-22T12:00:00Z',
    };
    eventService.getUpcomingEventsForTutor.withArgs('patient-1', undefined).and.returnValue(of([event]));
    eventService.getUpcomingEventsForTutor.withArgs('patient-2', undefined).and.returnValue(
      throwError(() => new Error('network')),
    );

    component.loadPatientOverview();

    expect(component.upcomingEvents).toEqual([event]);
    expect(component.patientStatuses.length).toBe(2);
    expect(component.patientOverviewWarningMessage).toContain('Paciente Dos');
    expect(component.patientOverviewErrorMessage).toBe('');
  });

  it('merges a visible month without duplicating events from other months', () => {
    const range: PatientEventRange = {
      from: '2026-07-01T00:00:00.000Z',
      to: '2026-08-01T00:00:00.000Z',
    };
    const juneEvent: PatientEventDto = {
      id: 1,
      patientPublicId: 'patient-1',
      patientDisplayName: 'Paciente Uno',
      type: 'EXAM',
      status: 'SCHEDULED',
      title: 'Control junio',
      scheduledAt: '2026-06-23T12:00:00Z',
      createdAt: '2026-06-22T12:00:00Z',
      updatedAt: '2026-06-22T12:00:00Z',
    };
    const julyEvent = {
      ...juneEvent,
      id: 2,
      title: 'Control julio',
      scheduledAt: '2026-07-23T12:00:00Z',
    };
    component.upcomingEvents = [juneEvent, julyEvent];
    patientStatusService.getMyStatuses.and.returnValue(of([{
      patientPublicId: 'patient-1',
      displayName: 'Paciente Uno',
      careStatus: 'ESTABLE',
      currentService: 'Medicina',
      currentLocation: 'Piso 1',
      updatedAt: '2026-06-22T12:00:00Z',
    }]));
    eventService.getUpcomingEventsForTutor.withArgs('patient-1', range).and.returnValue(of([julyEvent]));

    component.loadVisibleEventRange(range);

    expect(eventService.getUpcomingEventsForTutor).toHaveBeenCalledWith('patient-1', range);
    expect(component.upcomingEvents.map((event) => event.id)).toEqual([1, 2]);
  });

  it('separates expired sessions from active accesses', () => {
    component.sessions = [
      {
        sessionId: 'current',
        createdAt: '2026-06-22T12:00:00Z',
        updatedAt: '2026-06-22T12:00:00Z',
        expiresAt: '2099-06-29T12:00:00Z',
        revoked: false,
        current: true,
      },
      {
        sessionId: 'expired',
        createdAt: '2026-06-01T12:00:00Z',
        updatedAt: '2026-06-01T12:00:00Z',
        expiresAt: '2026-06-02T12:00:00Z',
        revoked: false,
        current: false,
      },
    ];

    expect(component.currentSession()?.sessionId).toBe('current');
    expect(component.otherActiveSessions()).toEqual([]);
    expect(component.closedSessions().map((session) => session.sessionId)).toEqual(['expired']);
    expect(component.closedSessionLabel(component.closedSessions()[0])).toBe('Expirada');
  });

  it('does not save an unchanged profile', () => {
    component.profileForm.patchValue({
      firstName: 'Camila',
      lastName: 'Rivera',
      phoneNumber: '+56911112222',
    });
    component.profileForm.markAsPristine();

    component.updateProfile();

    expect(authService.updateProfile).not.toHaveBeenCalled();
  });

  it('does not revoke a session when confirmation is cancelled', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    const session = {
      sessionId: 'other',
      createdAt: '2026-06-22T12:00:00Z',
      updatedAt: '2026-06-22T12:00:00Z',
      expiresAt: '2099-06-29T12:00:00Z',
      revoked: false,
      current: false,
    };

    component.revokeSession(session);

    expect(authService.revokeSession).not.toHaveBeenCalled();
  });

  it('revokes a confirmed session exactly once', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    authService.revokeSession.and.returnValue(of(void 0));
    spyOn(component, 'loadSessions');
    const session = {
      sessionId: 'other',
      createdAt: '2026-06-22T12:00:00Z',
      updatedAt: '2026-06-22T12:00:00Z',
      expiresAt: '2099-06-29T12:00:00Z',
      revoked: false,
      current: false,
    };

    component.revokeSession(session);

    expect(authService.revokeSession).toHaveBeenCalledOnceWith('other');
    expect(component.loadSessions).toHaveBeenCalledTimes(1);
  });
});

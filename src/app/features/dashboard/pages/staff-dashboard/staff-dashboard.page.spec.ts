import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { ActivityFeedService } from '../../../activity/services/activity-feed.service';
import { BetaExitChecklistService } from '../../../beta/services/beta-exit-checklist.service';
import { ContactRequestService } from '../../../contact/services/contact-request.service';
import { PatientEventDto, PatientEventRange } from '../../../events/models/patient-event.models';
import { PatientEventService } from '../../../events/services/patient-event.service';
import { LinkingService } from '../../../linking/services/linking.service';
import { PatientStatusService } from '../../../patient/services/patient-status.service';
import { StaffPatientService } from '../../../patient/services/staff-patient.service';
import { ReviewReadinessService } from '../../../review/services/review-readiness.service';
import { StaffDashboardPage } from './staff-dashboard.page';

describe('StaffDashboardPage', () => {
  let component: StaffDashboardPage;
  let eventService: jasmine.SpyObj<PatientEventService>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    eventService = jasmine.createSpyObj<PatientEventService>('PatientEventService', [
      'getEventsForStaff',
      'createEvent',
      'changeStatus',
    ]);
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
        { provide: AuthService, useValue: authService },
        { provide: ActivityFeedService, useValue: jasmine.createSpyObj('ActivityFeedService', ['getStaffFeed']) },
        { provide: BetaExitChecklistService, useValue: jasmine.createSpyObj('BetaExitChecklistService', ['getChecklist', 'updateCheck']) },
        { provide: ContactRequestService, useValue: jasmine.createSpyObj('ContactRequestService', ['getStaffRequests', 'resolve']) },
        { provide: LinkingService, useValue: jasmine.createSpyObj('LinkingService', ['getPendingRequests', 'getLinkHistory', 'approveRequest', 'rejectRequest']) },
        { provide: StaffPatientService, useValue: jasmine.createSpyObj('StaffPatientService', ['getActivePatients', 'createPatient', 'deactivatePatient']) },
        { provide: PatientEventService, useValue: eventService },
        { provide: PatientStatusService, useValue: jasmine.createSpyObj('PatientStatusService', ['updatePatientStatusForStaff']) },
        { provide: ReviewReadinessService, useValue: jasmine.createSpyObj('ReviewReadinessService', ['getCurrentReadiness']) },
      ],
    });

    component = TestBed.runInInjectionContext(() => new StaffDashboardPage());
  });

  it('loads the visible month for the selected patient', () => {
    const range: PatientEventRange = {
      from: '2026-07-01T00:00:00.000Z',
      to: '2026-08-01T00:00:00.000Z',
    };
    const event: PatientEventDto = {
      id: 1,
      patientPublicId: 'patient-1',
      patientDisplayName: 'Paciente Uno',
      type: 'EXAM',
      status: 'SCHEDULED',
      title: 'Control',
      scheduledAt: '2026-07-23T12:00:00Z',
      createdAt: '2026-06-22T12:00:00Z',
      updatedAt: '2026-06-22T12:00:00Z',
    };
    component.selectedPatientPublicId = 'patient-1';
    eventService.getEventsForStaff.withArgs('patient-1', range).and.returnValue(of([event]));

    component.loadVisibleEventRange(range);

    expect(eventService.getEventsForStaff).toHaveBeenCalledOnceWith('patient-1', range);
    expect(component.events).toEqual([event]);
  });

  it('separates expired sessions from active sessions', () => {
    component.sessions = [
      {
        sessionId: 'active',
        createdAt: '2026-06-22T12:00:00Z',
        updatedAt: '2026-06-22T12:00:00Z',
        expiresAt: '2099-06-29T12:00:00Z',
        revoked: false,
        current: false,
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

    expect(component.otherActiveSessions().map((session) => session.sessionId)).toEqual(['active']);
    expect(component.closedSessions().map((session) => session.sessionId)).toEqual(['expired']);
  });

  it('does not revoke other sessions when confirmation is cancelled', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.sessions = [{
      sessionId: 'active',
      createdAt: '2026-06-22T12:00:00Z',
      updatedAt: '2026-06-22T12:00:00Z',
      expiresAt: '2099-06-29T12:00:00Z',
      revoked: false,
      current: false,
    }];

    component.revokeOtherSessions();

    expect(authService.revokeOtherSessions).not.toHaveBeenCalled();
  });
});

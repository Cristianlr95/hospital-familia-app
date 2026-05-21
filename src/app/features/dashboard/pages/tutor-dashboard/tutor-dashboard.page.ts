import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthSessionItemDto, UserDto } from '../../../../core/models/auth.models';
import { ActivityFeedItemDto } from '../../../activity/models/activity-feed.models';
import { ActivityFeedService } from '../../../activity/services/activity-feed.service';
import { LinkingService } from '../../../linking/services/linking.service';
import { LinkRequestDto, LinkedPatientDto } from '../../../linking/models/linking.models';
import { PatientEventDto } from '../../../events/models/patient-event.models';
import { PatientEventService } from '../../../events/services/patient-event.service';
import {
  NotificationDto,
  NotificationPreferenceDto,
  NotificationType,
} from '../../../notifications/models/notification-preference.models';
import { NotificationPreferenceService } from '../../../notifications/services/notification-preference.service';
import { PatientStatusDto } from '../../../patient/models/patient-status.models';
import { PatientStatusService } from '../../../patient/services/patient-status.service';

@Component({
  selector: 'app-tutor-dashboard-page',
  templateUrl: './tutor-dashboard.page.html',
  styleUrls: ['./tutor-dashboard.page.scss'],
  standalone: false,
})
export class TutorDashboardPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly activityFeedService = inject(ActivityFeedService);
  private readonly linkingService = inject(LinkingService);
  private readonly patientStatusService = inject(PatientStatusService);
  private readonly patientEventService = inject(PatientEventService);
  private readonly notificationPreferenceService = inject(NotificationPreferenceService);
  private readonly router = inject(Router);

  user: UserDto | null = this.authService.getCurrentUser();
  activityFeed: ActivityFeedItemDto[] = [];
  sessions: AuthSessionItemDto[] = [];
  linkedPatients: LinkedPatientDto[] = [];
  linkRequests: LinkRequestDto[] = [];
  patientStatuses: PatientStatusDto[] = [];
  upcomingEvents: PatientEventDto[] = [];
  notifications: NotificationDto[] = [];
  notificationPreferences: NotificationPreferenceDto | null = null;
  isRefreshing = false;
  isLoadingActivity = false;
  isLoadingSessions = false;
  isRevokingOtherSessions = false;
  sessionActionId: string | null = null;
  isLoadingLinks = false;
  isLoadingPatientOverview = false;
  isLoadingNotifications = false;
  isLoadingNotificationPreferences = false;
  isSavingNotificationPreferences = false;
  notificationActionId: number | null = null;
  errorMessage = '';
  activityErrorMessage = '';
  sessionErrorMessage = '';
  linkErrorMessage = '';
  patientOverviewErrorMessage = '';
  notificationErrorMessage = '';
  notificationPreferenceMessage = '';
  notificationPreferenceErrorMessage = '';

  ngOnInit(): void {
    this.refreshSession();
    this.loadActivityFeed();
    this.loadSessions();
    this.loadLinkingSummary();
    this.loadPatientOverview();
    this.loadNotifications();
    this.loadNotificationPreferences();
  }

  refreshSession(): void {
    if (this.isRefreshing) {
      return;
    }

    this.isRefreshing = true;
    this.errorMessage = '';

    this.authService.validateSession().subscribe({
      next: (user) => {
        this.user = user;
        this.isRefreshing = false;
      },
      error: () => {
        this.isRefreshing = false;
        this.errorMessage = 'Tu sesion no pudo validarse. Inicia sesion nuevamente.';
        this.authService.logout().subscribe(() => {
          void this.router.navigate(['/auth/login']);
        });
      },
    });
  }

  loadLinkingSummary(): void {
    if (this.isLoadingLinks) {
      return;
    }

    this.isLoadingLinks = true;
    this.linkErrorMessage = '';

    forkJoin({
      patients: this.linkingService.getMyPatients(),
      requests: this.linkingService.getMyRequests(),
    }).subscribe({
      next: ({ patients, requests }) => {
        this.linkedPatients = patients;
        this.linkRequests = requests;
        this.isLoadingLinks = false;
      },
      error: (error) => {
        this.isLoadingLinks = false;
        this.linkErrorMessage = error?.error?.message ?? 'No pudimos cargar tus vinculaciones.';
      },
    });
  }

  loadSessions(): void {
    if (this.isLoadingSessions) {
      return;
    }

    this.isLoadingSessions = true;
    this.sessionErrorMessage = '';

    this.authService.getSessions().subscribe({
      next: (sessions) => {
        this.sessions = sessions;
        this.isLoadingSessions = false;
      },
      error: (error) => {
        this.isLoadingSessions = false;
        this.sessionErrorMessage = error?.error?.message ?? 'No pudimos cargar las sesiones activas.';
      },
    });
  }

  loadActivityFeed(): void {
    if (this.isLoadingActivity) {
      return;
    }

    this.isLoadingActivity = true;
    this.activityErrorMessage = '';

    this.activityFeedService.getTutorFeed().subscribe({
      next: (items) => {
        this.activityFeed = items;
        this.isLoadingActivity = false;
      },
      error: (error) => {
        this.isLoadingActivity = false;
        this.activityErrorMessage = error?.error?.message ?? 'No pudimos cargar la actividad reciente.';
      },
    });
  }

  loadPatientOverview(): void {
    if (this.isLoadingPatientOverview) {
      return;
    }

    this.isLoadingPatientOverview = true;
    this.patientOverviewErrorMessage = '';

    this.patientStatusService.getMyStatuses().pipe(
      switchMap((statuses) => {
        if (!statuses.length) {
          return of({ statuses, events: [] as PatientEventDto[] });
        }

        return forkJoin(
          statuses.map((status) => this.patientEventService.getUpcomingEventsForTutor(status.patientPublicId)),
        ).pipe(
          map((eventGroups) => ({
            statuses,
            events: ([] as PatientEventDto[]).concat(...eventGroups).sort((first, second) => (
              new Date(first.scheduledAt).getTime() - new Date(second.scheduledAt).getTime()
            )),
          })),
        );
      }),
    ).subscribe({
      next: ({ statuses, events }) => {
        this.patientStatuses = statuses;
        this.upcomingEvents = events;
        this.isLoadingPatientOverview = false;
      },
      error: (error) => {
        this.isLoadingPatientOverview = false;
        this.patientOverviewErrorMessage = error?.error?.message ?? 'No pudimos cargar el estado autorizado de tus pacientes.';
      },
    });
  }

  loadNotificationPreferences(): void {
    if (this.isLoadingNotificationPreferences) {
      return;
    }

    this.isLoadingNotificationPreferences = true;
    this.notificationPreferenceErrorMessage = '';
    this.notificationPreferenceMessage = '';

    this.notificationPreferenceService.getPreferences().subscribe({
      next: (preferences) => {
        this.notificationPreferences = preferences;
        this.isLoadingNotificationPreferences = false;
      },
      error: (error) => {
        this.isLoadingNotificationPreferences = false;
        this.notificationPreferenceErrorMessage = error?.error?.message ?? 'No pudimos cargar tus preferencias.';
      },
    });
  }

  loadNotifications(): void {
    if (this.isLoadingNotifications) {
      return;
    }

    this.isLoadingNotifications = true;
    this.notificationErrorMessage = '';

    this.notificationPreferenceService.getNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.isLoadingNotifications = false;
      },
      error: (error) => {
        this.isLoadingNotifications = false;
        this.notificationErrorMessage = error?.error?.message ?? 'No pudimos cargar tus notificaciones.';
      },
    });
  }

  updateNotificationPreference(
    key: 'stateChangesEnabled' | 'eventsEnabled' | 'linkingUpdatesEnabled' | 'quietHoursEnabled',
    event: Event,
  ): void {
    if (!this.notificationPreferences || this.isSavingNotificationPreferences) {
      return;
    }

    const checked = Boolean((event as CustomEvent<{ checked: boolean }>).detail?.checked);
    const nextPreferences: NotificationPreferenceDto = {
      ...this.notificationPreferences,
      [key]: checked,
    };

    if (key === 'quietHoursEnabled' && checked && !nextPreferences.quietHoursStart) {
      nextPreferences.quietHoursStart = '22:00';
      nextPreferences.quietHoursEnd = '07:00';
    }

    this.saveNotificationPreferences(nextPreferences);
  }

  private saveNotificationPreferences(preferences: NotificationPreferenceDto): void {
    this.isSavingNotificationPreferences = true;
    this.notificationPreferenceErrorMessage = '';
    this.notificationPreferenceMessage = '';

    this.notificationPreferenceService.updatePreferences({
      stateChangesEnabled: preferences.stateChangesEnabled,
      eventsEnabled: preferences.eventsEnabled,
      linkingUpdatesEnabled: preferences.linkingUpdatesEnabled,
      quietHoursEnabled: preferences.quietHoursEnabled,
      quietHoursStart: preferences.quietHoursStart,
      quietHoursEnd: preferences.quietHoursEnd,
    }).subscribe({
      next: (savedPreferences) => {
        this.notificationPreferences = savedPreferences;
        this.isSavingNotificationPreferences = false;
        this.notificationPreferenceMessage = 'Preferencias actualizadas.';
      },
      error: (error) => {
        this.isSavingNotificationPreferences = false;
        this.notificationPreferenceErrorMessage = error?.error?.message ?? 'No pudimos guardar tus preferencias.';
      },
    });
  }

  markNotificationAsRead(notification: NotificationDto): void {
    if (notification.read || this.notificationActionId) {
      return;
    }

    this.notificationActionId = notification.id;
    this.notificationErrorMessage = '';

    this.notificationPreferenceService.markAsRead(notification.id).subscribe({
      next: (updatedNotification) => {
        this.notifications = this.notifications.map((item) => (
          item.id === updatedNotification.id ? updatedNotification : item
        ));
        this.notificationActionId = null;
      },
      error: (error) => {
        this.notificationActionId = null;
        this.notificationErrorMessage = error?.error?.message ?? 'No pudimos marcar la notificacion como leida.';
      },
    });
  }

  eventTypeLabel(type: PatientEventDto['type']): string {
    const labels: Record<PatientEventDto['type'], string> = {
      SURGERY: 'Cirugia',
      EXAM: 'Examen',
      VISIT: 'Visita',
      STATE_CHANGE: 'Cambio de estado',
      DISCHARGE: 'Alta',
      OTHER: 'Otro',
    };

    return labels[type] ?? type;
  }

  activityKindLabel(kind: ActivityFeedItemDto['kind']): string {
    const labels: Record<ActivityFeedItemDto['kind'], string> = {
      LINK: 'Vinculacion',
      LINK_PENDING: 'Pendiente',
      LINK_HISTORY: 'Historial',
      EVENT: 'Evento',
      STATUS: 'Estado',
    };

    return labels[kind] ?? kind;
  }

  notificationTypeLabel(type: NotificationType): string {
    const labels: Record<NotificationType, string> = {
      STATE_CHANGE: 'Cambio de estado',
      NEW_EVENT: 'Nuevo evento',
      EVENT_UPDATED: 'Evento actualizado',
      LINKING_APPROVED: 'Vinculacion aprobada',
      LINKING_REJECTED: 'Vinculacion rechazada',
      LINKING_REVOKED: 'Acceso revocado',
    };

    return labels[type] ?? type;
  }

  activityStatusColor(item: ActivityFeedItemDto): string {
    const status = item.status ?? '';
    if (status === 'APPROVED' || status === 'COMPLETED') {
      return 'success';
    }
    if (status === 'REJECTED' || status === 'CANCELLED' || status === 'REVOKED') {
      return 'danger';
    }
    if (status === 'IN_PROGRESS') {
      return 'warning';
    }
    return 'medium';
  }

  revokeSession(session: AuthSessionItemDto): void {
    this.sessionActionId = session.sessionId;
    this.sessionErrorMessage = '';

    this.authService.revokeSession(session.sessionId).subscribe({
      next: () => {
        if (session.current) {
          this.authService.clearSession();
          void this.router.navigate(['/auth/login']);
          return;
        }

        this.sessionActionId = null;
        this.loadSessions();
      },
      error: (error) => {
        this.sessionActionId = null;
        this.sessionErrorMessage = error?.error?.message ?? 'No pudimos revocar la sesion seleccionada.';
      },
    });
  }

  revokeOtherSessions(): void {
    if (this.isRevokingOtherSessions) {
      return;
    }

    this.isRevokingOtherSessions = true;
    this.sessionErrorMessage = '';

    this.authService.revokeOtherSessions().subscribe({
      next: () => {
        this.isRevokingOtherSessions = false;
        this.loadSessions();
      },
      error: (error) => {
        this.isRevokingOtherSessions = false;
        this.sessionErrorMessage = error?.error?.message ?? 'No pudimos cerrar las otras sesiones.';
      },
    });
  }

  goToLinkPatient(): void {
    void this.router.navigate(['/link-patient']);
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      void this.router.navigate(['/auth/login']);
    });
  }
}

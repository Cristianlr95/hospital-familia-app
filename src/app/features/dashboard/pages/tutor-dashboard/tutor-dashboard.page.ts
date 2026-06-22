import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthSessionItemDto, UserDto } from '../../../../core/models/auth.models';
import { ActivityFeedItemDto } from '../../../activity/models/activity-feed.models';
import { ActivityFeedService } from '../../../activity/services/activity-feed.service';
import { ContactRequestDto } from '../../../contact/models/contact-request.models';
import { ContactRequestService } from '../../../contact/services/contact-request.service';
import { LinkingService } from '../../../linking/services/linking.service';
import { LinkRequestDto, LinkedPatientDto } from '../../../linking/models/linking.models';
import { PatientEventDto, PatientEventRange } from '../../../events/models/patient-event.models';
import {
  patientEventStatusLabel,
  patientEventTypeLabel,
} from '../../../events/presentation/patient-event.presentation';
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
  @ViewChild(IonContent) private content?: IonContent;

  private readonly authService = inject(AuthService);
  private readonly activityFeedService = inject(ActivityFeedService);
  private readonly linkingService = inject(LinkingService);
  private readonly contactRequestService = inject(ContactRequestService);
  private readonly patientStatusService = inject(PatientStatusService);
  private readonly patientEventService = inject(PatientEventService);
  private readonly notificationPreferenceService = inject(NotificationPreferenceService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  user: UserDto | null = this.authService.getCurrentUser();
  activityFeed: ActivityFeedItemDto[] = [];
  sessions: AuthSessionItemDto[] = [];
  linkedPatients: LinkedPatientDto[] = [];
  linkRequests: LinkRequestDto[] = [];
  patientStatuses: PatientStatusDto[] = [];
  upcomingEvents: PatientEventDto[] = [];
  notifications: NotificationDto[] = [];
  contactRequests: ContactRequestDto[] = [];
  notificationPreferences: NotificationPreferenceDto | null = null;
  isRefreshing = false;
  isLoadingActivity = false;
  isLoadingSessions = false;
  isRevokingOtherSessions = false;
  sessionActionId: string | null = null;
  isLoadingLinks = false;
  isLoadingLinkRequests = false;
  isLoadingPatientOverview = false;
  isLoadingNotifications = false;
  isLoadingNotificationPreferences = false;
  isLoadingContactRequests = false;
  isSendingContactRequest = false;
  isSavingNotificationPreferences = false;
  isSavingProfile = false;
  notificationActionId: number | null = null;
  errorMessage = '';
  profileMessage = '';
  profileErrorMessage = '';
  activityErrorMessage = '';
  sessionErrorMessage = '';
  linkErrorMessage = '';
  patientOverviewErrorMessage = '';
  patientOverviewWarningMessage = '';
  notificationErrorMessage = '';
  notificationPreferenceMessage = '';
  notificationPreferenceErrorMessage = '';
  contactRequestMessage = '';
  contactRequestErrorMessage = '';
  activeSection: TutorSection = 'home';
  showSessionHistory = false;
  showAllActiveSessions = false;
  private readonly loadedSections = new Set<TutorSection>();

  readonly navigationItems: Array<{ id: TutorSection; label: string; icon: string }> = [
    { id: 'home', label: 'Inicio', icon: 'home-outline' },
    { id: 'patients', label: 'Pacientes', icon: 'people-outline' },
    { id: 'messages', label: 'Avisos', icon: 'notifications-outline' },
    { id: 'account', label: 'Cuenta', icon: 'person-circle-outline' },
  ];

  readonly profileForm = this.formBuilder.group({
    firstName: ['', [Validators.required, Validators.maxLength(120)]],
    lastName: ['', [Validators.required, Validators.maxLength(120)]],
    phoneNumber: ['', [Validators.maxLength(40)]],
  });

  readonly contactForm = this.formBuilder.group({
    patientPublicId: ['', [Validators.required]],
    message: ['', [Validators.required, Validators.maxLength(500)]],
  });

  ngOnInit(): void {
    this.refreshSession();
    this.loadLinkedPatients();
    this.loadPatientOverview();
    this.loadNotifications();
    this.loadContactRequests();
    this.loadedSections.add('home');
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
        this.patchProfileForm(user);
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

  updateProfile(): void {
    if (this.profileForm.invalid || this.profileForm.pristine || this.isSavingProfile) {
      this.profileForm.markAllAsTouched();
      this.profileErrorMessage = 'Revisa nombre, apellido y telefono antes de guardar.';
      return;
    }

    const raw = this.profileForm.getRawValue();
    this.isSavingProfile = true;
    this.profileMessage = '';
    this.profileErrorMessage = '';

    this.authService.updateProfile({
      firstName: raw.firstName ?? '',
      lastName: raw.lastName ?? '',
      phoneNumber: raw.phoneNumber || null,
    }).subscribe({
      next: (user) => {
        this.user = user;
        this.patchProfileForm(user);
        this.isSavingProfile = false;
        this.profileMessage = 'Perfil actualizado correctamente.';
      },
      error: (error) => {
        this.isSavingProfile = false;
        this.profileErrorMessage = error?.error?.message ?? 'No pudimos actualizar tu perfil.';
      },
    });
  }

  loadLinkingSummary(): void {
    this.loadLinkedPatients();
    this.loadLinkRequests();
  }

  loadLinkedPatients(): void {
    if (this.isLoadingLinks) {
      return;
    }

    this.isLoadingLinks = true;
    this.linkErrorMessage = '';

    this.linkingService.getMyPatients().subscribe({
      next: (patients) => {
        this.linkedPatients = patients;
        if (!this.contactForm.controls.patientPublicId.value && patients.length) {
          this.contactForm.patchValue({ patientPublicId: patients[0].patientPublicId });
        }
        this.isLoadingLinks = false;
      },
      error: (error) => {
        this.isLoadingLinks = false;
        this.linkErrorMessage = error?.error?.message ?? 'No pudimos cargar tus vinculaciones.';
      },
    });
  }

  loadLinkRequests(): void {
    if (this.isLoadingLinkRequests) {
      return;
    }

    this.isLoadingLinkRequests = true;
    this.linkErrorMessage = '';

    this.linkingService.getMyRequests().subscribe({
      next: (requests) => {
        this.linkRequests = requests;
        this.isLoadingLinkRequests = false;
      },
      error: (error) => {
        this.isLoadingLinkRequests = false;
        this.linkErrorMessage = error?.error?.message ?? 'No pudimos cargar tus solicitudes de vinculación.';
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

  loadPatientOverview(range?: PatientEventRange): void {
    if (this.isLoadingPatientOverview) {
      return;
    }

    this.isLoadingPatientOverview = true;
    this.patientOverviewErrorMessage = '';
    this.patientOverviewWarningMessage = '';

    this.patientStatusService.getMyStatuses().pipe(
      switchMap((statuses) => {
        if (!statuses.length) {
          return of({
            statuses,
            events: [] as PatientEventDto[],
            failedPatients: [] as string[],
            successfulPatientIds: [] as string[],
          });
        }

        return forkJoin(
          statuses.map((status) => this.patientEventService.getUpcomingEventsForTutor(status.patientPublicId, range).pipe(
            map((events) => ({ events, failedPatient: null as string | null })),
            catchError(() => of({ events: [] as PatientEventDto[], failedPatient: status.displayName })),
          )),
        ).pipe(
          map((eventResults) => ({
            statuses,
            events: ([] as PatientEventDto[]).concat(...eventResults.map((result) => result.events)).sort((first, second) => (
              new Date(first.scheduledAt).getTime() - new Date(second.scheduledAt).getTime()
            )),
            failedPatients: eventResults
              .map((result) => result.failedPatient)
              .filter((patient): patient is string => Boolean(patient)),
            successfulPatientIds: statuses
              .filter((_, index) => !eventResults[index].failedPatient)
              .map((status) => status.patientPublicId),
          })),
        );
      }),
    ).subscribe({
      next: ({ statuses, events, failedPatients = [], successfulPatientIds = [] }) => {
        this.patientStatuses = statuses;
        this.upcomingEvents = range
          ? this.mergeMonthlyEvents(events, range, successfulPatientIds)
          : events;
        if (failedPatients.length) {
          this.patientOverviewWarningMessage = `No pudimos actualizar la agenda de ${failedPatients.join(', ')}. Los demás pacientes siguen disponibles.`;
        }
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

  loadContactRequests(): void {
    if (this.isLoadingContactRequests) {
      return;
    }

    this.isLoadingContactRequests = true;
    this.contactRequestErrorMessage = '';

    this.contactRequestService.getMyRequests().subscribe({
      next: (requests) => {
        this.contactRequests = requests;
        this.isLoadingContactRequests = false;
      },
      error: (error) => {
        this.isLoadingContactRequests = false;
        this.contactRequestErrorMessage = error?.error?.message ?? 'No pudimos cargar tus solicitudes de contacto.';
      },
    });
  }

  sendContactRequest(): void {
    if (this.contactForm.invalid || this.isSendingContactRequest) {
      this.contactForm.markAllAsTouched();
      this.contactRequestErrorMessage = 'Selecciona un paciente y describe brevemente que necesitas.';
      return;
    }

    const raw = this.contactForm.getRawValue();
    this.isSendingContactRequest = true;
    this.contactRequestMessage = '';
    this.contactRequestErrorMessage = '';

    this.contactRequestService.create({
      patientPublicId: raw.patientPublicId ?? '',
      message: raw.message ?? '',
    }).subscribe({
      next: (request) => {
        this.isSendingContactRequest = false;
        this.contactRequests = [request, ...this.contactRequests.filter((item) => item.id !== request.id)];
        this.contactForm.patchValue({ message: '' });
        this.contactRequestMessage = 'Solicitud enviada al equipo del hospital.';
      },
      error: (error) => {
        this.isSendingContactRequest = false;
        this.contactRequestErrorMessage = error?.error?.message ?? 'No pudimos enviar la solicitud de contacto.';
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
    return patientEventTypeLabel(type);
  }

  eventStatusLabel(status: PatientEventDto['status']): string {
    return patientEventStatusLabel(status);
  }

  genericStatusLabel(status?: string | null): string {
    if (!status) {
      return '';
    }

    return {
      APPROVED: 'Aprobado',
      PENDING: 'Pendiente',
      REJECTED: 'Rechazado',
      REVOKED: 'Revocado',
      SCHEDULED: 'Programado',
      IN_PROGRESS: 'En curso',
      COMPLETED: 'Completado',
      CANCELLED: 'Cancelado',
      OPEN: 'Abierta',
      RESOLVED: 'Resuelta',
    }[status] ?? status;
  }

  activityMessage(item: ActivityFeedItemDto): string {
    const statusLabel = this.genericStatusLabel(item.status);
    if (item.kind === 'EVENT' && statusLabel) {
      const dateMatch = item.message.match(/\d{4}-\d{2}-\d{2}T[\d:.+-]+Z?/);
      if (dateMatch) {
        const dateLabel = new Intl.DateTimeFormat('es-CL', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(dateMatch[0]));
        return `${statusLabel} · ${dateLabel}`;
      }
      return statusLabel;
    }
    return item.message;
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
      CONTACT_REQUEST_RESOLVED: 'Contacto staff',
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
    const confirmed = window.confirm(
      session.current
        ? 'Esta acción cerrará tu sesión actual y volverás al inicio de sesión. ¿Deseas continuar?'
        : 'Esta acción cerrará el acceso seleccionado. ¿Deseas continuar?',
    );
    if (!confirmed) {
      return;
    }

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

    const confirmed = window.confirm(
      `Se cerrarán ${this.otherActiveSessions().length} accesos en otros dispositivos. ¿Deseas continuar?`,
    );
    if (!confirmed) {
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

  showSection(section: TutorSection): void {
    this.activeSection = section;
    this.loadSectionData(section);
    void this.content?.scrollToTop(220);
  }

  unreadNotificationsCount(): number {
    return this.notifications.filter((notification) => !notification.read).length;
  }

  openContactRequestsCount(): number {
    return this.contactRequests.filter((request) => request.status === 'OPEN').length;
  }

  nextActiveEvent(): PatientEventDto | null {
    return this.upcomingEvents.find((event) => (
      event.status === 'SCHEDULED' || event.status === 'IN_PROGRESS'
    )) ?? null;
  }

  currentSession(): AuthSessionItemDto | null {
    return this.sessions.find((session) => session.current && this.sessionIsActive(session)) ?? null;
  }

  loadVisibleEventRange(range: PatientEventRange): void {
    this.loadPatientOverview(range);
  }

  otherActiveSessions(): AuthSessionItemDto[] {
    return this.sessions.filter((session) => !session.current && this.sessionIsActive(session));
  }

  visibleOtherActiveSessions(): AuthSessionItemDto[] {
    return this.showAllActiveSessions ? this.otherActiveSessions() : this.otherActiveSessions().slice(0, 3);
  }

  closedSessions(): AuthSessionItemDto[] {
    return this.sessions.filter((session) => !this.sessionIsActive(session));
  }

  visibleClosedSessions(): AuthSessionItemDto[] {
    return this.showSessionHistory ? this.closedSessions() : this.closedSessions().slice(0, 2);
  }

  closedSessionLabel(session: AuthSessionItemDto): string {
    return session.revoked ? 'Revocada' : 'Expirada';
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      void this.router.navigate(['/auth/login']);
    });
  }

  isProfileFieldInvalid(controlName: keyof typeof this.profileForm.controls): boolean {
    const control = this.profileForm.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  isContactFieldInvalid(controlName: keyof typeof this.contactForm.controls): boolean {
    const control = this.contactForm.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  private patchProfileForm(user: UserDto): void {
    this.profileForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber ?? '',
    });
    this.profileForm.markAsPristine();
  }

  private loadSectionData(section: TutorSection): void {
    if (this.loadedSections.has(section)) {
      return;
    }

    if (section === 'patients') {
      this.loadLinkRequests();
    }
    if (section === 'messages') {
      this.loadActivityFeed();
      this.loadNotificationPreferences();
    }
    if (section === 'account') {
      this.loadSessions();
    }

    this.loadedSections.add(section);
  }

  private sessionIsActive(session: AuthSessionItemDto): boolean {
    return !session.revoked && new Date(session.expiresAt).getTime() > Date.now();
  }

  private mergeMonthlyEvents(
    monthlyEvents: PatientEventDto[],
    range: PatientEventRange,
    successfulPatientIds: string[],
  ): PatientEventDto[] {
    const from = new Date(range.from).getTime();
    const to = new Date(range.to).getTime();
    const successfulPatients = new Set(successfulPatientIds);
    const retained = this.upcomingEvents.filter((event) => {
      const scheduledAt = new Date(event.scheduledAt).getTime();
      const belongsToLoadedWindow = scheduledAt >= from
        && scheduledAt < to
        && successfulPatients.has(event.patientPublicId);
      return !belongsToLoadedWindow;
    });
    const eventsById = new Map<number, PatientEventDto>();

    [...retained, ...monthlyEvents].forEach((event) => eventsById.set(event.id, event));
    return [...eventsById.values()].sort((first, second) => (
      new Date(first.scheduledAt).getTime() - new Date(second.scheduledAt).getTime()
    ));
  }
}

type TutorSection = 'home' | 'patients' | 'messages' | 'account';

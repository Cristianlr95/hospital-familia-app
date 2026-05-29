import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthSessionItemDto, UserDto } from '../../../../core/models/auth.models';
import { ActivityFeedItemDto } from '../../../activity/models/activity-feed.models';
import { ActivityFeedService } from '../../../activity/services/activity-feed.service';
import { PatientEventDto, PatientEventStatus, PatientEventType } from '../../../events/models/patient-event.models';
import { PatientEventService } from '../../../events/services/patient-event.service';
import { LinkHistoryItemDto, LinkStatus, PendingLinkRequestDto } from '../../../linking/models/linking.models';
import { LinkingService } from '../../../linking/services/linking.service';
import { StaffPatientDto } from '../../../patient/models/staff-patient.models';
import { StaffPatientService } from '../../../patient/services/staff-patient.service';
import { PatientStatusService } from '../../../patient/services/patient-status.service';

@Component({
  selector: 'app-staff-dashboard-page',
  templateUrl: './staff-dashboard.page.html',
  styleUrls: ['./staff-dashboard.page.scss'],
  standalone: false,
})
export class StaffDashboardPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly activityFeedService = inject(ActivityFeedService);
  private readonly linkingService = inject(LinkingService);
  private readonly staffPatientService = inject(StaffPatientService);
  private readonly eventService = inject(PatientEventService);
  private readonly patientStatusService = inject(PatientStatusService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  user: UserDto | null = this.authService.getCurrentUser();
  activityFeed: ActivityFeedItemDto[] = [];
  sessions: AuthSessionItemDto[] = [];
  pendingRequests: PendingLinkRequestDto[] = [];
  historyItems: LinkHistoryItemDto[] = [];
  patients: StaffPatientDto[] = [];
  selectedPatientPublicId = '';
  events: PatientEventDto[] = [];
  isLoadingActivity = false;
  isLoadingSessions = false;
  isLoadingRequests = false;
  isLoadingHistory = false;
  isLoadingPatients = false;
  isLoadingEvents = false;
  isSavingPatient = false;
  isSavingProfile = false;
  archivingPatientId: string | null = null;
  isSavingEvent = false;
  isSavingStatus = false;
  isRevokingOtherSessions = false;
  actionRequestId: number | null = null;
  sessionActionId: string | null = null;
  rejectingRequestId: number | null = null;
  rejectReason = '';
  rejectReasonTouched = false;
  historyFilter: LinkStatus | 'ALL' = 'ALL';
  requestErrorMessage = '';
  historyErrorMessage = '';
  patientErrorMessage = '';
  patientFormErrorMessage = '';
  eventErrorMessage = '';
  eventFormErrorMessage = '';
  statusErrorMessage = '';
  activityErrorMessage = '';
  sessionErrorMessage = '';
  profileMessage = '';
  profileErrorMessage = '';
  successMessage = '';

  readonly eventTypes: PatientEventType[] = ['SURGERY', 'EXAM', 'VISIT', 'STATE_CHANGE', 'DISCHARGE', 'OTHER'];
  readonly eventStatuses: PatientEventStatus[] = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  readonly historyFilters: Array<LinkStatus | 'ALL'> = ['ALL', 'APPROVED', 'REJECTED', 'REVOKED'];

  readonly patientForm = this.formBuilder.group({
    displayName: ['', [Validators.required, Validators.maxLength(160)]],
    linkCode: ['', [Validators.required, Validators.maxLength(40), Validators.pattern(/^[A-Za-z0-9-]+$/)]],
  });

  readonly profileForm = this.formBuilder.group({
    firstName: ['', [Validators.required, Validators.maxLength(120)]],
    lastName: ['', [Validators.required, Validators.maxLength(120)]],
    phoneNumber: ['', [Validators.maxLength(40)]],
  });

  readonly eventForm = this.formBuilder.group({
    patientPublicId: ['', [Validators.required]],
    type: ['EXAM' as PatientEventType, [Validators.required]],
    title: ['', [Validators.required, Validators.maxLength(140)]],
    description: ['', [Validators.maxLength(500)]],
    scheduledAt: ['', [Validators.required]],
    estimatedDurationMinutes: [60, [Validators.min(1), Validators.max(1440)]],
    service: ['', [Validators.maxLength(120)]],
    location: ['', [Validators.maxLength(120)]],
    responsibleStaff: ['', [Validators.maxLength(160)]],
  });

  readonly statusForm = this.formBuilder.group({
    patientPublicId: ['', [Validators.required]],
    careStatus: ['', [Validators.required, Validators.maxLength(80)]],
    currentService: ['', [Validators.maxLength(120)]],
    currentLocation: ['', [Validators.maxLength(120)]],
    summary: ['', [Validators.maxLength(220)]],
  });

  ngOnInit(): void {
    this.refreshSession();
    this.loadActivityFeed();
    this.loadSessions();
    this.loadPatients();
    this.loadPendingRequests();
    this.loadHistory();
  }

  refreshSession(): void {
    this.authService.validateSession().subscribe({
      next: (user) => {
        this.user = user;
        this.patchProfileForm(user);
      },
      error: () => {
        this.authService.logout().subscribe(() => {
          void this.router.navigate(['/auth/login']);
        });
      },
    });
  }

  updateProfile(): void {
    if (this.profileForm.invalid || this.isSavingProfile) {
      this.profileForm.markAllAsTouched();
      this.profileErrorMessage = 'Revisa nombre, apellido y telefono antes de guardar.';
      return;
    }

    const raw = this.profileForm.getRawValue();
    this.isSavingProfile = true;
    this.profileMessage = '';
    this.profileErrorMessage = '';
    this.successMessage = '';

    this.authService.updateProfile({
      firstName: raw.firstName ?? '',
      lastName: raw.lastName ?? '',
      phoneNumber: raw.phoneNumber || null,
    }).subscribe({
      next: (user) => {
        this.user = user;
        this.patchProfileForm(user);
        this.isSavingProfile = false;
        this.profileMessage = 'Perfil staff actualizado.';
      },
      error: (error) => {
        this.isSavingProfile = false;
        this.profileErrorMessage = error?.error?.message ?? 'No pudimos actualizar tu perfil.';
      },
    });
  }

  loadPendingRequests(): void {
    if (this.isLoadingRequests) {
      return;
    }

    this.isLoadingRequests = true;
    this.requestErrorMessage = '';

    this.linkingService.getPendingRequests().subscribe({
      next: (requests) => {
        this.pendingRequests = requests;
        this.isLoadingRequests = false;
      },
      error: (error) => {
        this.isLoadingRequests = false;
        this.requestErrorMessage = error?.error?.message ?? 'No pudimos cargar las solicitudes pendientes.';
      },
    });
  }

  loadActivityFeed(): void {
    if (this.isLoadingActivity) {
      return;
    }

    this.isLoadingActivity = true;
    this.activityErrorMessage = '';

    this.activityFeedService.getStaffFeed().subscribe({
      next: (items) => {
        this.activityFeed = items;
        this.isLoadingActivity = false;
      },
      error: (error) => {
        this.isLoadingActivity = false;
        this.activityErrorMessage = error?.error?.message ?? 'No pudimos cargar la actividad del staff.';
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

  loadPatients(): void {
    if (this.isLoadingPatients) {
      return;
    }

    this.isLoadingPatients = true;
    this.patientErrorMessage = '';

    this.staffPatientService.getActivePatients().subscribe({
      next: (patients) => {
        this.patients = patients;
        this.isLoadingPatients = false;
      },
      error: (error) => {
        this.isLoadingPatients = false;
        this.patientErrorMessage = error?.error?.message ?? 'No pudimos cargar los pacientes activos.';
      },
    });
  }

  createPatient(): void {
    if (this.patientForm.invalid || this.isSavingPatient) {
      this.patientForm.markAllAsTouched();
      this.patientFormErrorMessage = 'Revisa nombre y codigo antes de crear el paciente.';
      return;
    }

    const raw = this.patientForm.getRawValue();
    this.isSavingPatient = true;
    this.patientFormErrorMessage = '';
    this.patientErrorMessage = '';
    this.successMessage = '';

    this.staffPatientService.createPatient({
      displayName: raw.displayName ?? '',
      linkCode: raw.linkCode ?? '',
    }).subscribe({
      next: (patient) => {
        this.isSavingPatient = false;
        this.successMessage = 'Paciente creado para vinculacion familiar.';
        this.patients = [patient, ...this.patients.filter((item) => item.publicId !== patient.publicId)];
        this.patientForm.reset();
        this.selectPatient(patient.publicId);
      },
      error: (error) => {
        this.isSavingPatient = false;
        this.patientFormErrorMessage = error?.error?.message ?? 'No pudimos crear el paciente.';
      },
    });
  }

  approve(request: PendingLinkRequestDto): void {
    this.actionRequestId = request.id;
    this.requestErrorMessage = '';
    this.successMessage = '';

    this.linkingService.approveRequest(request.id).subscribe({
      next: () => {
        this.successMessage = 'Solicitud aprobada correctamente.';
        this.actionRequestId = null;
        this.loadPendingRequests();
        this.loadHistory();
        this.loadActivityFeed();
      },
      error: (error) => {
        this.actionRequestId = null;
        this.requestErrorMessage = error?.error?.message ?? 'No pudimos aprobar la solicitud.';
      },
    });
  }

  reject(request: PendingLinkRequestDto): void {
    this.rejectingRequestId = request.id;
    this.rejectReason = '';
    this.rejectReasonTouched = false;
    this.requestErrorMessage = '';
    this.successMessage = '';
  }

  cancelReject(): void {
    this.rejectingRequestId = null;
    this.rejectReason = '';
    this.rejectReasonTouched = false;
  }

  submitReject(request: PendingLinkRequestDto): void {
    this.rejectReasonTouched = true;

    if (!this.rejectReason.trim()) {
      return;
    }

    this.actionRequestId = request.id;
    this.requestErrorMessage = '';
    this.successMessage = '';

    this.linkingService.rejectRequest(request.id, { reason: this.rejectReason.trim() }).subscribe({
      next: () => {
        this.successMessage = 'Solicitud rechazada correctamente.';
        this.actionRequestId = null;
        this.cancelReject();
        this.loadPendingRequests();
        this.loadHistory();
        this.loadActivityFeed();
      },
      error: (error) => {
        this.actionRequestId = null;
        this.requestErrorMessage = error?.error?.message ?? 'No pudimos rechazar la solicitud.';
      },
    });
  }

  selectPatient(patientPublicId: string): void {
    this.selectedPatientPublicId = patientPublicId;
    this.eventForm.patchValue({ patientPublicId });
    this.statusForm.patchValue({ patientPublicId });
    this.loadEvents(patientPublicId);
  }

  usePatient(patient: StaffPatientDto): void {
    this.selectPatient(patient.publicId);
  }

  archivePatient(patient: StaffPatientDto): void {
    if (this.archivingPatientId) {
      return;
    }

    const confirmed = window.confirm(
      `Archivar a ${patient.displayName} desactivara su codigo ${patient.linkCode} para nuevas vinculaciones.`
    );

    if (!confirmed) {
      return;
    }

    this.archivingPatientId = patient.publicId;
    this.patientErrorMessage = '';
    this.successMessage = '';

    this.staffPatientService.deactivatePatient(patient.publicId).subscribe({
      next: () => {
        this.archivingPatientId = null;
        this.patients = this.patients.filter((item) => item.publicId !== patient.publicId);
        if (this.selectedPatientPublicId === patient.publicId) {
          this.selectedPatientPublicId = '';
          this.eventForm.patchValue({ patientPublicId: '' });
          this.statusForm.patchValue({ patientPublicId: '' });
          this.events = [];
        }
        this.successMessage = 'Paciente archivado. El codigo ya no acepta nuevas solicitudes.';
        this.loadActivityFeed();
      },
      error: (error) => {
        this.archivingPatientId = null;
        this.patientErrorMessage = error?.error?.message ?? 'No pudimos archivar el paciente.';
      },
    });
  }

  loadEvents(patientPublicId = this.eventForm.controls.patientPublicId.value ?? ''): void {
    const cleanPatientId = patientPublicId.trim();
    if (!cleanPatientId || this.isLoadingEvents) {
      this.eventForm.controls.patientPublicId.markAsTouched();
      return;
    }

    this.selectedPatientPublicId = cleanPatientId;
    this.isLoadingEvents = true;
    this.eventErrorMessage = '';

    this.eventService.getEventsForStaff(cleanPatientId).subscribe({
      next: (events) => {
        this.events = events;
        this.isLoadingEvents = false;
      },
      error: (error) => {
        this.isLoadingEvents = false;
        this.eventErrorMessage = error?.error?.message ?? 'No pudimos cargar los eventos del paciente.';
      },
    });
  }

  loadHistory(): void {
    if (this.isLoadingHistory) {
      return;
    }

    this.isLoadingHistory = true;
    this.historyErrorMessage = '';

    this.linkingService.getLinkHistory().subscribe({
      next: (historyItems) => {
        this.historyItems = historyItems;
        this.isLoadingHistory = false;
      },
      error: (error) => {
        this.isLoadingHistory = false;
        this.historyErrorMessage = error?.error?.message ?? 'No pudimos cargar el historial de vinculaciones.';
      },
    });
  }

  filteredHistory(): LinkHistoryItemDto[] {
    if (this.historyFilter === 'ALL') {
      return this.historyItems;
    }

    return this.historyItems.filter((item) => item.status === this.historyFilter);
  }

  createEvent(): void {
    if (this.eventForm.invalid || this.isSavingEvent) {
      this.eventForm.markAllAsTouched();
      this.eventFormErrorMessage = 'Revisa los campos obligatorios antes de crear el evento.';
      return;
    }

    const raw = this.eventForm.getRawValue();
    this.isSavingEvent = true;
    this.eventErrorMessage = '';
    this.eventFormErrorMessage = '';
    this.successMessage = '';

    this.eventService.createEvent({
      patientPublicId: raw.patientPublicId ?? '',
      type: raw.type ?? 'OTHER',
      title: raw.title ?? '',
      description: this.cleanOptional(raw.description),
      scheduledAt: new Date(raw.scheduledAt ?? '').toISOString(),
      estimatedDurationMinutes: raw.estimatedDurationMinutes,
      service: this.cleanOptional(raw.service),
      location: this.cleanOptional(raw.location),
      responsibleStaff: this.cleanOptional(raw.responsibleStaff),
    }).subscribe({
      next: () => {
        this.isSavingEvent = false;
        this.successMessage = 'Evento creado correctamente.';
        this.loadEvents(raw.patientPublicId ?? '');
        this.loadActivityFeed();
        this.eventForm.patchValue({
          title: '',
          description: '',
          scheduledAt: '',
          estimatedDurationMinutes: 60,
          service: '',
          location: '',
          responsibleStaff: '',
        });
      },
      error: (error) => {
        this.isSavingEvent = false;
        this.eventFormErrorMessage = error?.error?.message ?? 'No pudimos crear el evento.';
      },
    });
  }

  updateVisibleStatus(): void {
    if (this.statusForm.invalid || this.isSavingStatus) {
      this.statusForm.markAllAsTouched();
      this.statusErrorMessage = 'Revisa los campos obligatorios antes de actualizar el estado.';
      return;
    }

    const raw = this.statusForm.getRawValue();
    const patientPublicId = raw.patientPublicId ?? '';
    this.isSavingStatus = true;
    this.statusErrorMessage = '';
    this.successMessage = '';

    this.patientStatusService.updatePatientStatusForStaff(patientPublicId, {
      careStatus: raw.careStatus ?? '',
      currentService: this.cleanOptional(raw.currentService),
      currentLocation: this.cleanOptional(raw.currentLocation),
      summary: this.cleanOptional(raw.summary),
    }).subscribe({
      next: () => {
        this.isSavingStatus = false;
        this.successMessage = 'Estado visible actualizado para la familia.';
        this.loadActivityFeed();
      },
      error: (error) => {
        this.isSavingStatus = false;
        this.statusErrorMessage = error?.error?.message ?? 'No pudimos actualizar el estado visible.';
      },
    });
  }

  changeEventStatus(event: PatientEventDto, status: PatientEventStatus): void {
    this.eventErrorMessage = '';
    this.successMessage = '';

    this.eventService.changeStatus(event.id, status).subscribe({
      next: (updated) => {
        this.events = this.events.map((current) => current.id === updated.id ? updated : current);
        this.successMessage = 'Estado de evento actualizado.';
        this.loadActivityFeed();
      },
      error: (error) => {
        this.eventErrorMessage = error?.error?.message ?? 'No pudimos actualizar el estado del evento.';
      },
    });
  }

  eventTypeLabel(type: PatientEventType): string {
    const labels: Record<PatientEventType, string> = {
      SURGERY: 'Cirugia',
      EXAM: 'Examen',
      VISIT: 'Visita',
      STATE_CHANGE: 'Cambio de estado',
      DISCHARGE: 'Alta',
      OTHER: 'Otro',
    };

    return labels[type] ?? type;
  }

  linkStatusLabel(status: LinkStatus): string {
    const labels: Record<LinkStatus, string> = {
      PENDING: 'Pendiente',
      APPROVED: 'Aprobada',
      REJECTED: 'Rechazada',
      REVOKED: 'Revocada',
    };

    return labels[status] ?? status;
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

  activityStatusColor(item: ActivityFeedItemDto): string {
    const status = item.status ?? '';
    if (status === 'APPROVED' || status === 'COMPLETED') {
      return 'success';
    }
    if (status === 'REJECTED' || status === 'CANCELLED' || status === 'REVOKED') {
      return 'danger';
    }
    if (status === 'PENDING' || status === 'IN_PROGRESS') {
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

  logout(): void {
    this.authService.logout().subscribe(() => {
      void this.router.navigate(['/auth/login']);
    });
  }

  isFieldInvalid(controlName: keyof typeof this.eventForm.controls): boolean {
    const control = this.eventForm.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  isStatusFieldInvalid(controlName: keyof typeof this.statusForm.controls): boolean {
    const control = this.statusForm.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  isPatientFieldInvalid(controlName: keyof typeof this.patientForm.controls): boolean {
    const control = this.patientForm.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  isProfileFieldInvalid(controlName: keyof typeof this.profileForm.controls): boolean {
    const control = this.profileForm.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  private patchProfileForm(user: UserDto): void {
    this.profileForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber ?? '',
    });
  }

  private cleanOptional(value: string | null | undefined): string | null {
    if (!value || !value.trim()) {
      return null;
    }
    return value.trim();
  }
}

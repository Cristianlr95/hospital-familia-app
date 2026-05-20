import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { UserDto } from '../../../../core/models/auth.models';
import { ActivityFeedItemDto } from '../../../activity/models/activity-feed.models';
import { ActivityFeedService } from '../../../activity/services/activity-feed.service';
import { PatientEventDto, PatientEventStatus, PatientEventType } from '../../../events/models/patient-event.models';
import { PatientEventService } from '../../../events/services/patient-event.service';
import { LinkHistoryItemDto, LinkStatus, PendingLinkRequestDto } from '../../../linking/models/linking.models';
import { LinkingService } from '../../../linking/services/linking.service';

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
  private readonly eventService = inject(PatientEventService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  user: UserDto | null = this.authService.getCurrentUser();
  activityFeed: ActivityFeedItemDto[] = [];
  pendingRequests: PendingLinkRequestDto[] = [];
  historyItems: LinkHistoryItemDto[] = [];
  selectedPatientPublicId = '';
  events: PatientEventDto[] = [];
  isLoadingActivity = false;
  isLoadingRequests = false;
  isLoadingHistory = false;
  isLoadingEvents = false;
  isSavingEvent = false;
  actionRequestId: number | null = null;
  rejectingRequestId: number | null = null;
  rejectReason = '';
  rejectReasonTouched = false;
  historyFilter: LinkStatus | 'ALL' = 'ALL';
  requestErrorMessage = '';
  historyErrorMessage = '';
  eventErrorMessage = '';
  activityErrorMessage = '';
  successMessage = '';

  readonly eventTypes: PatientEventType[] = ['SURGERY', 'EXAM', 'VISIT', 'STATE_CHANGE', 'DISCHARGE', 'OTHER'];
  readonly eventStatuses: PatientEventStatus[] = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  readonly historyFilters: Array<LinkStatus | 'ALL'> = ['ALL', 'APPROVED', 'REJECTED', 'REVOKED'];

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

  ngOnInit(): void {
    this.refreshSession();
    this.loadActivityFeed();
    this.loadPendingRequests();
    this.loadHistory();
  }

  refreshSession(): void {
    this.authService.validateSession().subscribe({
      next: (user) => {
        this.user = user;
      },
      error: () => {
        this.authService.logout().subscribe(() => {
          void this.router.navigate(['/auth/login']);
        });
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
    this.loadEvents(patientPublicId);
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
      return;
    }

    const raw = this.eventForm.getRawValue();
    this.isSavingEvent = true;
    this.eventErrorMessage = '';
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
        this.eventErrorMessage = error?.error?.message ?? 'No pudimos crear el evento.';
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

  logout(): void {
    this.authService.logout().subscribe(() => {
      void this.router.navigate(['/auth/login']);
    });
  }

  private cleanOptional(value: string | null | undefined): string | null {
    if (!value || !value.trim()) {
      return null;
    }
    return value.trim();
  }
}

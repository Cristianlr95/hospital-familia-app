import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { UserDto } from '../../../../core/models/auth.models';
import { PatientEventDto, PatientEventStatus, PatientEventType } from '../../../events/models/patient-event.models';
import { PatientEventService } from '../../../events/services/patient-event.service';
import { PendingLinkRequestDto } from '../../../linking/models/linking.models';
import { LinkingService } from '../../../linking/services/linking.service';

@Component({
  selector: 'app-staff-dashboard-page',
  templateUrl: './staff-dashboard.page.html',
  styleUrls: ['./staff-dashboard.page.scss'],
  standalone: false,
})
export class StaffDashboardPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly linkingService = inject(LinkingService);
  private readonly eventService = inject(PatientEventService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  user: UserDto | null = this.authService.getCurrentUser();
  pendingRequests: PendingLinkRequestDto[] = [];
  selectedPatientPublicId = '';
  events: PatientEventDto[] = [];
  isLoadingRequests = false;
  isLoadingEvents = false;
  isSavingEvent = false;
  actionRequestId: number | null = null;
  requestErrorMessage = '';
  eventErrorMessage = '';
  successMessage = '';

  readonly eventTypes: PatientEventType[] = ['SURGERY', 'EXAM', 'VISIT', 'STATE_CHANGE', 'DISCHARGE', 'OTHER'];
  readonly eventStatuses: PatientEventStatus[] = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

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
    this.loadPendingRequests();
  }

  refreshSession(): void {
    this.authService.validateSession().subscribe({
      next: (user) => {
        this.user = user;
      },
      error: () => {
        this.authService.logout();
        void this.router.navigate(['/auth/login']);
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

  approve(request: PendingLinkRequestDto): void {
    this.actionRequestId = request.id;
    this.requestErrorMessage = '';
    this.successMessage = '';

    this.linkingService.approveRequest(request.id).subscribe({
      next: () => {
        this.successMessage = 'Solicitud aprobada correctamente.';
        this.actionRequestId = null;
        this.loadPendingRequests();
      },
      error: (error) => {
        this.actionRequestId = null;
        this.requestErrorMessage = error?.error?.message ?? 'No pudimos aprobar la solicitud.';
      },
    });
  }

  reject(request: PendingLinkRequestDto): void {
    const reason = window.prompt('Motivo del rechazo');
    if (reason === null) {
      return;
    }

    this.actionRequestId = request.id;
    this.requestErrorMessage = '';
    this.successMessage = '';

    this.linkingService.rejectRequest(request.id, { reason }).subscribe({
      next: () => {
        this.successMessage = 'Solicitud rechazada correctamente.';
        this.actionRequestId = null;
        this.loadPendingRequests();
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

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/auth/login']);
  }

  private cleanOptional(value: string | null | undefined): string | null {
    if (!value || !value.trim()) {
      return null;
    }
    return value.trim();
  }
}

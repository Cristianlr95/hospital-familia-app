import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { UserDto } from '../../../../core/models/auth.models';
import { ActivityFeedItemDto } from '../../../activity/models/activity-feed.models';
import { ActivityFeedService } from '../../../activity/services/activity-feed.service';
import { LinkingService } from '../../../linking/services/linking.service';
import { LinkRequestDto, LinkedPatientDto } from '../../../linking/models/linking.models';
import { PatientEventDto } from '../../../events/models/patient-event.models';
import { PatientEventService } from '../../../events/services/patient-event.service';
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
  private readonly router = inject(Router);

  user: UserDto | null = this.authService.getCurrentUser();
  activityFeed: ActivityFeedItemDto[] = [];
  linkedPatients: LinkedPatientDto[] = [];
  linkRequests: LinkRequestDto[] = [];
  patientStatuses: PatientStatusDto[] = [];
  upcomingEvents: PatientEventDto[] = [];
  isRefreshing = false;
  isLoadingActivity = false;
  isLoadingLinks = false;
  isLoadingPatientOverview = false;
  errorMessage = '';
  activityErrorMessage = '';
  linkErrorMessage = '';
  patientOverviewErrorMessage = '';

  ngOnInit(): void {
    this.refreshSession();
    this.loadActivityFeed();
    this.loadLinkingSummary();
    this.loadPatientOverview();
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

  goToLinkPatient(): void {
    void this.router.navigate(['/link-patient']);
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      void this.router.navigate(['/auth/login']);
    });
  }
}

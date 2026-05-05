import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { UserDto } from '../../../../core/models/auth.models';
import { LinkingService } from '../../../linking/services/linking.service';
import { LinkRequestDto, LinkedPatientDto } from '../../../linking/models/linking.models';

@Component({
  selector: 'app-tutor-dashboard-page',
  templateUrl: './tutor-dashboard.page.html',
  styleUrls: ['./tutor-dashboard.page.scss'],
  standalone: false,
})
export class TutorDashboardPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly linkingService = inject(LinkingService);
  private readonly router = inject(Router);

  user: UserDto | null = this.authService.getCurrentUser();
  linkedPatients: LinkedPatientDto[] = [];
  linkRequests: LinkRequestDto[] = [];
  isRefreshing = false;
  isLoadingLinks = false;
  errorMessage = '';
  linkErrorMessage = '';

  ngOnInit(): void {
    this.refreshSession();
    this.loadLinkingSummary();
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
        this.authService.logout();
        void this.router.navigate(['/auth/login']);
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

  goToLinkPatient(): void {
    void this.router.navigate(['/link-patient']);
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/auth/login']);
  }
}

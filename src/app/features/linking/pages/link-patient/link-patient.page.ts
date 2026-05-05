import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LinkingService } from '../../services/linking.service';
import { LinkRequestDto } from '../../models/linking.models';

@Component({
  selector: 'app-link-patient-page',
  templateUrl: './link-patient.page.html',
  styleUrls: ['./link-patient.page.scss'],
  standalone: false,
})
export class LinkPatientPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly linkingService = inject(LinkingService);
  private readonly router = inject(Router);

  isSubmitting = false;
  errorMessage = '';
  createdRequest: LinkRequestDto | null = null;

  readonly form = this.formBuilder.group({
    patientCode: ['', [Validators.required, Validators.maxLength(40)]],
  });

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    const patientCode = this.form.controls.patientCode.value?.trim() ?? '';
    this.errorMessage = '';
    this.createdRequest = null;
    this.isSubmitting = true;

    this.linkingService.requestLink({ patientCode }).subscribe({
      next: (request) => {
        this.createdRequest = request;
        this.isSubmitting = false;
        this.form.reset();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error?.error?.message ?? 'No pudimos enviar la solicitud. Revisa el codigo e intenta nuevamente.';
      },
    });
  }

  goToDashboard(): void {
    void this.router.navigate(['/dashboard/tutor']);
  }
}

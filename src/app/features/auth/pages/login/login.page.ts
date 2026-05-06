import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isSubmitting = false;
  errorMessage = '';

  readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.errorMessage = '';
    this.isSubmitting = true;

    this.authService.login({ email: email ?? '', password: password ?? '' }).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        const roles = response.user.roles ?? [];
        const dashboard = roles.includes('STAFF') || roles.includes('ADMIN') ? '/dashboard/staff' : '/dashboard/tutor';
        void this.router.navigate([dashboard]);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error?.error?.message ?? 'No pudimos iniciar sesion. Revisa tus datos e intenta nuevamente.';
      },
    });
  }
}

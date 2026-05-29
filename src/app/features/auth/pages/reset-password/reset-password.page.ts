import { Component, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password-page',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  standalone: false,
})
export class ResetPasswordPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  isRequesting = false;
  isConfirming = false;
  requestMessage = '';
  confirmMessage = '';
  errorMessage = '';
  devResetToken = '';

  readonly requestForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly confirmForm = this.formBuilder.group({
    token: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: this.passwordsMatch });

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.confirmForm.patchValue({ token });
    }
  }

  requestReset(): void {
    if (this.requestForm.invalid || this.isRequesting) {
      this.requestForm.markAllAsTouched();
      return;
    }

    this.isRequesting = true;
    this.errorMessage = '';
    this.requestMessage = '';
    this.devResetToken = '';

    const email = this.requestForm.controls.email.value ?? '';
    this.authService.requestPasswordReset({ email }).subscribe({
      next: (response) => {
        this.isRequesting = false;
        this.requestMessage = 'Si el correo existe, dejamos preparada una recuperacion segura.';
        if (response.devResetToken) {
          this.devResetToken = response.devResetToken;
          this.confirmForm.patchValue({ token: response.devResetToken });
        }
      },
      error: (error) => {
        this.isRequesting = false;
        this.errorMessage = error?.error?.message ?? 'No pudimos iniciar la recuperacion.';
      },
    });
  }

  confirmReset(): void {
    if (this.confirmForm.invalid || this.isConfirming) {
      this.confirmForm.markAllAsTouched();
      return;
    }

    this.isConfirming = true;
    this.errorMessage = '';
    this.confirmMessage = '';

    const value = this.confirmForm.getRawValue();
    this.authService.confirmPasswordReset({
      token: value.token ?? '',
      password: value.password ?? '',
      confirmPassword: value.confirmPassword ?? '',
    }).subscribe({
      next: () => {
        this.isConfirming = false;
        this.confirmMessage = 'Contrasena actualizada. Ya puedes iniciar sesion con tu nueva clave.';
        setTimeout(() => {
          void this.router.navigate(['/auth/login']);
        }, 1400);
      },
      error: (error) => {
        this.isConfirming = false;
        this.errorMessage = error?.error?.message ?? 'No pudimos confirmar la recuperacion.';
      },
    });
  }

  private passwordsMatch(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    return password && confirmPassword && password !== confirmPassword ? { passwordsMismatch: true } : null;
  }
}

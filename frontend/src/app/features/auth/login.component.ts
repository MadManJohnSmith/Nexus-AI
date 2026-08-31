import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'nexus-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-header">
          <div class="brand-badge">N</div>
          <h2 class="title">N.E.X.U.S.</h2>
          <p class="subtitle">Núcleo de Expediente y Seguimiento Universitario Superior</p>
        </div>

        @if (errorMessage()) {
          <div class="error-alert">
            <span class="error-icon">⚠️</span>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label for="email" class="form-label">Correo Institucional</label>
            <input 
              id="email" 
              type="email" 
              formControlName="email"
              placeholder="nombre@posgrado.edu"
              class="form-input"
              [class.input-error]="isFieldInvalid('email')"
            />
            @if (isFieldInvalid('email')) {
              <span class="field-error">Ingrese un correo institucional válido</span>
            }
          </div>

          <div class="form-group">
            <div class="label-row">
              <label for="password" class="form-label">Contraseña</label>
            </div>
            <input 
              id="password" 
              type="password" 
              formControlName="password"
              placeholder="••••••••••••"
              class="form-input"
              [class.input-error]="isFieldInvalid('password')"
            />
            @if (isFieldInvalid('password')) {
              <span class="field-error">La contraseña es obligatoria</span>
            }
          </div>

          <button 
            type="submit" 
            class="btn-primary" 
            [disabled]="loginForm.invalid || isLoading()">
            @if (isLoading()) {
              <span class="spinner"></span>
              <span>Validando credenciales...</span>
            } @else {
              <span>Ingresar al Sistema</span>
            }
          </button>
        </form>

        <div class="login-footer">
          <p class="institution-note">Sistema institucional con cifrado PBKDF2 y tokens SimpleJWT.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at 10% 20%, #EEF0FF 0%, var(--color-bg-app) 90%);
      padding: 20px;
    }

    .login-card {
      width: 100%;
      max-width: 440px;
      background-color: var(--color-bg-card);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-lg);
      padding: 40px;
    }

    .login-header {
      text-align: center;
      margin-bottom: 28px;
    }

    .brand-badge {
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-emphasis));
      color: #FFFFFF;
      font-size: 1.75rem;
      font-weight: 800;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      box-shadow: 0 8px 16px rgba(99, 101, 239, 0.25);
    }

    .title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--color-emphasis);
      letter-spacing: -0.02em;
      margin-bottom: 6px;
    }

    .subtitle {
      font-size: 0.85rem;
      color: var(--color-text-muted);
      line-height: 1.4;
    }

    .error-alert {
      display: flex;
      align-items: center;
      gap: 10px;
      background-color: var(--color-danger-bg);
      border: 1px solid var(--color-danger);
      color: var(--color-danger);
      padding: 12px 14px;
      border-radius: var(--radius-sm);
      font-size: 0.825rem;
      font-weight: 500;
      margin-bottom: 20px;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-label {
      font-size: 0.825rem;
      font-weight: 600;
      color: var(--color-text-main);
    }

    .form-input {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      color: var(--color-text-main);
      background-color: #FAFAFB;
      transition: all 0.2s;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--color-primary);
      background-color: #FFFFFF;
      box-shadow: 0 0 0 3px var(--color-primary-light);
    }

    .form-input.input-error {
      border-color: var(--color-danger);
      background-color: var(--color-danger-bg);
    }

    .field-error {
      font-size: 0.75rem;
      color: var(--color-danger);
      font-weight: 500;
    }

    .btn-primary {
      width: 100%;
      padding: 12px 16px;
      background-color: var(--color-primary);
      color: #FFFFFF;
      border: none;
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: background-color 0.2s ease, transform 0.1s ease;
      margin-top: 6px;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: var(--color-primary-hover);
    }

    .btn-primary:active:not(:disabled) {
      transform: translateY(1px);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #FFFFFF;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .login-footer {
      margin-top: 24px;
      text-align: center;
    }

    .institution-note {
      font-size: 0.725rem;
      color: var(--color-text-light);
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]]
  });

  public isLoading = signal<boolean>(false);
  public errorMessage = signal<string | null>(null);

  public isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  public onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: () => {
        this.isLoading.set(false);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/student-overview';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.error?.non_field_errors) {
          this.errorMessage.set(err.error.non_field_errors[0]);
        } else if (err.error?.detail) {
          this.errorMessage.set(err.error.detail);
        } else {
          this.errorMessage.set('Error de conexión o credenciales incorrectas. Verifique sus datos.');
        }
      }
    });
  }
}

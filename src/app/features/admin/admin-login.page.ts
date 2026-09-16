import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminAuthService } from '../../core/api/admin-auth.service';
import { SupabaseService } from '../../core/api/supabase.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { ButtonComponent } from '../../shared/ui/button.component';
import { FormFieldComponent } from '../../shared/ui/form-field.component';
import { IconComponent } from '../../shared/ui/icon.component';
import { InputDirective } from '../../shared/ui/input.directive';
import { LogoComponent } from '../../shared/ui/logo.component';
import { ThemeToggleComponent } from '../../shared/ui/theme-toggle.component';
import { LanguageMenuComponent } from '../../shared/ui/language-menu.component';
import { AdminStore } from './admin.store';

@Component({
  selector: 'app-admin-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonComponent,
    FormFieldComponent,
    IconComponent,
    InputDirective,
    LogoComponent,
    ThemeToggleComponent,
    LanguageMenuComponent,
  ],
  templateUrl: './admin-login.page.html',
  styleUrl: './admin-login.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLoginPage {
  protected readonly t = inject(I18nService).t;
  protected readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AdminAuthService);
  private readonly workspace = inject(AdminStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected async submit(): Promise<void> {
    if (this.busy() || !this.supabase.configured()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.error.set(this.t('admin.required'));
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.signIn(email, password);
      this.form.controls.password.reset();
      // A new session starts from fresh data, never what an earlier one left in memory.
      this.workspace.reset();
      const target = this.route.snapshot.queryParamMap.get('returnUrl');
      await this.router.navigateByUrl(
        target &&
          /^\/admin(?:\/(projects|categories|services|social|contact|messages))?$/.test(target)
          ? target
          : '/admin',
      );
    } catch (error) {
      this.error.set(
        this.t(
          error instanceof Error && error.message === 'admin_access_required'
            ? 'admin.notAdmin'
            : 'admin.loginError',
        ),
      );
    } finally {
      this.busy.set(false);
    }
  }
}

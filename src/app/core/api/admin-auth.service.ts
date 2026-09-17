import { Injectable, inject, signal } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly supabase = inject(SupabaseService);
  readonly email = signal('');
  /**
   * The membership check, shared by every guard run until the session changes, so moving between
   * dashboard sections costs no round trips. The guard is navigation only — row-level security is
   * what decides each read and write.
   */
  private check: Promise<boolean> | null = null;
  private watching = false;

  authorized(): Promise<boolean> {
    if (!this.supabase.configured()) return Promise.resolve(false);
    this.watchSession();
    this.check ??= this.verify().then((ok) => {
      // Only a success is remembered: a later sign-in, here or in another tab, must re-check.
      if (!ok) this.check = null;
      return ok;
    });
    return this.check;
  }

  async signIn(email: string, password: string): Promise<void> {
    this.check = null;
    const { error } = await this.supabase.client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    if (!(await this.authorized())) {
      await this.signOut();
      throw new Error('admin_access_required');
    }
  }

  async signOut(): Promise<void> {
    this.check = null;
    const { error } = await this.supabase.client.auth.signOut({ scope: 'local' });
    if (error) throw error;
    this.email.set('');
  }

  private async verify(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.client.auth.getUser();
      if (error || !data.user) return false;
      const membership = await this.supabase.client
        .from('dd_admins')
        .select('user_id')
        .eq('user_id', data.user.id)
        .maybeSingle();
      if (membership.error || !membership.data) return false;
      this.email.set(data.user.email ?? '');
      return true;
    } catch {
      return false;
    }
  }

  /** Forget the cached check whenever Supabase reports the session ended or changed hands. */
  private watchSession(): void {
    if (this.watching) return;
    this.watching = true;
    this.supabase.client.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        this.check = null;
      }
    });
  }
}

export const adminGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AdminAuthService);
  const router = inject(Router);
  return (
    (await auth.authorized()) ||
    router.createUrlTree(['/admin/login'], { queryParams: { returnUrl: state.url } })
  );
};

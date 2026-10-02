import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';

export type ThemeChoice = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

/** Shared with the inline bootstrap in `index.html` — change both together. */
export const THEME_STORAGE_KEY = 'dabadigital.theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * Browser-chrome colour per theme, kept in step with `--surface-page` in
 * `styles/tokens.scss`. It is the one colour the page cannot express as a token,
 * because it is painted by the browser rather than by the document.
 */
const THEME_COLOR: Readonly<Record<ResolvedTheme, string>> = {
  light: '#f7f8fa',
  dark: '#0d1117',
};

/**
 * Light / dark, with the OS as the starting point.
 *
 * Three states, not two. Until the visitor touches the toggle the site follows
 * `prefers-color-scheme` and keeps following it when the OS flips at sunset;
 * the first click pins an explicit choice that outlives the session. Dropping
 * `'system'` would mean guessing wrong for every first-time visitor whose OS is
 * already set the way they want it.
 *
 * The service owns `data-theme` on `<html>`; the tokens do the rest. No component
 * ever branches on the theme.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _choice = signal<ThemeChoice>(this.readStoredChoice());

  /** Tracks the OS as a signal, so `resolved` recomputes when it changes. */
  private readonly systemPrefersDark = signal(this.matchesDark());

  readonly choice = this._choice.asReadonly();

  /** What is actually on screen — this is what the UI labels itself against. */
  readonly resolved = computed<ResolvedTheme>(() => {
    const choice = this._choice();
    if (choice === 'system') {
      return this.systemPrefersDark() ? 'dark' : 'light';
    }
    return choice;
  });

  readonly isDark = computed(() => this.resolved() === 'dark');

  constructor() {
    this.watchSystemPreference();

    effect(() => {
      const theme = this.resolved();
      this.document.documentElement.setAttribute('data-theme', theme);
      this.applyBrowserChromeColor(theme);
    });
  }

  /**
   * Flips to the opposite of what is currently *displayed*, which is what the
   * button in the header promises. Toggling the stored choice instead would make
   * the first click a no-op for anyone whose OS already matches.
   */
  toggle(): void {
    this.set(this.resolved() === 'dark' ? 'light' : 'dark');
  }

  set(choice: ThemeChoice): void {
    this._choice.set(choice);
    this.persist(choice);
  }

  private watchSystemPreference(): void {
    const query = this.document.defaultView?.matchMedia?.(DARK_QUERY);
    if (!query) {
      return;
    }
    const onChange = (event: MediaQueryListEvent): void =>
      this.systemPrefersDark.set(event.matches);
    query.addEventListener('change', onChange);
    this.destroyRef.onDestroy(() => query.removeEventListener('change', onChange));
  }

  /**
   * Keeps the mobile browser's own toolbar in step with the page. Without it,
   * a dark page sits under a white address bar on Android.
   */
  private applyBrowserChromeColor(theme: ResolvedTheme): void {
    const meta = this.document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    meta?.setAttribute('content', THEME_COLOR[theme]);
  }

  private matchesDark(): boolean {
    return this.document.defaultView?.matchMedia?.(DARK_QUERY).matches ?? false;
  }

  private readStoredChoice(): ThemeChoice {
    try {
      const stored = this.document.defaultView?.localStorage.getItem(THEME_STORAGE_KEY);
      return stored === 'light' || stored === 'dark' ? stored : 'system';
    } catch {
      // Storage is blocked; follow the OS for this page view.
      return 'system';
    }
  }

  private persist(choice: ThemeChoice): void {
    try {
      const storage = this.document.defaultView?.localStorage;
      if (choice === 'system') {
        storage?.removeItem(THEME_STORAGE_KEY);
      } else {
        storage?.setItem(THEME_STORAGE_KEY, choice);
      }
    } catch {
      // Nothing to do — the choice holds for this page view.
    }
  }
}

import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

import { I18nService } from './i18n.service';
import { LOCALE_HOME_PATH, localeOfPath, type Locale } from './locale';

/**
 * The visitor picked a language, from the header's menu or the full-screen menu.
 *
 * The choice is remembered either way (`I18nService.setLocale`). On the landing page the
 * address follows too — `/`, `/fr`, `/en` — so the URL in the bar, in a bookmark or in a
 * shared link is always the language on screen. The page is kept (`LandingReuseStrategy`):
 * only its text changes, and it scrolls to the start of the section the visitor was
 * reading — the copy above it changes length with the language, so the old scroll offset
 * would land somewhere else.
 *
 * Every other page has a single address, and only its text changes.
 */
@Injectable({ providedIn: 'root' })
export class LocaleSwitchService {
  private readonly i18n = inject(I18nService);
  private readonly router = inject(Router);

  /** `section` is the landing section on screen (`SectionSpyService.active`), '' for none. */
  switchTo(locale: Locale, section: string): void {
    this.i18n.setLocale(locale);
    const path = this.router.url.split(/[?#]/)[0] || '/';
    if (localeOfPath(path) === null) {
      return;
    }
    void this.router.navigate([LOCALE_HOME_PATH[locale]], {
      // The banner is the top of the page, which a navigation without a fragment scrolls to.
      fragment: section && section !== 'banner' ? section : undefined,
    });
  }
}

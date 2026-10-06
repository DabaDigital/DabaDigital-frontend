import { PlatformLocation } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { I18nService } from './i18n.service';
import { LOCALE_STORAGE_KEY } from './locale';

/** The service as it starts on `pathname`, in a browser or at build time. */
function start(pathname: string, platform: 'browser' | 'server' = 'browser'): I18nService {
  TestBed.configureTestingModule({
    providers: [
      { provide: PlatformLocation, useValue: { pathname } },
      { provide: PLATFORM_ID, useValue: platform },
    ],
  });
  return TestBed.inject(I18nService);
}

function cookie(): string | undefined {
  return document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${LOCALE_STORAGE_KEY}=`))
    ?.split('=')[1];
}

describe('I18nService', () => {
  beforeEach(() => {
    localStorage.removeItem(LOCALE_STORAGE_KEY);
    document.cookie = `${LOCALE_STORAGE_KEY}=; max-age=0; path=/`;
  });

  /**
   * The server prerenders `/fr` in French; the browser must hydrate it in French too, or
   * the text would not match the page it adopts — whatever the visitor chose before.
   */
  it('takes a landing page’s language from its URL', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'en');

    expect(start('/fr').locale()).toBe('fr');
  });

  it('puts the primary locale, Arabic, at the root', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'en');

    expect(start('/').locale()).toBe('ar');
  });

  it('keeps the visitor’s choice on every other page', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'en');

    expect(start('/portfolio/caffeine').locale()).toBe('en');
  });

  /** At build time there is no visitor: no storage, no browser language to go by. */
  it('reads nothing but the URL at build time', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'en');

    expect(start('/about', 'server').locale()).toBe('ar');
  });

  it('remembers a choice in storage, and in a cookie the server can read', () => {
    const i18n = start('/');

    i18n.setLocale('fr');

    expect(i18n.locale()).toBe('fr');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('fr');
    expect(cookie()).toBe('fr');
  });

  /** Otherwise a French browser that picked Arabic would be sent to `/fr` next time. */
  it('remembers a choice even when it is the language already on screen', () => {
    const i18n = start('/');

    i18n.setLocale('ar');

    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('ar');
    expect(cookie()).toBe('ar');
  });

  it('does not remember a language it only followed', () => {
    const i18n = start('/');

    i18n.setLocale('en', { persist: false });

    expect(i18n.locale()).toBe('en');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBeNull();
    expect(cookie()).toBeUndefined();
  });

  it('points home at the landing page in the current language', () => {
    const i18n = start('/');
    expect(i18n.homePath()).toBe('/');

    i18n.setLocale('en', { persist: false });
    expect(i18n.homePath()).toBe('/en');
  });
});

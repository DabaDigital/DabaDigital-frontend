import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { I18nService } from './i18n.service';
import { LOCALE_STORAGE_KEY } from './locale';
import { LocaleSwitchService } from './locale-switch.service';

@Component({ template: '' })
class Page {}

describe('LocaleSwitchService', () => {
  beforeEach(() => {
    localStorage.removeItem(LOCALE_STORAGE_KEY);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: Page, data: { locale: 'ar' } },
          { path: 'fr', component: Page, data: { locale: 'fr' } },
          { path: 'en', component: Page, data: { locale: 'en' } },
          { path: 'about', component: Page },
        ]),
      ],
    });
  });

  it('moves a landing page to its URL in that language, back to the section on screen', async () => {
    const harness = await RouterTestingHarness.create('/');

    TestBed.inject(LocaleSwitchService).switchTo('fr', 'services');
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/fr#services');
    expect(TestBed.inject(I18nService).locale()).toBe('fr');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('fr');
  });

  /** The banner is the top of the page: no `#banner` in the address bar. */
  it('needs no fragment to return to the top', async () => {
    const harness = await RouterTestingHarness.create('/fr');

    TestBed.inject(LocaleSwitchService).switchTo('en', 'banner');
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/en');
  });

  it('changes only the text of a page that has one address', async () => {
    const harness = await RouterTestingHarness.create('/about');

    TestBed.inject(LocaleSwitchService).switchTo('en', '');
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/about');
    expect(TestBed.inject(I18nService).locale()).toBe('en');
  });
});

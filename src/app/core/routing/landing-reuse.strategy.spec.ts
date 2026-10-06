import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { LandingReuseStrategy } from './landing-reuse.strategy';

@Component({ template: '' })
class Page {}

describe('LandingReuseStrategy', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: Page, data: { locale: 'ar' } },
          { path: 'fr', component: Page, data: { locale: 'fr' } },
          { path: 'about', component: Page },
        ]),
        { provide: RouteReuseStrategy, useExisting: LandingReuseStrategy },
      ],
    });
  });

  /** A language switch must not throw away a form in progress or restart the 3D scenes. */
  it('keeps the one landing page alive across its language URLs', async () => {
    const harness = await RouterTestingHarness.create('/');
    const arabic = harness.routeDebugElement?.componentInstance;

    await harness.navigateByUrl('/fr');

    expect(harness.routeDebugElement?.componentInstance).toBe(arabic);
  });

  it('still gives any other route a page of its own', async () => {
    const harness = await RouterTestingHarness.create('/');
    const landing = harness.routeDebugElement?.componentInstance;

    await harness.navigateByUrl('/about');

    expect(harness.routeDebugElement?.componentInstance).not.toBe(landing);
  });
});

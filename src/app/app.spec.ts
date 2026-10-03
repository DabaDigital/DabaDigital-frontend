import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the site shell, the footer only once the first page has rendered', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('app-site-header')).not.toBeNull();
    expect(host.querySelector('main#main-content')).not.toBeNull();
    // Rendered before the page, it would stand where the page goes and be pushed
    // down when the page arrives: the layout shift `routed` exists to prevent.
    expect(host.querySelector('app-site-footer')).toBeNull();

    await TestBed.inject(Router).navigateByUrl('/');
    fixture.detectChanges();
    expect(host.querySelector('app-site-footer')).not.toBeNull();
  });

  it('exposes a skip link to the main content', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const skipLink = host.querySelector<HTMLAnchorElement>('a.skip-link');
    expect(skipLink?.getAttribute('href')).toBe('#main-content');
  });
});

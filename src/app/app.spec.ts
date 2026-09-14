import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the site shell', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('app-site-header')).not.toBeNull();
    expect(host.querySelector('main#main-content')).not.toBeNull();
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

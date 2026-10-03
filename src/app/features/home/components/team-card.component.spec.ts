import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { I18nService } from '../../../core/i18n/i18n.service';
import { TeamCardComponent } from './team-card.component';

@Component({
  selector: 'app-team-card-test-host',
  imports: [TeamCardComponent],
  template: `
    <app-team-card
      [name]="name()"
      role="Full Stack Developer"
      bio="Passionate about building useful digital products."
      [url]="url()"
      [photo]="photo()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TeamCardHost {
  readonly name = signal('Keltoum Malouki');
  // A trailing slash, to check the card shows the address as people say it.
  readonly url = signal('https://keltoummalouki.com/');
  readonly photo = signal('/images/team/keltoum-malouki.webp');
}

describe('TeamCardComponent', () => {
  let fixture: ComponentFixture<TeamCardHost>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TeamCardHost] }).compileComponents();
    TestBed.inject(I18nService).setLocale('en');
    fixture = TestBed.createComponent(TeamCardHost);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('names the member, then the role, then one line about them', () => {
    expect(host.querySelector('h3')?.textContent?.trim()).toBe('Keltoum Malouki');
    expect(host.querySelector('.team-card__role')?.textContent?.trim()).toBe(
      'Full Stack Developer',
    );
    expect(host.querySelector('.team-card__bio')?.textContent).toContain('useful digital products');
  });

  it('opens the portfolio in a new tab, and says so', () => {
    const link = host.querySelector('a');

    expect(link?.getAttribute('href')).toBe('https://keltoummalouki.com/');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toContain('noopener');
    // The visible label, the bare address, then the warning — words apart, so
    // a screen reader does not run them together.
    expect(link?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'View portfolio keltoummalouki.com (opens in a new tab)',
    );
  });

  it('leaves the portfolio tile out when the member has none', () => {
    fixture.componentInstance.url.set('');
    fixture.detectChanges();

    expect(host.querySelector('a')).toBeNull();
  });

  it('shows the portrait as ornament, the name beside it being what a screen reader needs', () => {
    const photo = host.querySelector('img');

    expect(photo?.getAttribute('src')).toBe('/images/team/keltoum-malouki.webp');
    expect(photo?.getAttribute('alt')).toBe('');
  });

  /** A portrait that is missing or mistyped must never show as a broken image. */
  it('falls back to the initials when the portrait fails to load, until the photo changes', () => {
    host.querySelector('img')?.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(host.querySelector('img')).toBeNull();
    const initials = host.querySelector('.team-card__initials');
    expect(initials?.textContent?.trim()).toBe('KM');
    expect(initials?.getAttribute('aria-hidden')).toBe('true');

    fixture.componentInstance.photo.set('/images/team/another.webp');
    fixture.detectChanges();

    expect(host.querySelector('img')?.getAttribute('src')).toBe('/images/team/another.webp');
  });

  it('shows the initials when no portrait is set', () => {
    fixture.componentInstance.photo.set('');
    fixture.detectChanges();

    expect(host.querySelector('img')).toBeNull();
    expect(host.querySelector('.team-card__initials')?.textContent?.trim()).toBe('KM');
  });

  it('keeps the initials to the first and last names, whatever the admin enters', () => {
    fixture.componentInstance.photo.set('');
    fixture.componentInstance.name.set('  Fatima Zahra El Idrissi ');
    fixture.detectChanges();

    expect(host.querySelector('.team-card__initials')?.textContent?.trim()).toBe('FI');
  });
});

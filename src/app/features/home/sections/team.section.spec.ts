import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { ContentStore } from '../../../core/content.store';
import { I18nService } from '../../../core/i18n/i18n.service';
import type { LocalizedText, ManagedTeamMember } from '../../../core/models/content.model';
import { TeamSection } from './team.section';

const text = (en: string): LocalizedText => ({ en, fr: en, ar: en });

/** Two members as the admin saved them: one with an uploaded portrait and a portfolio, one with neither. */
const MEMBERS: ManagedTeamMember[] = [
  {
    id: 'b69452ac',
    name: 'Jawad Boulmal',
    role: text('Full Stack Developer'),
    description: text('Focused on clean code.'),
    url: 'https://jawadboulmal.com',
    photo_url: 'https://example.supabase.co/storage/v1/object/public/dd-media/team/jawad.jpg',
    status: 'published',
    position: 0,
  },
  {
    id: '452c1d85',
    name: 'Keltoum Malouki',
    role: text('Full Stack Developer'),
    description: text('Passionate about useful products.'),
    url: '',
    photo_url: '',
    status: 'published',
    position: 1,
  },
];

/** The store as the section reads it, without Supabase behind it. */
const store: Pick<ContentStore, 'team' | 'text'> = {
  team: signal(MEMBERS),
  text: (value) => value.en,
};

describe('TeamSection', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamSection],
      providers: [{ provide: ContentStore, useValue: store }],
    }).compileComponents();
    TestBed.inject(I18nService).setLocale('en');
    const fixture = TestBed.createComponent(TeamSection);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('shows the members the store publishes, in the order the admin set', () => {
    const names = [...host.querySelectorAll('.team-card__name')].map((name) =>
      name.textContent?.trim(),
    );

    expect(names).toEqual(['Jawad Boulmal', 'Keltoum Malouki']);
  });

  /** The section once read a hard-coded list, so a portrait uploaded in the admin never showed. */
  it('shows the portrait uploaded in the admin, and the initials where there is none', () => {
    const cards = host.querySelectorAll('app-team-card');

    expect(cards[0].querySelector('img')?.getAttribute('src')).toBe(MEMBERS[0].photo_url);
    expect(cards[1].querySelector('img')).toBeNull();
    expect(cards[1].querySelector('.team-card__initials')?.textContent?.trim()).toBe('KM');
  });

  it('gives each card its role, and a portfolio tile only where the admin set a link', () => {
    const cards = host.querySelectorAll('app-team-card');

    expect(cards[0].querySelector('.team-card__role')?.textContent?.trim()).toBe(
      'Full Stack Developer',
    );
    expect(cards[0].querySelector('a')?.getAttribute('href')).toBe('https://jawadboulmal.com');
    expect(cards[1].querySelector('a')).toBeNull();
  });
});

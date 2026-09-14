import { describe, expect, it } from 'vitest';

import { COMPANY } from './company';

describe('COMPANY', () => {
  it('keeps displayed contact details aligned with actionable links', () => {
    expect(COMPANY.email).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
    expect(COMPANY.phoneHref).toBe(COMPANY.phone.replaceAll(' ', ''));
    expect(COMPANY.linkedin).toMatch(/^https:\/\/www\.linkedin\.com\//);
    expect(COMPANY.instagram).toMatch(/^https:\/\/www\.instagram\.com\//);
  });
});

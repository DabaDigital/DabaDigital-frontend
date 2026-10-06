import { describe, expect, it } from 'vitest';

import { LOCALE_HOME_PATH, localeOfPath } from './locale';

describe('localeOfPath', () => {
  it('names the language of each landing page', () => {
    expect(localeOfPath('/')).toBe('ar');
    expect(localeOfPath('/fr')).toBe('fr');
    expect(localeOfPath('/en')).toBe('en');
  });

  it('ignores a trailing slash', () => {
    expect(localeOfPath('/fr/')).toBe('fr');
    expect(localeOfPath('')).toBe('ar');
  });

  it('is null for every other page', () => {
    expect(localeOfPath('/about')).toBeNull();
    expect(localeOfPath('/fr/about')).toBeNull();
    expect(localeOfPath('/portfolio/fr')).toBeNull();
  });

  it('agrees with the paths it is the inverse of', () => {
    for (const [locale, path] of Object.entries(LOCALE_HOME_PATH)) {
      expect(localeOfPath(path)).toBe(locale);
    }
  });
});

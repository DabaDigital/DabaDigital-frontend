/**
 * The studio's own details.
 *
 * Data, not copy — an address and a phone number are the same in every locale —
 * so they live here rather than in `core/i18n/messages/`. Only their *labels* are
 * translated.
 *
 * ⚠ PLACEHOLDER — replace all four with the real ones before launch. They are
 * rendered as live `mailto:` and `tel:` links, so a wrong value here is a dead
 * contact route, not just wrong text.
 */
export const COMPANY = {
  email: 'hello@dabadigital.ma',
  phone: '+212 522 000 000',
  /** `tel:` will not accept the spaces in the display form. */
  phoneHref: '+212522000000',
  linkedin: 'https://www.linkedin.com/company/dabadigital',
  instagram: 'https://www.instagram.com/dabadigital',
} as const;

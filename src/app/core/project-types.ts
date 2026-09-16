import type { MessageKey } from './i18n/messages/ar';
import type { ProjectType } from './models/project-form.model';

/**
 * Project types offered on the contact form, in display order. Values are the stored enum
 * (`dd_messages.project_type`), so the admin inbox reads the same labels back.
 */
export const PROJECT_TYPES: readonly { value: ProjectType; labelKey: MessageKey }[] = [
  { value: 'website', labelKey: 'contact.type.website' },
  { value: 'web_app', labelKey: 'contact.type.webapp' },
  { value: 'ecommerce', labelKey: 'contact.type.ecommerce' },
  { value: 'mobile_app', labelKey: 'contact.type.mobile' },
  { value: 'other', labelKey: 'contact.type.other' },
];

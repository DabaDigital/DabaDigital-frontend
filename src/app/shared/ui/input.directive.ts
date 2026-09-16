import { Directive, ElementRef, Renderer2, effect, inject, input } from '@angular/core';

import { FORM_FIELD } from './form-field.component';

/**
 * Shared text field styling on the native control. Keeping the input/textarea
 * preserves labels, autocomplete, focus, and Angular's built-in form accessors
 * (including updateOn: 'blur') without a second copy of the field value.
 *
 * Inside `app-form-field` the control takes the field's id, describedby, invalid
 * and required state. Outside one, those attributes stay whatever the template
 * sets — nothing here writes them, so the two never fight.
 */
@Directive({
  selector: 'input[appInput], textarea[appInput]',
  host: { class: 'field-input', '[attr.data-size]': 'size()' },
})
export class InputDirective {
  readonly size = input<'md' | 'sm'>('md');

  constructor() {
    const field = inject(FORM_FIELD, { optional: true });
    if (!field) {
      return;
    }
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const renderer = inject(Renderer2);
    const set = (name: string, value: string | null): void => {
      if (value === null) {
        renderer.removeAttribute(element, name);
      } else {
        renderer.setAttribute(element, name, value);
      }
    };
    effect(() => {
      set('id', field.controlId());
      set('aria-describedby', field.describedBy());
      set('aria-invalid', String(field.invalid()));
      set('aria-required', field.required() ? 'true' : null);
    });
  }
}

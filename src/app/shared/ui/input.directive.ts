import { Directive } from '@angular/core';

/**
 * Shared text field styling on the native control. Keeping the input/textarea
 * preserves labels, autocomplete, focus, and Angular's built-in form accessors
 * (including updateOn: 'blur') without a second copy of the field value.
 */
@Directive({
  selector: 'input[appInput], textarea[appInput]',
  host: { class: 'field-input' },
})
export class InputDirective {}

import { Directive } from '@angular/core';

/**
 * A themed dropdown with native keyboard navigation and mobile option picker.
 * Use normal option/optgroup children and formControl, formControlName or ngModel.
 * The browser also owns disabled, required, multiple, and option selection.
 */
@Directive({
  selector: 'select[appDropdown]',
  host: { class: 'field-input dropdown-input' },
})
export class DropdownDirective {}

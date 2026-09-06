# Shared controls

Import the controls a standalone component uses from `shared/ui` (or from their individual files).
All colors, borders, focus rings and states use the global semantic tokens, so they follow the
existing theme switch and system preference. Layout uses logical properties for Arabic/RTL.

```ts
import {
  ButtonComponent,
  DropdownListComponent,
  DropdownDirective,
  InputDirective,
  SearchInputComponent,
  SelectButtonsComponent,
} from './shared/ui'; // Adjust the relative path for your component.
```

Add these to your component's `imports`, together with `ReactiveFormsModule` when using form bindings.

```html
<button appButton type="submit" [loading]="saving()">Save</button>
<button appButton="secondary" [disabled]="unavailable()">Cancel</button>
<a appButton="ghost" routerLink="/">Home</a>

<label for="name">Name</label>
<input appInput id="name" autocomplete="name" [formControl]="name" />

<label for="notes">Notes</label>
<textarea appInput id="notes" [formControl]="notes"></textarea>

<label for="category">Category</label>
<select appDropdown id="category" [formControl]="category">
  <option value="web">Web</option>
  <option value="mobile">Mobile</option>
</select>

<app-dropdown-list
  inputId="project-type"
  [options]="projectTypeOptions()"
  placeholder="Choose a type"
  [formControl]="projectType"
/>

<app-select-buttons
  [label]="t('projects.filterLabel')"
  [options]="options()"
  [(value)]="selected"
/>
<app-search-input
  [label]="t('projects.searchLabel')"
  [placeholder]="t('projects.searchPlaceholder')"
  [clearLabel]="t('projects.clearSearch')"
  [(value)]="query"
/>
```

- **Button:** `appButton` is `primary` (default), `secondary`, or `ghost`; `size` is `md`
  (default), `sm`, or `icon`. `loading` shows a spinner, retains label space and prevents activation.
  `disabled` also blocks activation, including links. Buttons default to `type="button"`; specify
  `type="submit"` for forms. Give icon-only buttons an `aria-label`. Keep the projected content stable
  while loading; use `aria-label` for a translated progress label.
- **Input:** use `appInput` on native `input` or `textarea`. Native attributes and Angular form
  bindings work directly. Associate an external label with `id`, and use `aria-invalid` and
  `aria-describedby` for validation messages. The contact form demonstrates validation on blur.
- **Dropdown:** use `appDropdown` on native `select` with normal `option`/`optgroup` children.
  It retains keyboard navigation, mobile pickers, native validation and Angular form bindings.
- **Dropdown list:** use `app-dropdown-list` when the open menu must follow the app design. Supply
  `{ value, label, disabled? }` options and a translated placeholder. It supports Reactive Forms,
  signals, mouse/touch, arrow keys, Home/End, Enter/Space, Escape, Tab and type-ahead selection.
- **Select buttons:** provide a translated `label` and options shaped as
  `{ value: string, label: string, disabled?: boolean }`. Native radios support keyboard navigation.
  Optional `name` defaults to a unique group name. Use `disabled` for the whole group.
- **Search:** provide a translated `label` and `clearLabel`; `placeholder`, `inputId`, `name` and
  `disabled` are optional. Clearing returns focus to the search field.

Search and select buttons support either `[(value)]` with a string/signal or Angular
`formControl`, `formControlName` and `ngModel` through `ControlValueAccessor`. Choose one binding
style per instance. Native input/dropdown attributes need no custom value accessor.

The landing page uses these controls in its header and calls to action, project filters/search,
and contact form. Form submission remains owned by the page; shared controls perform no requests.

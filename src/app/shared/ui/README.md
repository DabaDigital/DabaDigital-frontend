# Shared controls

Every form control, button and dialog in the app comes from here — the public site and the admin
workspace alike. Import what a standalone component uses from `shared/ui` (or the individual files)
and add it to the component's `imports`, together with `ReactiveFormsModule` for form bindings.

All colours, borders, focus rings and states read the semantic tokens, so the controls follow the
theme switch and the system preference. Layout uses logical properties, arrow keys follow the
reading direction, and every string a control shows itself lives in `core/i18n/messages/controls.ts`.
Controls never make requests: an upload is a function you pass in from a `core/api` service.

| Control | Use it for | Value |
| --- | --- | --- |
| `appButton` on `button` / `a` | every button and button-styled link | — |
| `app-form-field` | label, required marker, hint and error around one control | — |
| `appInput` on `input` / `textarea` | text, email, URL, password, long text | native |
| `app-dropdown-list` | choosing one option from a styled list (with optional icons) | `string` |
| `appDropdown` on `select` | a plain native select, where the OS picker is preferable | native |
| `app-select-buttons` | one choice among a few visible options — filters, tabs | `string` |
| `app-checkbox` | one yes/no option | `boolean` |
| `app-multi-select` | several choices from a dropdown list, shown as chips | `string[]` |
| `app-checkbox-group` | several choices, all visible at once | `string[]` |
| `app-number-input` | whole numbers with −/+ steps and bounds | `number \| null` |
| `app-date-picker` | a date, a month or a year | ISO `string` |
| `app-image-upload` | an image file, uploaded | URL `string` |
| `app-search-input` | a search box with a clear button | `string` |
| `app-dialog` | a modal dialog or a destructive confirmation | — |

Every value control supports `formControl`, `formControlName` and `ngModel`, or `[(value)]` with a
signal (`[(checked)]` for the checkbox). Choose one binding style per instance.

## Buttons

```html
<button appButton type="submit" [loading]="saving()">Save</button>
<button appButton="secondary" size="sm" [disabled]="unavailable()">Cancel</button>
<a appButton="ghost" routerLink="/">Home</a>
<button appButton="danger-ghost" size="icon" [attr.aria-label]="t('admin.delete')">…</button>
```

Variants are `primary` (default), `secondary`, `ghost`, `danger` and `danger-ghost` (quiet until
hovered — for row actions); sizes are `md` (default), `sm` and `icon`. `loading` shows a spinner,
keeps the label's space and blocks activation; `disabled` blocks links too. Buttons default to
`type="button"`. Icon-only buttons need an `aria-label`; while loading, pass a translated progress
label the same way.

## Fields

Wrap a single control in `app-form-field`. The field owns the id, so the label's `for`, the control's
`id`, `aria-describedby`, `aria-invalid` and `aria-required` are wired for you — do not set them on
the control. Give a stable `fieldId` when something outside must find the control (a focus-on-error
helper, an e2e test).

```html
<app-form-field fieldId="contact-email" required [label]="t('contact.email.label')"
  [error]="fieldError('email')">
  <input appInput type="email" formControlName="email" autocomplete="email" dir="ltr" />
</app-form-field>

<app-form-field [label]="t('contact.budget.label')" [optionalLabel]="t('contact.optional')"
  [hint]="t('contact.budget.hint')">
  <app-dropdown-list formControlName="budget" [options]="budgetOptions()" />
</app-form-field>
```

`error` is a translated message, or `''` while the field is valid; it replaces the hint rather than
stacking under it. The asterisk is `aria-hidden` — `aria-required` announces it. Outside a form field,
`appInput`, `app-dropdown-list`, `app-number-input` and `app-date-picker` accept `inputId`,
`describedBy`, `invalid` and `required` directly.

## Choosing

```html
<app-dropdown-list formControlName="icon" [placeholder]="t('…')"
  [options]="[{ value: 'cloud', label: t('admin.icons.cloud'), icon: 'cloud' }]" />

<app-select-buttons variant="tabs" [label]="t('admin.filterLabel')"
  [options]="[{ value: 'all', label: t('admin.all'), count: total() }]" [(value)]="filter" />

<app-form-field [label]="t('admin.categories')">
  <app-multi-select formControlName="categories" [options]="categoryOptions()"
    [placeholder]="t('admin.chooseCategories')" [emptyLabel]="t('admin.noCategories')" />
</app-form-field>

<app-checkbox-group formControlName="features" [label]="t('…')" [options]="featureOptions()" />

<app-checkbox formControlName="newsletter">{{ t('…') }}</app-checkbox>
```

- **Dropdown list** — a select-only combobox: mouse, touch, arrows, Home/End, Enter/Space, Escape,
  Tab and type-ahead. Its list floats in the top layer (see *Popups*), so it is never clipped.
- **Multi-select** — the same list with a checkbox per option; the picks show as chips in the
  trigger. The list stays open while options are toggled by click, Enter or Space, and closes on
  Escape, Tab or a click outside. The value follows the list's order. `emptyLabel` explains an
  empty list.
- **Select buttons** — native radios, so arrow keys move the choice. `pill` (default) suits the
  marketing pages, `tabs` the dense admin toolbars. `count` adds a tally after a label.
- **Checkboxes** — the native input sits, transparent, over the drawn box, so labels, keyboard and
  clicks behave natively. The group's value lists the checked options in the order they were checked.

## Numbers and dates

```html
<app-number-input formControlName="position" [min]="0" [max]="9999" />

<app-date-picker formControlName="deadline" min="2026-01-01" [placeholder]="t('…')" />
<app-date-picker formControlName="month" precision="month" />
<app-date-picker formControlName="year" precision="year" min="1990" max="2027" />
```

- **Number input** — a native `type="number"` field, so arrow keys, mobile keypads and the
  `spinbutton` role come from the browser; the −/+ buttons are pointer shortcuts and stay out of the
  tab order. Values clamp to `min`/`max` on step and on blur; an emptied field is `null`.
- **Date picker** — the value is `YYYY-MM-DD`, `YYYY-MM` or `YYYY` by `precision`, `''` when empty.
  `min`/`max` take any of those forms (a partial `max` reaches the end of its period). Month and
  weekday names come from `Intl` in the app locale and the week starts on the locale's first day
  (`firstDayOfWeek` overrides it). In the grid: arrows move, Home/End jump to the row's ends,
  PageUp/PageDown change the page (Shift: the year), Enter picks, Escape closes. The header opens the
  year view; picking a year narrows to months, then days. "Clear" appears when the field is optional.

## Images

```html
<app-image-upload formControlName="image_url" [label]="t('admin.image')"
  [upload]="uploadImage" (uploadingChange)="uploading.set($event)" />
```

```ts
protected readonly uploadImage: ImageUploader = (file) => this.api.uploadProjectImage(file);
```

Drop a file or click to browse. The type (`accept`, PNG/JPEG/WebP/AVIF/GIF by default) and size
(`maxSizeMb`, 5 by default) are checked first, a local preview appears at once, and the file goes to
`upload`, which resolves to the stored URL. On failure the previous image stays and the error is
announced. Hold the form's submit while `uploadingChange` reports `true`, or the old URL is saved.
There is deliberately no URL field: an image is always a file stored through `upload`.

## Dialogs

```html
@if (deleting(); as item) {
  <app-dialog alert size="sm" icon="trash" tone="danger" [heading]="t('admin.deleteTitle')"
    [dismissible]="!busy()" (dismissed)="deleting.set(null)">
    <p>{{ item.name }}</p>
    <button appDialogActions appButton="secondary" (click)="deleting.set(null)">…</button>
    <button appDialogActions appButton="danger" [loading]="busy()" (click)="remove()">…</button>
  </app-dialog>
}
```

A dialog is open while it is rendered: put it behind an `@if` and clear the condition on
`(dismissed)`. It uses native `showModal()`, so focus containment, the inert page and Escape come
from the browser, and focus returns to the opener when it goes. Elements marked `appDialogActions`
land in the footer; a form in the body submits from a footer button with `form="<form id>"`.
`[dismissible]="false"` disables Escape and the close button while work is in flight. `alert`
switches the role to `alertdialog` for destructive confirmations.

## Popups

The dropdown list and the date picker place their popup with `appAnchoredPanel`. Where the Popover
API exists the panel is promoted to the top layer — no ancestor's `overflow`, `transform` or stacking
context can clip it, which matters inside a dialog's scrolling body — and positioned under its
trigger, flipping above when there is more room there and following scroll and resize. Elsewhere
(older browsers, jsdom) the `.anchored-panel` rules in `styles/controls.scss` place it absolutely
under the trigger. A component's own styles must not set `position` or `inset` on a panel.

Form submission stays with the page; shared controls perform no requests.

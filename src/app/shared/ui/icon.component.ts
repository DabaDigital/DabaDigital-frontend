import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The app's icon set — one family, one stroke weight, one grid.
 *
 * Inline SVG paths rather than an icon font or a package: the set is small, the
 * glyphs ship in the component bundle instead of a blocking font request, and
 * every one of them inherits `currentColor` so a theme change needs no work here.
 * Emoji are never used as icons — they are font-dependent and cannot be themed.
 *
 * All paths are drawn on a 24×24 grid with a 1.75 stroke, so mixing any two of
 * them in the same row stays visually even. Keep new glyphs on that grid.
 *
 * Icons are decorative by default (`aria-hidden`). An icon that carries meaning
 * on its own must be given a `label`, which turns it into an `img` role with an
 * accessible name — but prefer adjacent text.
 *
 * `arrow-right` and `arrow-up-right` point inline-end and must be flipped for
 * RTL by the caller: `class="rtl:rotate-180"` / `class="rtl:-scale-x-100"`.
 */
@Component({
  selector: 'app-icon',
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      class="h-full w-full"
      [attr.aria-hidden]="label() ? null : true"
      [attr.role]="label() ? 'img' : null"
      [attr.aria-label]="label()"
      focusable="false"
    >
      @switch (name()) {
        @case ('dashboard') {
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        }
        @case ('folder') {
          <path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
          <path d="M3 10h18" />
        }
        @case ('layers') {
          <path d="m12 3 10 5-10 5L2 8Z" />
          <path d="m2 12 10 5 10-5M2 16l10 5 10-5" />
        }
        @case ('plus') {
          <path d="M12 5v14M5 12h14" />
        }
        @case ('edit') {
          <path d="m16 3 5 5-12 12-6 1 1-6Z" />
          <path d="m13 6 5 5" />
        }
        @case ('trash') {
          <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />
        }
        @case ('search') {
          <circle cx="10.5" cy="10.5" r="7" />
          <path d="m16 16 5 5" />
        }
        @case ('logout') {
          <path d="M9 4H4v16h5M12 12h9m-4-4 4 4-4 4" />
        }
        @case ('calendar') {
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 11h18" />
        }
        @case ('refresh') {
          <path d="M21 3v6h-6M3 21v-6h6M20 9a8 8 0 0 0-14-4L3 8M4 15a8 8 0 0 0 14 4l3-3" />
        }
        <!-- ── Services ──────────────────────────────────────────────────── -->
        @case ('code') {
          <path d="m16 18 6-6-6-6" />
          <path d="m8 6-6 6 6 6" />
        }
        @case ('bag') {
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        }
        @case ('sparkles') {
          <path
            d="M11.5 3.2a.5.5 0 0 1 .95 0l1.3 3.9a2 2 0 0 0 1.26 1.26l3.9 1.3a.5.5 0 0 1 0 .95l-3.9 1.3a2 2 0 0 0-1.26 1.26l-1.3 3.9a.5.5 0 0 1-.95 0l-1.3-3.9a2 2 0 0 0-1.26-1.26l-3.9-1.3a.5.5 0 0 1 0-.95l3.9-1.3A2 2 0 0 0 10.2 7.1Z"
          />
          <path d="M19 15v3.5" />
          <path d="M20.75 16.75h-3.5" />
          <path d="M5 3v3" />
          <path d="M6.5 4.5h-3" />
        }
        @case ('mobile') {
          <rect x="6" y="2" width="12" height="20" rx="2.5" />
          <path d="M11 18.5h2" />
        }
        @case ('palette') {
          <path
            d="M12 21a9 9 0 1 1 9-9c0 1.66-1.34 3-3 3h-1.4a1.9 1.9 0 0 0-1.35 3.25A1.9 1.9 0 0 1 13.9 21Z"
          />
          <path d="M7.5 12h.01" />
          <path d="M9.5 8.2h.01" />
          <path d="M14 7.5h.01" />
          <path d="M17 10.5h.01" />
        }
        @case ('cloud') {
          <path d="M17.5 19a4.5 4.5 0 0 0 .5-8.97A6 6 0 0 0 6.3 9.5 4 4 0 0 0 7 19Z" />
        }

        <!-- ── About pillars ─────────────────────────────────────────────── -->
        @case ('gauge') {
          <path d="M4.5 18a9 9 0 1 1 15 0" />
          <path d="m12 15 4-5" />
          <path d="M12 15h.01" />
        }
        @case ('languages') {
          <path d="M2.5 5.5h10" />
          <path d="M7.5 3v2.5" />
          <path d="M10.5 5.5a11 11 0 0 1-6 8.5" />
          <path d="M6 9.5a9 9 0 0 0 5 4" />
          <path d="m22 21-4.5-9L13 21" />
          <path d="M14.7 17.5h5.6" />
        }
        @case ('shield') {
          <path d="M12 3 4.5 6v5.6c0 4.3 3 7.8 7.5 9.4 4.5-1.6 7.5-5.1 7.5-9.4V6Z" />
          <path d="m9.2 12.2 2 2 3.6-3.9" />
        }

        <!-- ── Theme & language ──────────────────────────────────────────── -->
        @case ('sun') {
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2.5" />
          <path d="M12 19.5V22" />
          <path d="M4.22 4.22l1.77 1.77" />
          <path d="m18.01 18.01 1.77 1.77" />
          <path d="M2 12h2.5" />
          <path d="M19.5 12H22" />
          <path d="m4.22 19.78 1.77-1.77" />
          <path d="m18.01 5.99 1.77-1.77" />
        }
        @case ('moon') {
          <path d="M12 3a6.4 6.4 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        }
        @case ('globe') {
          <circle cx="12" cy="12" r="9" />
          <path d="M3.2 9.5h17.6" />
          <path d="M3.2 14.5h17.6" />
          <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
        }

        <!-- ── Controls ──────────────────────────────────────────────────── -->
        @case ('check') {
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        }
        @case ('chevron-down') {
          <path d="m6 9.5 6 6 6-6" />
        }
        @case ('chevron-left') {
          <path d="m14.5 6-6 6 6 6" />
        }
        @case ('chevron-right') {
          <path d="m9.5 6 6 6-6 6" />
        }
        @case ('minus') {
          <path d="M5 12h14" />
        }
        @case ('upload') {
          <path d="M12 15V3.5" />
          <path d="m7 8.5 5-5 5 5" />
          <path d="M20 15v3.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V15" />
        }
        @case ('image') {
          <rect x="3" y="3" width="18" height="18" rx="2.5" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15.5-4.6-4.6a1.5 1.5 0 0 0-2.1 0L5.5 20.5" />
        }
        @case ('menu') {
          <path d="M3.5 7h17" />
          <path d="M3.5 12h17" />
          <path d="M3.5 17h17" />
        }
        @case ('close') {
          <path d="m6 6 12 12" />
          <path d="M18 6 6 18" />
        }
        @case ('arrow-right') {
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        }
        @case ('arrow-up-right') {
          <path d="M7 17 17 7" />
          <path d="M8.5 7H17v8.5" />
        }
        @case ('arrow-up') {
          <path d="M12 19.5V5" />
          <path d="m5.5 11.5 6.5-6.5 6.5 6.5" />
        }
        @case ('send') {
          <path d="M21.5 2.5 11 13" />
          <path d="M21.5 2.5 15 21.5l-3.9-8.6-8.6-3.9Z" />
        }

        <!-- ── Contact & status ──────────────────────────────────────────── -->
        @case ('mail') {
          <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
          <path d="m3.5 7 7.4 4.9a2 2 0 0 0 2.2 0L20.5 7" />
        }
        @case ('phone') {
          <path
            d="M15.5 21A12.5 12.5 0 0 1 3 8.5V6a2 2 0 0 1 2-2h2.2a1 1 0 0 1 .97.76l.83 3.3a1 1 0 0 1-.5 1.13l-1.6.86a11 11 0 0 0 5.05 5.05l.86-1.6a1 1 0 0 1 1.13-.5l3.3.83a1 1 0 0 1 .76.97V19a2 2 0 0 1-2 2Z"
          />
        }
        @case ('map-pin') {
          <path d="M12 21.5s7-5.9 7-11.5a7 7 0 1 0-14 0c0 5.6 7 11.5 7 11.5Z" />
          <circle cx="12" cy="10" r="2.5" />
        }
        @case ('clock') {
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5.3l3.2 1.9" />
        }
        @case ('alert') {
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7.5v5" />
          <path d="M12 16.3h.01" />
        }
        @case ('check-circle') {
          <path d="M21 11.2V12a9 9 0 1 1-5.34-8.22" />
          <path d="m8.5 11.5 3 3 9.5-9.7" />
        }

        <!-- ── Voice assistant ───────────────────────────────────────────── -->
        @case ('mic') {
          <rect x="9" y="2.5" width="6" height="11" rx="3" />
          <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
          <path d="M12 17.5V21" />
          <path d="M8.5 21h7" />
        }
        @case ('stop') {
          <rect x="7" y="7" width="10" height="10" rx="2" />
        }
        @case ('undo') {
          <path d="M7 7 3 11l4 4" />
          <path d="M3 11h11a6 6 0 0 1 0 12h-2" />
        }

        <!-- ── Social ────────────────────────────────────────────────────── -->
        @case ('linkedin') {
          <path
            d="M16 8.5a5.5 5.5 0 0 1 5.5 5.5v6.5h-3.8V14a1.7 1.7 0 0 0-3.4 0v6.5H10.5V8.9h3.8v1.4"
          />
          <rect x="2.5" y="8.9" width="3.8" height="11.6" rx="1" />
          <circle cx="4.4" cy="4.4" r="2" />
        }
        @case ('instagram') {
          <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
          <circle cx="12" cy="12" r="4" />
          <path d="M17.4 6.6h.01" />
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-block;
      flex: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  readonly name = input.required<IconName>();

  /** Set only when no adjacent text already names the icon. */
  readonly label = input<string | null>(null);
}

export type IconName =
  | 'dashboard'
  | 'folder'
  | 'layers'
  | 'plus'
  | 'edit'
  | 'trash'
  | 'search'
  | 'logout'
  | 'calendar'
  | 'refresh'

  // services
  | 'code'
  | 'bag'
  | 'sparkles'
  | 'mobile'
  | 'palette'
  | 'cloud'
  // about pillars
  | 'gauge'
  | 'languages'
  | 'shield'
  // theme & language
  | 'sun'
  | 'moon'
  | 'globe'
  // controls
  | 'check'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'minus'
  | 'upload'
  | 'image'
  | 'menu'
  | 'close'
  | 'arrow-right'
  | 'arrow-up-right'
  | 'arrow-up'
  | 'send'
  // contact & status
  | 'mail'
  | 'phone'
  | 'map-pin'
  | 'clock'
  | 'alert'
  | 'check-circle'
  // voice assistant
  | 'mic'
  | 'stop'
  | 'undo'
  // social
  | 'linkedin'
  | 'instagram';

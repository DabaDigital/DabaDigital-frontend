import { DOCUMENT } from '@angular/common';
import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

/** Space between the panel and its anchor, and between the panel and the viewport edge. */
const GAP = 6;
const EDGE = 8;

/**
 * Floats a popup (listbox, calendar) beside the control that opened it.
 *
 * Where the Popover API exists the panel is promoted to the top layer, so no
 * ancestor's `overflow`, `transform` or stacking context can clip it — which is
 * what the admin editor needs, since its modal `<dialog>` body scrolls. It is then
 * placed with fixed coordinates under the anchor, flipped above when the space
 * below is shorter, and kept in step on scroll and resize. Without the API (older
 * browsers, jsdom) the `.anchored-panel` rules in `styles/controls.scss` place it
 * absolutely under the anchor instead.
 *
 * Render the panel only while open (`@if`); the directive shows it on creation.
 */
@Directive({
  selector: '[appAnchoredPanel]',
  host: {
    class: 'anchored-panel',
    popover: 'manual',
    '[attr.data-width]': 'panelWidth()',
  },
})
export class AnchoredPanelDirective {
  readonly anchor = input.required<HTMLElement>({ alias: 'appAnchoredPanel' });
  /** `stretch` matches the anchor's width (listboxes); `content` keeps the panel's own. */
  readonly panelWidth = input<'stretch' | 'content'>('stretch');

  private readonly panel = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);

  constructor() {
    const destroyRef = inject(DestroyRef);
    // The `write` phase runs before every default after-render hook, so the panel
    // is already shown — not still `display: none` — when its owner measures it
    // or moves focus into it.
    afterNextRender({
      write: () => {
        const view = this.document.defaultView;
        if (!view || typeof this.panel.showPopover !== 'function') {
          return;
        }
        this.panel.showPopover();
        this.place();
        const place = (): void => this.place();
        view.addEventListener('scroll', place, { capture: true, passive: true });
        view.addEventListener('resize', place, { passive: true });
        // The anchor can grow while the panel is open — a multi-select's chips wrap.
        const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(place) : null;
        resize?.observe(this.anchor());
        destroyRef.onDestroy(() => {
          view.removeEventListener('scroll', place, { capture: true });
          view.removeEventListener('resize', place);
          resize?.disconnect();
        });
      },
    });
  }

  private place(): void {
    const view = this.document.defaultView;
    if (!view || !this.panel.isConnected) {
      return;
    }
    const anchorElement = this.anchor();
    const anchor = anchorElement.getBoundingClientRect();
    const style = this.panel.style;
    if (this.panelWidth() === 'stretch') {
      style.width = `${anchor.width}px`;
    }
    // Measure at the stylesheet's own max height before deciding where it fits.
    style.maxHeight = '';
    const panel = this.panel.getBoundingClientRect();
    const below = view.innerHeight - anchor.bottom - GAP - EDGE;
    const above = anchor.top - GAP - EDGE;
    const openAbove = panel.height > below && above > below;
    const space = Math.max(openAbove ? above : below, 0);
    if (panel.height > space) {
      style.maxHeight = `${space}px`;
    }
    const height = Math.min(panel.height, space);
    // Inline-start alignment: the panel's right edge meets the anchor's in RTL.
    const rtl = view.getComputedStyle(anchorElement).direction === 'rtl';
    const left = rtl ? anchor.right - panel.width : anchor.left;
    const maxLeft = Math.max(this.document.documentElement.clientWidth - panel.width - EDGE, EDGE);
    style.top = `${openAbove ? anchor.top - GAP - height : anchor.bottom + GAP}px`;
    style.left = `${Math.min(Math.max(left, EDGE), maxLeft)}px`;
  }
}

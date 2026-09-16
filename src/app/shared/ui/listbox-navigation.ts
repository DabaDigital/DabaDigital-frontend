/** Keyboard and scrolling helpers shared by the listbox popups (dropdown list, multi-select). */

export interface ListboxItem {
  readonly label: string;
  readonly disabled?: boolean;
}

/** The next enabled index after `from` in `direction`, wrapping; `from` when none is enabled. */
export function nextEnabledIndex(
  items: readonly ListboxItem[],
  from: number,
  direction: 1 | -1,
): number {
  for (let offset = 1; offset <= items.length; offset++) {
    const index = (from + direction * offset + 2 * items.length) % items.length;
    if (!items[index]?.disabled) {
      return index;
    }
  }
  return from;
}

/** The first (`1`) or last (`-1`) enabled index, or -1 when every item is disabled. */
export function boundaryEnabledIndex(items: readonly ListboxItem[], direction: 1 | -1): number {
  let index = direction === 1 ? 0 : items.length - 1;
  while (index >= 0 && index < items.length) {
    if (!items[index]?.disabled) {
      return index;
    }
    index += direction;
  }
  return -1;
}

/** Type-ahead: the next enabled item after `from` whose label starts with `character`, or -1. */
export function indexByPrefix(
  items: readonly ListboxItem[],
  from: number,
  character: string,
): number {
  const collator = new Intl.Collator(undefined, { sensitivity: 'base', usage: 'search' });
  const start = Math.max(from + 1, 0);
  for (let offset = 0; offset < items.length; offset++) {
    const index = (start + offset) % items.length;
    const item = items[index];
    if (item && !item.disabled && collator.compare(item.label.slice(0, 1), character) === 0) {
      return index;
    }
  }
  return -1;
}

/**
 * Keyboard navigation moves `aria-activedescendant`, not focus, so the list has to be
 * scrolled by hand to keep the active option in sight. Only the list scrolls —
 * `scrollIntoView` would also scroll the page or an enclosing dialog.
 */
export function keepOptionInView(list: HTMLElement, option: HTMLElement): void {
  const top = option.offsetTop;
  const bottom = top + option.offsetHeight;
  if (top < list.scrollTop) {
    list.scrollTop = top;
  } else if (bottom > list.scrollTop + list.clientHeight) {
    list.scrollTop = bottom - list.clientHeight;
  }
}

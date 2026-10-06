import { afterEach, describe, expect, it } from 'vitest';

import { belowTheFold } from './motion';

/** An element whose top edge sits `top` pixels from the top of the viewport. */
function at(top: number): HTMLElement {
  const element = document.createElement('div');
  element.getBoundingClientRect = () => ({ top }) as DOMRect;
  document.body.append(element);
  return element;
}

describe('belowTheFold', () => {
  afterEach(() => document.body.replaceChildren());

  it('is true only for what the visitor has not seen yet', () => {
    expect(belowTheFold(at(window.innerHeight + 1))).toBe(true);
    expect(belowTheFold(at(window.innerHeight))).toBe(true);
  });

  /**
   * A prerendered page has been painted, in full, for a second or more when motion starts;
   * hiding what is on screen to animate it in would flash the text the visitor is reading.
   */
  it('is false for what is on screen, or already scrolled past', () => {
    expect(belowTheFold(at(window.innerHeight - 1))).toBe(false);
    expect(belowTheFold(at(0))).toBe(false);
    expect(belowTheFold(at(-500))).toBe(false);
  });
});

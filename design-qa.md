# Dropdown list design QA

- Source visual truth: user-provided screenshot in the current conversation (345 × 285 px).
- Implementation target: `app-dropdown-list` open Project type state on the home-page contact form.
- Intended comparison viewport: focused crop at the rendered control's natural desktop size, device
  scale factor 1.
- State: light theme, Project type menu open, “Something else” selected.

## Full-view comparison evidence

The source screenshot is available. A browser-rendered implementation capture is currently unavailable:
the in-app Browser and Chrome surfaces both report that no browser is available. Build output and browser
tests cannot substitute for the required visual evidence.

## Focused region comparison evidence

Blocked for the same reason. The required focused open-dropdown capture could not be produced through an
available visual browser surface.

## Findings

- No visual fidelity finding can be closed without a rendered open-state capture.
- Code inspection confirms the intended structure is present: bordered trigger, chevron, anchored option
  panel, full-width active and selected rows, checkmark, semantic theme tokens, and logical RTL layout.

## Interaction verification

- Production build: passed.
- Unit suite: 16 passed, including dropdown CVA, open state, keyboard navigation, selection, focus return,
  programmatic updates, and disabled state.
- Playwright application suite: 7 passed, including contact submission, custom dropdown selection, dark and
  light themes, and Arabic mobile keyboard behavior.
- Console errors: not checked in an interactive browser because no browser surface is available.

## Comparison history

- Initial implementation replaced the native select popup with the reusable custom listbox.
- Visual comparison remains pending; no P0/P1/P2 visual fixes can be classified until capture is available.

## Implementation checklist

- Capture the Project type menu in the same open/selected state as the source.
- Compare typography, row height, panel alignment, border, highlight color, chevron, and spacing.
- Check the equivalent dark-theme and Arabic states.
- Resolve any P0/P1/P2 differences and recapture.

final result: blocked

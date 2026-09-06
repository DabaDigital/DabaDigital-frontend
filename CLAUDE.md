# CLAUDE.md — DabaDigital Frontend

Angular app for the DabaDigital portfolio + AI Voice Project Assistant. Read `README.md` first: it holds
the routes, the form state model, the merge rules and the error states. This file holds the rules that
are easy to break and hard to notice.

Sibling repo: `../DabaDigital-backend` (Rails API + MongoDB). The two share a contract — see
[Cross-repo](#cross-repo).

## State of the repo

The Angular 20 workspace exists: routing, the site shell, the design tokens, i18n extraction, ESLint,
Prettier, Vitest and Playwright are wired and green. The content pages and the whole voice stack are
scaffolds — `core/api/`, `core/audio/` and `core/voice/` are empty, and every unbuilt section renders an
`<app-scaffold-note>`. Grep for `app-scaffold-note` to find what is left; it must not survive to
production.

Two notes on the layout, which differ slightly from `README.md` § Project structure: the style layer
lives at `src/styles/` (a sibling of `src/app/`, per Angular convention), and Tailwind has its own entry
there — `tailwind.css` maps the tokens onto Tailwind's namespaces with `@theme inline`.

**Global CSS must live in a cascade layer.** Tailwind v4 emits utilities into `@layer utilities`, and an
*unlayered* rule outranks every layered one whatever its specificity — an unlayered `a { color: inherit }`
silently defeats `class="text-primary"` on every link in the app. Base rules go in `@layer base`, shared
classes in `@layer components`.

## Commands

```bash
npm install
npm start           # ng serve → http://localhost:4200 (backend must be on :3000)
npm run build       # production build → dist/
npm test            # unit tests (Vitest)
npm run e2e         # Playwright — needs `npx playwright install chromium` once
npm run lint        # ESLint
npm run format      # Prettier
npm run i18n:extract # regenerate src/locale/messages.xlf
```

The microphone requires a **secure context**. `localhost` works; any other dev host must be HTTPS or
`getUserMedia` silently never resolves and the voice panel disables itself.

## Invariants

These are product requirements, not preferences. Do not relax one to make something work — if a change
seems to require it, stop and say so.

1. **Nothing auto-submits.** The assistant fills fields; only a click on *Send Project Request* posts.
   No auto-submit on "final chunk", no submit-on-silence, no submit-on-confidence.
2. **Manual input wins, permanently.** Once a field's `source` is `'manual'`, no incoming operation may
   overwrite it. The value arrives as a dismissible suggestion chip instead.
3. **Below `minConfidence`, never auto-fill.** Render a suggestion the user accepts or dismisses.
4. **Operations touch only their own field.** Applying a budget correction must leave the other four
   fields byte-identical. This is the single most important test in the repo.
5. **Voice degrades, it never blocks.** Denied permission, missing `MediaRecorder`, insecure context, a
   `503` from `/voice/*` — each collapses the voice panel with a message and leaves the manual form fully
   functional. Never gate the submit button on voice state.
6. **The privacy notice precedes the first recording** and its acknowledgement is sent as
   `X-Voice-Consent: granted` on every `/voice/*` call. Do not record before it is acknowledged.
7. **The transcript is display-only.** It is not persisted and not sent with the submission.

## Architecture rules

**`core/voice/field-merge.ts` is pure.** `(state, operations, lockedFields) => nextState`. No HTTP, no
signals, no `Date.now()`, no DOM. Every rule in `README.md` § Merge rules is a unit test against it.
Anything impure belongs in `voice-session.service.ts`.

**Components never call `HttpClient`.** All network access goes through `core/api/*.api.ts`, which own
the wire types and the mapping to app models. A component that imports `HttpClient` is a bug.

**One source of truth for recorder state.** `recorderState` is a single signal; button label, indicator,
disabled state and aria attributes are all `computed()` from it. Never track "is recording" in a second
boolean.

**Turns are sequential.** A pending `/voice/turns` request is awaited before the next chunk is sent, so
operations can never arrive out of order. A failed chunk is dropped and recording continues — losing 4
seconds is recoverable, killing the session is not.

**Release the microphone.** On stop, error, navigation and `ngOnDestroy`, call `stop()` on every
`MediaStreamTrack`. Forgetting this leaves the browser's recording indicator lit after the user thinks
they stopped, which reads as spyware.

## Conventions

- **Standalone components only**; no NgModules. `ChangeDetectionStrategy.OnPush` everywhere.
- **Signals for state**, RxJS only for genuine streams (recorder events, request cancellation). Do not
  wrap a signal in a `BehaviorSubject` or vice versa.
- `inject()` over constructor injection; `input()` / `output()` functions over the decorators.
- Built-in control flow (`@if`, `@for`, `@switch`) — not `*ngIf` / `*ngFor`. `@for` always gets a
  `track`.
- `strict: true` TypeScript. **No `any`**, no non-null `!` on API data — narrow it.
- Typed Reactive Forms. The form group is the input surface; `ProjectFormState` (with `source`,
  `confidence`, `evidence` per field) is the provenance layer beside it. Keep both in sync in one place.
- Styling through the tokens in `styles/tokens.scss` and Tailwind utilities. No hex codes in component
  styles, no magic pixel values outside the spacing scale.
- **No hardcoded user-facing strings** — everything through `@angular/localize`. French is the default
  locale; Arabic renders RTL, so never assume left-to-right in layout logic.

## Accessibility (non-negotiable)

- The mic button is a real `<button>` with `aria-pressed` and a label that changes with state — not an
  icon swap alone.
- Recorder state changes and applied operations are announced in an `aria-live="polite"` region
  ("Budget set to 20 000 dirhams"), so the form is usable without watching it.
- The ✨ AI badge is never color-only: accessible name + adjacent text hint.
- Full keyboard path from hero CTA to submit, visible focus rings, `prefers-reduced-motion` respected by
  the listening pulse and waveform.

## Testing

- `field-merge.ts` gets the heaviest coverage: one test per numbered merge rule, plus the **MVP
  scenario** — Next.js / 20 000 MAD / two months, then "change the budget to 25 000" leaving the other
  four fields untouched. If that test fails, the change is not done.
- Recorder transitions are tested against a mocked `MediaRecorder`; permission denial and missing-API
  paths are tested explicitly, not assumed.
- E2E runs with `--use-fake-device-for-media-stream` and a stubbed `/voice/turns` — never a real provider.
- Real-audio language checks (FR, EN, AR, mixed FR + Darija) are manual and part of the release
  checklist; they cannot be automated away.

## Cross-repo

Wire types in `core/models/` and the rules in `field-merge.ts` mirror the backend's serializers and
`Voice::MergeService`. Any change to the `/voice/*` or `/project_requests` shape, to the operation
vocabulary (`add` / `replace` / `remove` / `clear`), or to the field enums must land in both repos'
READMEs in the same change. Flag it explicitly rather than shipping one half.

## Definition of done

`npm test` and `npm run lint` green, the manual form still submits with `voice.enabled: false`, the
microphone indicator goes dark when recording stops, no new user-facing string outside the locale files,
and the MVP scenario test passing.

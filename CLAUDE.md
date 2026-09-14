# CLAUDE.md — DabaDigital Frontend

Angular app for the DabaDigital portfolio + AI Voice Project Assistant. Read `README.md` first: it holds
the routes, the form state model, the merge rules and the error states. This file holds the rules that
are easy to break and hard to notice.

Sibling repo: `../DabaDigital-backend` (Rails API + MongoDB). The two share a contract — see
[Cross-repo](#cross-repo).

## State of the repo

The Angular 20 workspace exists: routing, the site shell, the design tokens, i18n extraction, ESLint,
Prettier, Vitest and Playwright are wired and green. The other content pages (About, Services, Portfolio)
are still scaffolds rendering `<app-scaffold-note>` — grep for that to find what's left; it must not
survive to production.

**The voice mic is built, on the Home page's Contact form**
(`features/home/sections/contact.section.ts`/`.html`) — **not** a separate `/start` page. See root
`../Claude.md` § MVP scope. The six fields are: `fullName`, `email`, `companyName`, `projectType`,
`budget` (a *range* — s/m/l/xl/unknown, not a free amount), `description`. There is no dedicated
deadline or technologies input — extracted deadline/technologies detail is folded into the composed
`description` text. `README.md` § Routes / § The voice assistant still describe the original
`/start`-page / chunked-`MediaRecorder` sketch and haven't been rewritten yet — this file and the code
are the current source of truth; don't trust that README section literally until it's updated.

**Transcription is `gpt-live-transcribe` (OpenAI), not the browser's Web Speech API.** The browser
connects **directly to OpenAI over WebRTC** using a short-lived client secret fetched from
`POST /voice/realtime_session` on the backend — raw audio never touches the Rails API. This lives in
`core/voice/realtime-voice.service.ts` — there is no separate `core/audio/`; the mic-permission +
WebRTC-session + turn-loop responsibilities turned out to belong in one service, not two, once built
(see § Architecture rules below for why).

**Built and verified** (`npx tsc --noEmit`, `ng lint`, and the relevant Vitest specs all green —
re-run before trusting this list further than that, nothing has been checked against a real
`OPENAI_API_KEY` yet):
- `core/models/project-form.model.ts` (`ProjectFormState`, six fields, `FieldState<T>` provenance),
  `core/models/voice-operation.model.ts` (wire types + snake_case↔camelCase field maps),
  `core/models/voice-session.model.ts` (OpenAI Realtime API event shapes).
- `core/voice/field-merge.ts` — pure, one test per numbered rule + the MVP scenario in
  `field-merge.spec.ts` (this repo's mirror of the backend's `merge_service_spec.rb`).
- `core/voice/realtime-voice.service.ts` — the WebRTC session, transcript accumulation (tracked
  per-segment `item_id`, not naive delta+completed concatenation — see its own doc comment for why
  that matters), and the debounced `/voice/extract` turn loop.
- `core/api/voice.api.ts`, `core/api/contact.api.ts` (updated for the real backend wire contract:
  `budget: { range, raw }`, `field_sources`).
- `ContactSection` extended with the mic button, privacy notice, ✨ badges (`shared/ui/ai-badge.
  component.ts`), suggestion chips (`shared/ui/suggestion-chip.component.ts`), manual-edit
  detection wired through each control's own `valueChanges` (not a shared generic path — see the
  component's class doc for the `emitEvent: false` mechanism that keeps voice patches from being
  mistaken for manual ones).
- `mic`, `stop`, `undo` icons added to `shared/ui/icon.component.ts`.

**Not verified yet** — flag before assuming: the full WebRTC handshake against a real OpenAI session
(only support-detection and permission-denial are unit-tested — see `realtime-voice.service.spec.ts`'s
own doc comment on why the connected path isn't); real multilingual voice input (FR/EN/AR/mixed
Darija); the full keyboard path end-to-end by hand; Playwright e2e coverage for the voice flow (not
added — the existing `e2e/` specs predate this feature).

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
4. **Operations touch only their own field.** Applying a budget correction must leave the other five
   fields byte-identical. This is the single most important test in the repo.
5. **Voice degrades, it never blocks.** Denied permission, missing `RTCPeerConnection`, insecure context,
   a `503` from `/voice/*` — each collapses the voice panel with a message and leaves the manual form
   fully functional. Never gate the submit button on voice state.
6. **The privacy notice precedes the first recording** and its acknowledgement is sent as
   `X-Voice-Consent: granted` on every `/voice/*` call. Do not record before it is acknowledged.
7. **The transcript is display-only.** It is not persisted and not sent with the submission.

## Architecture rules

**`core/voice/field-merge.ts` is pure.** `(state, operations, now) => { fields, suggestions }`. No HTTP,
no signals, no `Date.now()` internally (the caller supplies `now`), no DOM. Every rule in `README.md`
§ Merge rules is a unit test against it (`field-merge.spec.ts`). Anything impure belongs in
`realtime-voice.service.ts`. There is no separate `lockedFields` parameter — a field is locked exactly
when `state[field].source === 'manual'`, checked directly against the state that's already passed in;
the backend's `Voice::MergeService` accepts an explicit `locked_fields` override too, but only so its
own unit tests can exercise rules without constructing full field state — the app never uses it.

**Never read and write the same signal inside one `effect()`.** Found the hard way: an effect that reads
`fields()` (to merge against) and also calls `fields.set()` registers `fields` as its own dependency, so
writing it reschedules the very effect that just ran — and since `field-merge.ts` always returns a fresh
object (even when the semantic content is unchanged), that reschedule fires *every* time, forever. A real
run of `contact.section.spec.ts` OOM'd the Node process this way before it was caught. Fix: wrap the
read-and-write body in `untracked()`, so the effect's only real dependency is whatever *triggered* the
update (`RealtimeVoiceService.lastResult`), not its own side effects on `fields`/`suggestions`/the form.
See `contact.section.ts`'s constructor for the fixed version and its comment.

**Components never call `HttpClient`.** All network access goes through `core/api/*.api.ts`, which own
the wire types and the mapping to app models. A component that imports `HttpClient` is a bug.

**One source of truth for recorder state.** `recorderState` is a single signal on `RealtimeVoiceService`
(`idle | requesting-permission | connecting | recording | processing | error | unsupported`); button
label, indicator and aria attributes are all derived from it in the component template. Never track "is
recording" in a second boolean.

**Turns are sequential.** `realtime-voice.service.ts` pipes transcript-changed events through RxJS
`debounceTime` + `concatMap` — `concatMap` awaits each `/voice/extract` call before subscribing to the
next, so operations can never arrive out of order, without a hand-rolled "is a request in flight" flag.
`runTurn` catches its own errors internally: a failed turn is dropped and recording continues rather than
killing the `concatMap` chain for the rest of the session — an uncaught rejection inside a `concatMap`
projector terminates the whole pipeline, not just that one turn.

**Release the microphone.** On stop, error and connection failure, `RealtimeVoiceService` calls `stop()`
on every `MediaStreamTrack` (`releaseMic()`). The consuming component must additionally call
`voice.stop()` on `ngOnDestroy`/navigation — `RealtimeVoiceService` is `providedIn: 'root'` and has no
lifecycle hook of its own to do this automatically. Forgetting either leaves the browser's recording
indicator lit after the user thinks they stopped, which reads as spyware.

**Manual-edit detection is per-control, not generic.** `ContactSection` wires each form control's own
`valueChanges` individually (`wireManualEditDetection()`), rather than a single generic
`fields.update([field]: ...)` helper — `ProjectFormState`'s six fields have genuinely different value
types (`Budget` vs `ProjectType` vs `string`), and a computed `[field]:` key on a spread can't carry that
per-field narrowing through TypeScript's structural check against the full state type. `field-merge.ts`'s
internal `applyOperation`/`acceptSuggestion`/`revertToManualEmpty` hit the same wall and are written the
same explicit way. A voice-driven update goes the other direction, `patchValue(..., { emitEvent: false
})`, specifically so it never fires those same `valueChanges` listeners and gets mistaken for a manual
edit.

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

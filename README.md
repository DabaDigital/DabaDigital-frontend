# DabaDigital — Frontend

Angular application for the DabaDigital corporate portfolio: presentation site (Home, About, Services,
Portfolio) plus the **AI Voice Project Assistant** — a contact form a visitor can fill in by speaking
instead of typing.

> **Backend repository:** [`DabaDigital-backend`](../DabaDigital-backend) (Rails API + MongoDB)

---

## Table of contents

1. [Project status](#project-status)
2. [What this app does](#what-this-app-does)
3. [Tech stack](#tech-stack)
4. [Getting started](#getting-started)
5. [Configuration](#configuration)
6. [Routes](#routes)
7. [Project structure](#project-structure)
8. [The voice assistant](#the-voice-assistant)
9. [Form state and field sources](#form-state-and-field-sources)
10. [Merge rules](#merge-rules)
11. [Error and empty states](#error-and-empty-states)
12. [Design guidelines](#design-guidelines)
13. [Accessibility](#accessibility)
14. [Testing](#testing)
15. [Build & deploy](#build--deploy)
16. [Roadmap](#roadmap)

---

## Project status

Bootstrap phase. This README is the implementation contract; the code is being scaffolded against it.

| Area | Status |
| --- | --- |
| Angular workspace + routing + layout | ☑ |
| Design tokens + Tailwind + dark mode | ☑ |
| Tooling: ESLint, Prettier, Vitest, Playwright, i18n extraction | ☑ |
| Home / About / Services / Portfolio pages | ☐ Home written; the other three are scaffolds awaiting the content API |
| Manual project request form | ☐ |
| Audio recorder + permission handling | ☐ |
| Voice session service (chunked turns) | ☐ |
| AI field badges + manual-edit protection | ☐ |
| Confirmation screen | ☐ shell only, no reference number |

Unbuilt sections render an `<app-scaffold-note>` so an unfinished page is obvious in the browser rather
than merely empty. Grep for `app-scaffold-note` to find the remaining work.

---

## What this app does

A visitor lands on the site, browses services and past work, and opens **Start a Project**. There they
choose between two paths to the same form:

- **Type it.** A normal, short form. It works with JavaScript-level features only — no microphone, no
  network calls to the AI stack.
- **Say it.** 🎙 *Describe your project* → they talk → fields fill in as they speak → they review, fix
  anything, and submit.

The second path is the product differentiator, and the first path is its safety net: **if anything in
the voice stack fails, the form still submits.** That constraint drives most of the architecture below.

---

## Tech stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Angular 20 (standalone components) | no NgModules |
| State | Angular **signals** | form state, recorder state, per-field sources |
| Language | TypeScript 5.8 (`strict: true`) | |
| Forms | Reactive Forms | typed form group |
| HTTP | `HttpClient` + `provideHttpClient(withFetch())` | |
| Async | RxJS 7.8 | recorder streams, request cancellation |
| Styling | Tailwind CSS + a small SCSS token layer | |
| Audio | `MediaRecorder` + `getUserMedia` | `audio/webm;codecs=opus`, `audio/mp4` on Safari |
| i18n | `@angular/localize` (fr default, en, ar) | ar renders RTL |
| Tests | Vitest + Angular Testing Library, Playwright for e2e | |
| Lint/format | ESLint (`angular-eslint`) + Prettier | |

---

## Getting started

### Prerequisites

- Node.js 20+ and npm 10+
- The backend running on `http://localhost:3000` (see the backend README)
- A browser with microphone access — Chrome, Edge, Firefox, or Safari 16+

### Install and run

```bash
git clone https://github.com/DabaDigital/DabaDigital-frontend.git
cd DabaDigital-frontend
npm install
npm start                 # ng serve → http://localhost:4200
```

`getUserMedia` requires a **secure context**: `localhost` is fine, but any other host must be served
over HTTPS or the microphone button will be disabled with an explanatory message.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm start` | dev server on `:4200` |
| `npm run build` | production build to `dist/` |
| `npm test` | unit tests (Vitest, via the `@angular/build:unit-test` builder) |
| `npm run e2e` | Playwright end-to-end tests — run `npx playwright install chromium` once first |
| `npm run lint` | ESLint |
| `npm run format` | Prettier (`format:check` in CI) |
| `npm run i18n:extract` | regenerate `src/locale/messages.xlf` |

---

## Configuration

`src/environments/environment.ts` (and `.development.ts`):

```ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000/api/v1',
  voice: {
    enabled: true,
    chunkMs: 4000,          // how often a turn is sent while recording
    maxRecordingMs: 120000, // hard stop at 2 minutes
    minConfidence: 0.6,     // below this, a value is shown as a suggestion, not applied
    defaultLanguage: 'auto' as 'auto' | 'fr' | 'en' | 'ar',
  },
};
```

`chunkMs` is the latency/cost dial. Lower means fields appear sooner and more requests are sent; 4 s is
the tested balance between "feels live" and "not one request per word".

---

## Routes

| Path | Page | Notes |
| --- | --- | --- |
| `/` | Home | hero (*Build. Launch. Grow.*), services teaser, featured work, CTA → `/start` |
| `/about` | About | vision, mission, approach, technologies |
| `/services` | Services | catalogue from `GET /services` |
| `/portfolio` | Portfolio | grid, filterable by category |
| `/portfolio/:slug` | Project detail | screenshot, features, stack, demo link |
| `/start` | Start a Project | the form + voice assistant |
| `/start/confirmation` | Confirmation | reference number, next steps |
| `**` | Not found | |

Content pages are prefetched with a resolver and cached in a signal store, so navigating back to
`/services` does not refetch.

---

## Project structure

```text
src/
├── environments/       # environment.ts + .development.ts / .production.ts (fileReplacements)
├── locale/             # messages.xlf — regenerate with `npm run i18n:extract`
├── styles/
│   ├── tokens.scss     # the design tokens, as CSS custom properties (light + dark)
│   └── tailwind.css    # Tailwind entry; `@theme inline` maps the tokens onto its namespaces
├── styles.scss         # base + component layers (everything inside `@layer`)
└── app/
    ├── core/
    │   ├── api/        # http clients: content.api.ts, voice.api.ts, project-request.api.ts
    │   ├── audio/      # audio-recorder.service.ts  (getUserMedia + MediaRecorder)
    │   ├── voice/      # voice-session.service.ts   (turn loop, operation queue)
    │   │               # field-merge.ts             (pure merge rules — unit tested)
    │   └── models/     # project-form.model.ts, voice-operation.model.ts
    ├── features/
    │   ├── home/  about/  services/  portfolio/  not-found/
    │   └── start-project/
    │       ├── start-project.page.ts
    │       ├── components/
    │       │   ├── voice-panel.component.ts     # mic button, states, privacy notice
    │       │   ├── transcript-panel.component.ts
    │       │   ├── project-form.component.ts
    │       │   ├── ai-field.component.ts        # input wrapper + ✨ badge + revert
    │       │   └── suggestion-chip.component.ts # low-confidence values: accept / dismiss
    │       └── confirmation.page.ts
    └── shared/
        ├── layout/     # site-header, site-footer
        ├── ui/         # page-header, scaffold-note
        ├── pipes/
        └── directives/
```

Routes are lazy-loaded with `loadComponent`, so each page is its own chunk.

The rule that keeps this testable: **`field-merge.ts` is pure.** It takes the current state, the
incoming operations and the locked-field set, and returns the next state. No HTTP, no signals, no DOM —
so every rule in [Merge rules](#merge-rules) is a plain unit test.

---

## The voice assistant

### Flow

```text
🎙 Describe your project
        ↓  privacy notice acknowledged (once per visit)
   getUserMedia → MediaRecorder (timeslice = chunkMs)
        ↓
   every chunk ──► POST /voice/turns  (audio + current_fields + locked_fields)
        ↓
   { transcript, operations[], fields }
        ↓
   merge → form signals update, ✨ badges appear, transcript panel scrolls
        ↓
   ■ Stop  →  final chunk with is_final=true
        ↓
   user reviews and edits
        ↓
   Send Project Request  →  POST /project_requests
```

The assistant **never** submits. Nothing leaves the browser as a project request until the user clicks
the button.

### Recorder states

| State | Button | Indicator |
| --- | --- | --- |
| `idle` | 🎙 **Describe your project** | — |
| `requesting-permission` | spinner, disabled | "Waiting for microphone access…" |
| `recording` | ■ **Stop** | ● Listening… + live waveform + elapsed time |
| `processing` | ■ Stop (still available) | "Analyzing…" on the affected fields |
| `error` | 🎙 Try again | inline message, form untouched |
| `unsupported` | hidden | "Voice input isn't available in this browser — you can fill in the form below." |

State lives in one signal (`recorderState`), and every visual is derived from it — there is no second
source of truth about whether the mic is live.

### Chunking

`MediaRecorder` is started with `start(chunkMs)`, so a `dataavailable` event fires on a fixed cadence.
Each blob is posted with the current form state; turns are sent sequentially (a pending turn is awaited
before the next is sent) so operations arrive in order and cannot race each other into the form. If a
turn fails, the chunk is dropped and recording continues — a lost 4 seconds is recoverable, a broken
recording session is not.

### Transcript panel

Shows cumulative recognized speech while recording, so the visitor can see what was understood. It is
display-only, not persisted after submission.

### Languages

French is the default target, then English and Arabic, with French + Moroccan Darija code-switching as
an explicitly tested case:

> « بغيت ندير site e-commerce للشركة ديالي، budget عندي تقريباً 20 000 dirhams. »

should yield `Project Type → E-commerce`, `Budget → 20 000 MAD`. A language selector is available but
defaults to `auto`; forcing `fr` degrades Darija segments, so leave it alone unless the visitor chooses.

---

## Form state and field sources

Every field carries its provenance — that is what powers the ✨ badge and the protection of manual
edits:

```ts
export type FieldSource = 'empty' | 'voice' | 'manual';

export interface FieldState<T> {
  value: T | null;
  source: FieldSource;
  confidence: number | null;  // voice only
  evidence: string | null;    // the words that produced it — shown on hover
  updatedAt: number;
}

export interface ProjectFormState {
  projectType: FieldState<ProjectType>;
  budget: FieldState<Budget>;          // { amount, currency, raw }
  deadline: FieldState<Deadline>;      // { value, unit, raw }
  technologies: FieldState<string[]>;
  description: FieldState<string>;
  // contact block — MVP: manual only
  fullName: FieldState<string>;
  companyName: FieldState<string>;
  email: FieldState<string>;
  phone: FieldState<string>;
}
```

A field whose `source === 'voice'` renders with the sparkle badge:

```text
Budget
┌──────────────────────────┐
│ 20 000 MAD               │ ✨
└──────────────────────────┘
   Extracted from your description · undo
```

The badge is informative, never a lock: the input stays fully editable. The moment the user types in it,
`source` flips to `'manual'` and the badge disappears.

---

## Merge rules

Implemented in `core/voice/field-merge.ts`, mirroring the backend's merge service — the backend is
authoritative, the frontend enforces the same rules so the UI never shows a value the server would have
rejected:

1. **Manual wins.** A field with `source === 'manual'` is never overwritten by an operation. The
   incoming value is offered as a dismissible suggestion chip instead.
2. **Corrections replace, they don't append.** "…20 000 dirhams… non, 25 000" ends as one budget of
   25 000 MAD.
3. **Untouched fields stay untouched.** An operation on `budget` can never clear `technologies`.
4. `add` / `remove` on `technologies` operate on the set; `clear` empties exactly one field.
5. **Low confidence never auto-fills.** Below `minConfidence` the value appears as a suggestion the user
   accepts or dismisses — an empty field beats a wrong one.
6. Every applied operation is reversible for the length of the session (`undo` on the badge restores the
   previous value and marks the field `manual`).

---

## Error and empty states

| Situation | What the user sees |
| --- | --- |
| Microphone permission denied | "Microphone access is required to use voice input. You can still complete the form manually." + how to re-enable it |
| No `MediaRecorder` / insecure context | Voice panel hidden, form shown normally |
| Speech not understood (`unintelligible_audio`) | "We couldn't understand that part. Please try again." — nothing in the form changes |
| Backend voice endpoint down (`503`) | Voice panel collapses to "Voice input is temporarily unavailable." The form stays fully usable |
| Network drop mid-recording | Recording continues; failed chunks are skipped and a "some audio wasn't processed" note appears on stop |
| Validation error on submit | Field-level messages from the API, focus moves to the first invalid field |
| Submission succeeds | Redirect to `/start/confirmation` with the reference number |

The single rule behind this table: **a voice failure degrades to the manual form, it never blocks it.**

### Privacy notice

Before the first recording of a visit, a short inline notice appears above the mic button and must be
acknowledged:

> Your voice will be processed to extract information about your project. Audio is not stored.

Acknowledgement is sent as `X-Voice-Consent: granted` on every `/voice/*` call and remembered for the
session only.

---

## Design guidelines

Modern, minimal, technology-oriented; nothing on the contact page should look like paperwork.

- **Tokens** live in `styles/tokens.scss` and are exposed as CSS variables — colors, spacing scale,
  radii, type scale. Tailwind reads them, so there is one source of truth.
- **Type** — one display face for headings, one neutral sans for UI; generous line height in body copy.
- **Motion** — short and functional (150–250 ms). The listening pulse and waveform are the only
  continuous animations, and both respect `prefers-reduced-motion`.
- **Dark mode** — `prefers-color-scheme`, with tokens redefined rather than components restyled.
- **Responsive** — mobile-first. The voice panel is designed for a thumb: a large mic button, fixed
  above the fold on `/start`, with the form below it. Breakpoints at 640 / 1024 / 1280.
- **The form must look short.** Five fields for the MVP, the contact block collapsed until the project
  block is filled.

---

## Accessibility

- The mic button is a real `<button>` with `aria-pressed` reflecting the recording state, and its label
  changes with the state (not just its icon).
- Recorder state changes and applied operations are announced through an `aria-live="polite"` region, so
  a screen-reader user hears "Budget set to 20 000 dirhams" without watching the form.
- The ✨ badge is not color-only: it has an accessible name ("value extracted from your voice") and an
  adjacent text hint.
- Full keyboard path from hero CTA to submit; visible focus rings everywhere; the transcript panel is
  focusable and scrollable.
- Arabic renders RTL (`dir="rtl"`) with a mirrored layout.
- Contrast targets WCAG 2.2 AA.

---

## Testing

```bash
npm test          # unit
npm run e2e       # Playwright
```

- **Unit** — `field-merge.ts` gets the heaviest coverage: every rule above, plus the MVP scenario
  (Next.js / 20 000 MAD / two months, then "change the budget to 25 000" leaving the other four fields
  untouched). Recorder state transitions are tested against a mocked `MediaRecorder`.
- **Component** — the AI field badge appears on `voice`, disappears on manual input, and `undo`
  restores the previous value.
- **E2E** — Playwright runs with `--use-fake-device-for-media-stream` and a stubbed `/voice/turns`, so
  the whole speak → fill → correct → submit path is exercised without touching a real provider.
- **Manual language testing** is required before release: real recordings in French, English, Arabic and
  a mixed French + Darija sample. This cannot be faked in CI and is part of the definition of done.

---

## Build & deploy

```bash
npm run build            # dist/dabadigital-frontend/browser
```

Deploy as a static bundle behind any CDN or static host, with:

- **HTTPS mandatory** — the microphone is unavailable otherwise.
- SPA fallback rewriting unknown paths to `index.html`.
- `environment.production.ts` pointing `apiBaseUrl` at the deployed API, whose `FRONTEND_ORIGIN` must
  list this origin for CORS.
- `Permissions-Policy: microphone=(self)` so the mic works while staying scoped to this origin.

---

## Roadmap

**MVP (in scope now)** — the site's four content pages, the manual form, and voice filling of five
fields (project type, budget, deadline, technologies, description) with corrections, manual-edit
protection, review and submission. No authentication, no dashboard.

**Next** — contact fields by voice; true streaming transcription over WebSocket instead of chunked
turns; suggested budget ranges and service recommendations surfaced inline; an AI-generated project
brief shown before submission; appointment booking; and a conversational mode where the assistant asks
follow-up questions ("Do you already have a design?", "Do you need an admin dashboard?") — turning the
contact form into an AI project discovery assistant.

---

## License

Proprietary — © DabaDigital.

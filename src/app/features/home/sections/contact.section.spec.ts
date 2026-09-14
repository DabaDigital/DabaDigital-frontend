import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nService } from '../../../core/i18n/i18n.service';
import type { VoiceExtractResponseDto } from '../../../core/models/voice-operation.model';
import { RealtimeVoiceService } from '../../../core/voice/realtime-voice.service';
import { ContactSection } from './contact.section';

/**
 * A double for `RealtimeVoiceService` whose `lastResult` the test can set
 * directly, standing in for a completed voice turn without a real WebRTC
 * session. `RealtimeVoiceService.isSupported()` is called *statically* by
 * the component (see contact.section.ts), so it is unaffected by this DI
 * override — `beforeEach` below stubs the WebRTC globals it inspects instead.
 */
class FakeRealtimeVoiceService {
  readonly recorderState = signal<'idle' | 'recording'>('idle');
  readonly transcript = signal('');
  readonly errorReason = signal<null>(null);
  readonly lastResult = signal<VoiceExtractResponseDto | null>(null);
  start = vi.fn().mockResolvedValue(undefined);
  stop = vi.fn();
}

function extractResult(): VoiceExtractResponseDto {
  return {
    operations: [
      {
        field: 'project_type',
        op: 'replace',
        value: 'ecommerce',
        confidence: 0.95,
        status: 'applied',
        evidence: 'site e-commerce',
      },
    ],
    // Unused by the component — it recomputes the merged view itself via `mergeVoiceOperations`
    // against its own (possibly more current) local state rather than trusting the server's
    // snapshot of `fields` directly. See contact.section.ts's class doc for why.
    fields: {} as VoiceExtractResponseDto['fields'],
  };
}

async function render(): Promise<{
  fixture: ComponentFixture<ContactSection>;
  host: HTMLElement;
  fake: FakeRealtimeVoiceService;
}> {
  await TestBed.configureTestingModule({
    imports: [ContactSection],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: RealtimeVoiceService, useClass: FakeRealtimeVoiceService },
    ],
  }).compileComponents();
  TestBed.inject(I18nService).setLocale('en');

  const fixture = TestBed.createComponent(ContactSection);
  fixture.detectChanges();
  const fake = TestBed.inject(RealtimeVoiceService) as unknown as FakeRealtimeVoiceService;
  return { fixture, host: fixture.nativeElement as HTMLElement, fake };
}

function findButton(host: HTMLElement, text: string): HTMLButtonElement {
  const button = [...host.querySelectorAll('button')].find((el) => el.textContent?.includes(text));
  if (!button) {
    throw new Error(`expected a button containing "${text}"`);
  }
  return button;
}

/** `app-dropdown-list` is a custom combobox (`role="combobox"` trigger + `role="option"` buttons
 * in a popup), not a native `<select>` — see `dropdown-list.component.ts`. Selecting an option
 * this way exercises the exact same `ControlValueAccessor` path a real click does. */
function selectDropdownOption(
  fixture: ComponentFixture<ContactSection>,
  host: HTMLElement,
  triggerId: string,
  optionText: string,
): void {
  const trigger = host.querySelector<HTMLButtonElement>(`#${triggerId}`);
  if (!trigger) {
    throw new Error(`expected a dropdown trigger #${triggerId}`);
  }
  trigger.click();
  fixture.detectChanges();
  findButton(host, optionText).click();
  fixture.detectChanges();
}

describe('ContactSection — voice integration', () => {
  beforeEach(() => {
    // The component checks WebRTC support statically at construction time —
    // stub the globals it inspects so the voice panel (and, once a turn
    // completes, the ✨ badges) actually render.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).RTCPeerConnection = class {};
    vi.stubGlobal('isSecureContext', true);
  });

  it('shows the ✨ badge on a field the assistant filled, and it disappears once the visitor edits it', async () => {
    const { fixture, host, fake } = await render();

    fake.lastResult.set(extractResult());
    fixture.detectChanges();

    // The badge's own text is the reliable signal — its icon is decorative (aria-hidden).
    expect(host.textContent).toContain('Extracted from your description');
    expect(host.querySelector('#contact-projectType')?.textContent).toContain('Online store');

    // The visitor now picks a different type through the real combobox — `contact.section.ts`
    // marks a field `'manual'` only via the control's own `valueChanges`, so driving this through
    // the actual widget (not a direct signal write) is what makes this test worth having.
    selectDropdownOption(fixture, host, 'contact-projectType', 'Web application');

    expect(host.textContent).not.toContain('Extracted from your description');
    expect(host.querySelector('#contact-projectType')?.textContent).toContain('Web application');
  });

  it('undo clears an AI-filled field and marks it manual so a later voice mention cannot silently reclaim it', async () => {
    const { fixture, host, fake } = await render();

    fake.lastResult.set(extractResult());
    fixture.detectChanges();
    expect(host.textContent).toContain('Extracted from your description');

    findButton(host, 'Undo').click();
    fixture.detectChanges();

    expect(host.textContent).not.toContain('Extracted from your description');
    expect(host.querySelector('#contact-projectType')?.textContent).toContain('Choose a type');

    // A later voice mention must not silently reclaim it (rule 1, exercised end-to-end here).
    fake.lastResult.set(extractResult());
    fixture.detectChanges();

    expect(host.textContent).not.toContain('Extracted from your description');
    expect(host.querySelector('#contact-projectType')?.textContent).toContain('Choose a type');
  });
});

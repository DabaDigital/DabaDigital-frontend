import { describe, expect, it } from 'vitest';

import { emptyProjectFormState, type FieldState, type ProjectFormState } from '../models/project-form.model';
import type { VoiceOperationDto, VoiceOperationFieldWire } from '../models/voice-operation.model';
import { acceptSuggestion, mergeVoiceOperations, revertToManualEmpty } from './field-merge';

const NOW = 1_700_000_000_000;

function field<T>(value: T | null, source: FieldState<T>['source'], confidence: number | null = null): FieldState<T> {
  return { value, source, confidence, evidence: source === 'voice' ? 'because they said so' : null, updatedAt: 0 };
}

function op(overrides: Partial<VoiceOperationDto> & { field: VoiceOperationFieldWire }): VoiceOperationDto {
  return {
    op: 'replace',
    value: null,
    confidence: 0.9,
    status: 'applied',
    evidence: 'because they said so',
    ...overrides,
  };
}

// One example per numbered rule in frontend README.md § Merge rules / CLAUDE.md invariants, plus
// the MVP acceptance scenario. Mirrors `Voice::MergeService`'s spec in ../DabaDigital-backend —
// the two must never disagree (CLAUDE.md § Cross-repo).
describe('mergeVoiceOperations', () => {
  it('rule 1 — manual wins: never applies an operation the server marked applied, if the field is manual now', () => {
    const current: ProjectFormState = {
      ...emptyProjectFormState(),
      email: field('typed@x.com', 'manual'),
    };
    const result = mergeVoiceOperations(
      current,
      [op({ field: 'email', value: 'voice@x.com', status: 'applied' })],
      NOW,
    );

    expect(result.fields.email).toEqual(current.email); // untouched
    expect(result.suggestions).toEqual([
      { field: 'email', value: 'voice@x.com', evidence: 'because they said so', confidence: 0.9 },
    ]);
  });

  it('rule 1 — still applies to a field the server marked applied when the field is only voice-sourced', () => {
    const current: ProjectFormState = {
      ...emptyProjectFormState(),
      email: field('old@x.com', 'voice', 0.9),
    };
    const result = mergeVoiceOperations(
      current,
      [op({ field: 'email', value: 'new@x.com', status: 'applied' })],
      NOW,
    );

    expect(result.fields.email.value).toBe('new@x.com');
    expect(result.fields.email.source).toBe('voice');
  });

  it('rule 2 — corrections replace, they don’t append', () => {
    const current: ProjectFormState = {
      ...emptyProjectFormState(),
      description: field('An e-commerce site', 'voice', 0.9),
    };
    const result = mergeVoiceOperations(
      current,
      [op({ field: 'description', value: 'A mobile app instead', status: 'applied' })],
      NOW,
    );

    expect(result.fields.description.value).toBe('A mobile app instead');
  });

  it('rule 3 — operations touch only their own field: every other field stays byte-identical', () => {
    const current: ProjectFormState = {
      fullName: field('Sara Alaoui', 'manual'),
      email: field('sara@company.ma', 'manual'),
      companyName: field<string>(null, 'empty'),
      projectType: field('ecommerce', 'voice', 0.95),
      budget: field({ range: 'm', raw: '20 000 dirhams' }, 'voice', 0.9),
      description: field('An e-commerce site using Next.js', 'voice', 0.9),
    };
    const result = mergeVoiceOperations(
      current,
      [op({ field: 'budget', value: { range: 'm', raw: '25 000 dirhams' }, status: 'applied' })],
      NOW,
    );

    (['fullName', 'email', 'companyName', 'projectType', 'description'] as const).forEach((key) => {
      expect(result.fields[key]).toEqual(current[key]);
    });
    expect(result.fields.budget.value).toEqual({ range: 'm', raw: '25 000 dirhams' });
  });

  it('rule 4 — clear empties exactly one field', () => {
    const current: ProjectFormState = {
      ...emptyProjectFormState(),
      companyName: field('Acme', 'voice', 0.9),
      email: field('a@b.com', 'manual'),
    };
    const result = mergeVoiceOperations(
      current,
      [op({ field: 'company_name', op: 'clear', value: null, status: 'applied' })],
      NOW,
    );

    expect(result.fields.companyName.value).toBeNull();
    expect(result.fields.email).toEqual(current.email);
  });

  it('rule 5 — a status of "suggested" from the server never auto-fills, and becomes a suggestion', () => {
    const current: ProjectFormState = { ...emptyProjectFormState(), email: field<string>(null, 'empty') };
    const result = mergeVoiceOperations(
      current,
      [op({ field: 'email', value: 'maybe@x.com', confidence: 0.2, status: 'suggested' })],
      NOW,
    );

    expect(result.fields.email).toEqual(current.email);
    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0].value).toBe('maybe@x.com');
  });

  it('stamps applied fields with the caller-supplied timestamp, never Date.now() internally', () => {
    const current: ProjectFormState = { ...emptyProjectFormState() };
    const result = mergeVoiceOperations(
      current,
      [op({ field: 'description', value: 'x', status: 'applied' })],
      NOW,
    );

    expect(result.fields.description.updatedAt).toBe(NOW);
  });

  it('the MVP scenario (root Claude.md § MVP scope): only the budget correction applies, everything else is untouched', () => {
    const afterFirstTurn: ProjectFormState = {
      fullName: field<string>(null, 'empty'),
      email: field<string>(null, 'empty'),
      companyName: field<string>(null, 'empty'),
      projectType: field('ecommerce', 'voice', 0.95),
      budget: field({ range: 'm', raw: '20 000 dirhams' }, 'voice', 0.9),
      description: field('An e-commerce site using Next.js, ready within two months.', 'voice', 0.85),
    };

    const result = mergeVoiceOperations(
      afterFirstTurn,
      [
        op({
          field: 'budget',
          value: { range: 'm', raw: '25 000 dirhams' },
          status: 'applied',
          evidence: 'change the budget to 25,000',
        }),
      ],
      NOW,
    );

    expect(result.fields.budget.value).toEqual({ range: 'm', raw: '25 000 dirhams' });
    (['fullName', 'email', 'companyName', 'projectType', 'description'] as const).forEach((key) => {
      expect(result.fields[key]).toEqual(afterFirstTurn[key]);
    });
  });
});

describe('acceptSuggestion', () => {
  it('promotes a suggestion into the field as voice-sourced and leaves other fields alone', () => {
    const current: ProjectFormState = { ...emptyProjectFormState(), email: field('typed@x.com', 'manual') };
    const suggestion = { field: 'email' as const, value: 'voice@x.com', evidence: 'they said it', confidence: 0.4 };

    const next = acceptSuggestion(current, suggestion, NOW);

    expect(next.email).toEqual({
      value: 'voice@x.com',
      source: 'voice',
      confidence: 0.4,
      evidence: 'they said it',
      updatedAt: NOW,
    });
    expect(next.fullName).toEqual(current.fullName);
  });
});

describe('revertToManualEmpty', () => {
  it('clears the field and marks it manual, so a later voice mention never silently reclaims it', () => {
    const current: ProjectFormState = { ...emptyProjectFormState(), budget: field({ range: 'm', raw: '20k' }, 'voice', 0.9) };

    const next = revertToManualEmpty(current, 'budget', NOW);

    expect(next.budget).toEqual({ value: null, source: 'manual', confidence: null, evidence: null, updatedAt: NOW });

    // A subsequent voice operation must not overwrite it — this is exactly rule 1, re-exercised
    // end-to-end through undo -> re-merge.
    const afterUndo = mergeVoiceOperations(
      next,
      [op({ field: 'budget', value: { range: 'l', raw: '60k' }, status: 'applied' })],
      NOW,
    );
    expect(afterUndo.fields.budget.value).toBeNull();
  });
});

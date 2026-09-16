import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { defer, firstValueFrom, type Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { APP_FIELD_TO_WIRE } from '../models/voice-operation.model';
import type { Budget, ProjectFormState, ProjectType } from '../models/project-form.model';
import { SupabaseService } from './supabase.service';

/**
 * The Home page's Contact form, on the wire. Every request goes to two places:
 *
 * - the Supabase inbox (`dd_messages`), where the studio reads requests in the admin
 *   dashboard; and
 * - the Rails API, `POST /project_requests` — the one backend endpoint that creates a
 *   request (backend CLAUDE.md invariant 1), which also records which fields the visitor
 *   spoke and which they typed (`field_sources`).
 *
 * The inbox decides the outcome. Once it holds the request the visitor is told it was sent,
 * and the backend copy follows without being awaited — so a Rails outage never fails a
 * request the studio already has, and a retry after an inbox failure never duplicates the
 * backend copy. When Supabase is not configured, the backend alone decides.
 *
 * Components never touch `HttpClient` (see CLAUDE.md § Architecture rules), so this owns
 * both requests and the mapping from the form's shape to each. The backend payload matches
 * `../DabaDigital-backend` README § API reference exactly — land any change to it in both
 * READMEs in the same commit (Cross-repo).
 */

export interface ContactRequest {
  readonly fullName: string;
  readonly email: string;
  readonly companyName: string;
  readonly projectType: ProjectType;
  readonly budget: Budget | null;
  readonly description: string;
  /** The locale the request was written in, so the reply goes out in the same one. */
  readonly locale: string;
  /** Per-field provenance at submission time — `'empty' | 'voice' | 'manual'` — so the backend
   * can record which fields the visitor spoke vs typed (spec §17). */
  readonly fieldSources: ProjectFormState;
}

interface ProjectRequestWire {
  readonly project_request: {
    readonly full_name: string;
    readonly email: string;
    readonly company_name: string | null;
    readonly project_type: ProjectType;
    readonly budget: { readonly range: string; readonly raw: string } | null;
    readonly description: string;
    readonly locale: string;
    readonly field_sources: Readonly<Record<string, string>>;
  };
}

export interface ContactResponse {
  /** The confirmation number shown back to the visitor, per README § Routes. */
  readonly reference: string;
}

/**
 * The project types the inbox table accepts (its `project_type` check). A type only the
 * assistant can produce is filed there as `other`; the backend copy keeps it exactly.
 */
const INBOX_PROJECT_TYPES: readonly ProjectType[] = [
  'website',
  'web_app',
  'ecommerce',
  'mobile_app',
  'other',
];

/** `dd_messages.budget` holds at most 250 characters. */
const INBOX_BUDGET_MAX = 250;

@Injectable({ providedIn: 'root' })
export class ContactApi {
  private readonly http = inject(HttpClient);
  private readonly supabase = inject(SupabaseService);

  submit(request: ContactRequest): Observable<ContactResponse> {
    return defer(async () => {
      if (!this.supabase.configured()) {
        return firstValueFrom(this.postToBackend(request));
      }
      const reference = await this.saveToInbox(request);
      // Deliberately not awaited, and its failure deliberately not surfaced: the studio already
      // has the request, so a missed backend copy loses only the spoken-vs-typed provenance.
      this.postToBackend(request).subscribe({ error: () => undefined });
      return { reference };
    });
  }

  private async saveToInbox(request: ContactRequest): Promise<string> {
    const reference = crypto.randomUUID();
    const { error } = await this.supabase.client.from('dd_messages').insert({
      id: reference,
      full_name: request.fullName.trim(),
      email: request.email.trim(),
      company_name: request.companyName.trim(),
      project_type: INBOX_PROJECT_TYPES.includes(request.projectType)
        ? request.projectType
        : 'other',
      // The label the visitor chose, or their own words when the assistant filled it.
      budget: (request.budget?.raw ?? '').slice(0, INBOX_BUDGET_MAX),
      description: request.description.trim(),
      locale: request.locale,
    });
    if (error) throw error;
    return reference;
  }

  private postToBackend(request: ContactRequest): Observable<ContactResponse> {
    return this.http.post<ContactResponse>(
      `${environment.apiBaseUrl}/project_requests`,
      this.toWire(request),
    );
  }

  /**
   * Empty optional strings become `null` rather than `''`: an absent company and
   * a company named "" are the same thing to a human and should be the same thing
   * in the database.
   */
  private toWire(request: ContactRequest): ProjectRequestWire {
    return {
      project_request: {
        full_name: request.fullName.trim(),
        email: request.email.trim(),
        company_name: request.companyName.trim() || null,
        project_type: request.projectType,
        budget:
          request.budget?.range != null
            ? { range: request.budget.range, raw: request.budget.raw ?? '' }
            : null,
        description: request.description.trim(),
        locale: request.locale,
        field_sources: this.toWireSources(request.fieldSources),
      },
    };
  }

  private toWireSources(fields: ProjectFormState): Readonly<Record<string, string>> {
    const sources: Record<string, string> = {};
    for (const [appField, wireField] of Object.entries(APP_FIELD_TO_WIRE)) {
      sources[wireField] = fields[appField as keyof ProjectFormState].source;
    }
    return sources;
  }
}

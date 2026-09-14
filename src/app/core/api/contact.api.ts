import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { APP_FIELD_TO_WIRE } from '../models/voice-operation.model';
import type { Budget, ProjectFormState, ProjectType } from '../models/project-form.model';

/**
 * The Home page's Contact form, on the wire — `POST /project_requests`, the
 * one endpoint that ever creates a request (backend CLAUDE.md invariant 1).
 *
 * Components never touch `HttpClient` (see CLAUDE.md § Architecture rules), so
 * this owns both the request and the mapping from the form's shape to the API's.
 * Matches `../DabaDigital-backend` README § API reference exactly — land any
 * change to either in both READMEs in the same commit (Cross-repo).
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

@Injectable({ providedIn: 'root' })
export class ContactApi {
  private readonly http = inject(HttpClient);

  submit(request: ContactRequest): Observable<ContactResponse> {
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

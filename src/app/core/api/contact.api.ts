import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { ProjectType } from '../models/project-form.model';

/**
 * The landing page's contact form, on the wire.
 *
 * Components never touch `HttpClient` (see CLAUDE.md § Architecture rules), so
 * this owns both the request and the mapping from the form's shape to the API's.
 *
 * ⚠ CROSS-REPO — the payload below is written against `POST /project_requests`
 * as documented in `README.md` § Form state and field sources, but the landing
 * form is not the voice form: it has no deadline and no technologies, and it
 * collects a budget *range* rather than an amount. Confirm the following with
 * `../DabaDigital-backend` before launch, and land any change in both READMEs in
 * one commit:
 *
 *   1. that the four optional fields may be omitted entirely;
 *   2. that `budget.raw` is an acceptable home for a range label, with `amount`
 *      carrying the bottom of the range;
 *   3. the parameter wrapper name (`project_request`) and the error shape.
 */

/** Budget ranges as offered in the form. `null` is "not decided yet". */
export type BudgetRange = 's' | 'm' | 'l' | 'xl';

/** Bottom of each range, in MAD — what `budget.amount` carries. */
const BUDGET_FLOOR: Readonly<Record<BudgetRange, number>> = {
  s: 0,
  m: 20_000,
  l: 50_000,
  xl: 150_000,
};

export interface ContactRequest {
  readonly fullName: string;
  readonly email: string;
  readonly companyName: string;
  readonly projectType: ProjectType;
  readonly budget: BudgetRange | null;
  /** The label the visitor actually saw, in their language — kept as `budget.raw`. */
  readonly budgetLabel: string;
  readonly description: string;
  /** The locale the request was written in, so the reply goes out in the same one. */
  readonly locale: string;
}

interface ProjectRequestWire {
  readonly project_request: {
    readonly full_name: string;
    readonly email: string;
    readonly company_name: string | null;
    readonly project_type: ProjectType;
    readonly budget: { readonly amount: number; readonly currency: 'MAD'; readonly raw: string } | null;
    readonly description: string;
    readonly locale: string;
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
        budget: request.budget
          ? { amount: BUDGET_FLOOR[request.budget], currency: 'MAD', raw: request.budgetLabel }
          : null,
        description: request.description.trim(),
        locale: request.locale,
      },
    };
  }
}

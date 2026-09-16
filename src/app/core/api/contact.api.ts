import { Injectable, inject } from '@angular/core';
import { defer, type Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';

import type { ProjectType } from '../models/project-form.model';

/** Contact form submissions are stored in Supabase and visible only to approved admins. */
/** Budget ranges as offered in the form. `null` is "not decided yet". */
export type BudgetRange = 's' | 'm' | 'l' | 'xl';

export interface ContactRequest {
  readonly fullName: string;
  readonly email: string;
  readonly companyName: string;
  readonly projectType: ProjectType;
  readonly budget: BudgetRange | null;
  /** The label the visitor actually saw, in their language — stored in the inbox budget field. */
  readonly budgetLabel: string;
  readonly description: string;
  /** The locale the request was written in, so the reply goes out in the same one. */
  readonly locale: string;
}

export interface ContactResponse {
  /** The confirmation number shown back to the visitor, per README § Routes. */
  readonly reference: string;
}

@Injectable({ providedIn: 'root' })
export class ContactApi {
  private readonly supabase = inject(SupabaseService);

  submit(request: ContactRequest): Observable<ContactResponse> {
    return defer(async () => {
      const reference = crypto.randomUUID();
      const { error } = await this.supabase.client.from('dd_messages').insert({
        id: reference,
        full_name: request.fullName.trim(),
        email: request.email.trim(),
        company_name: request.companyName.trim(),
        project_type: request.projectType,
        budget: request.budgetLabel,
        description: request.description.trim(),
        locale: request.locale,
      });
      if (error) throw error;
      return { reference };
    });
  }
}

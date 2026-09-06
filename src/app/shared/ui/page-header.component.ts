import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Standard page heading. Content is projected rather than passed as inputs so the
 * text stays in the consuming template, where the `i18n` attributes live.
 *
 * ```html
 * <app-page-header>
 *   <ng-container pageEyebrow i18n="@@x.eyebrow">Services</ng-container>
 *   <ng-container pageTitle i18n="@@x.title">Ce que nous construisons</ng-container>
 *   <ng-container pageLede i18n="@@x.lede">…</ng-container>
 * </app-page-header>
 * ```
 */
@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {}

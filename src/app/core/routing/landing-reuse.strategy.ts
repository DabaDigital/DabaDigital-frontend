import { Injectable } from '@angular/core';
import { type ActivatedRouteSnapshot, BaseRouteReuseStrategy } from '@angular/router';

/**
 * Keeps the landing page alive across its three URLs.
 *
 * `/`, `/fr` and `/en` are three route configs (`app.routes.ts`), and the router's
 * default strategy re-creates the component whenever the config changes. On a language
 * switch that would throw away a contact form in progress, restart the 3D scenes and
 * replay every entrance — for a page whose only change is its text. Reused, the page
 * stays put and only its `locale` input moves (route data, bound by
 * `withComponentInputBinding`).
 *
 * A landing route is one whose data names a `locale`; nothing else carries that key.
 */
@Injectable({ providedIn: 'root' })
export class LandingReuseStrategy extends BaseRouteReuseStrategy {
  override shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return super.shouldReuseRoute(future, curr) || (isLanding(future) && isLanding(curr));
  }
}

function isLanding(route: ActivatedRouteSnapshot): boolean {
  return route.data['locale'] !== undefined;
}

/// <reference types="@angular/localize" />

import { bootstrapApplication, type BootstrapContext } from '@angular/platform-browser';

import { App } from './app/app';
import { config } from './app/app.config.server';

/**
 * The server entry, used only at build time: `ng build` prerenders the routes marked
 * `RenderMode.Prerender` in `app.routes.server.ts` into static HTML (`outputMode: "static"`
 * in angular.json — there is no server at runtime). The development configuration sets
 * `"server": false`, so `ng serve`, `ng test` and the e2e run stay client-only.
 */
const bootstrap = (context: BootstrapContext) => bootstrapApplication(App, config, context);

export default bootstrap;

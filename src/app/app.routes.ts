import { Routes } from '@angular/router';
import { adminGuard } from './core/api/admin-auth.service';
import { NOINDEX } from './core/seo/seo.service';
import { HomePage } from './features/home/home.page';

const SITE = 'DabaDigital';

export const routes: Routes = [
  {
    path: 'admin/login',
    loadComponent: () => import('./features/admin/admin-login.page').then((m) => m.AdminLoginPage),
    title: 'DabaDigital — Admin',
    data: NOINDEX,
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    canActivateChild: [adminGuard],
    // Componentless, so every child inherits it.
    data: NOINDEX,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/admin/admin.page').then((m) => m.AdminPage),
        data: { section: 'overview' },
      },
      ...(
        ['projects', 'categories', 'services', 'team', 'social', 'contact', 'messages'] as const
      ).map((section) => ({
        path: section,
        loadComponent: () => import('./features/admin/admin.page').then((m) => m.AdminPage),
        data: { section },
      })),
    ],
    title: 'DabaDigital — Admin',
  },
  // The landing page, once per language: `/` (Arabic, the primary locale), `/fr`, `/en` —
  // see `LOCALE_HOME_PATH`. Each URL is prerendered in its own language at build time
  // (`app.routes.server.ts`), and the `locale` in its data is what makes it a landing route:
  // `HomePage` follows it, `SeoService` describes it, and `LandingReuseStrategy` keeps the one
  // component alive when the visitor moves between the three.
  //
  // No `title` on purpose. The landing page's title follows the language, so `SeoService`
  // sets it. `DefaultTitleStrategy` leaves the document title alone for a route without one,
  // which is exactly the hand-off this needs.
  //
  // The one eager component: nearly every visit starts here. Lazy, it cost two round trips
  // after the app booted — its chunk, then that chunk's GSAP — before the banner, the page's
  // largest paint, could render. Eager, those files are preloaded with `main`.
  { path: '', component: HomePage, data: { locale: 'ar' } },
  { path: 'fr', component: HomePage, data: { locale: 'fr' } },
  { path: 'en', component: HomePage, data: { locale: 'en' } },
  // The pages below are kept out of search results (`NOINDEX`) until each has content of its
  // own: About and Start are scaffolds, Services and Portfolio repeat a landing-page section,
  // and a project page is a name and a one-line summary so far. They stay crawlable, so
  // their links are still followed. Drop `data: NOINDEX` from a page — and add it to
  // `public/sitemap.xml` — once it is worth finding on its own.
  {
    path: 'about',
    loadComponent: () => import('./features/about/about.page').then((m) => m.AboutPage),
    title: $localize`:@@route.about.title:À propos — ${SITE}:site:`,
    data: NOINDEX,
  },
  {
    path: 'services',
    loadComponent: () => import('./features/services/services.page').then((m) => m.ServicesPage),
    title: $localize`:@@route.services.title:Services — ${SITE}:site:`,
    data: NOINDEX,
  },
  {
    path: 'portfolio',
    loadComponent: () => import('./features/portfolio/portfolio.page').then((m) => m.PortfolioPage),
    title: $localize`:@@route.portfolio.title:Réalisations — ${SITE}:site:`,
    data: NOINDEX,
  },
  {
    path: 'portfolio/:slug',
    loadComponent: () =>
      import('./features/portfolio/portfolio-detail.page').then((m) => m.PortfolioDetailPage),
    title: $localize`:@@route.portfolioDetail.title:Projet — ${SITE}:site:`,
    data: NOINDEX,
  },
  {
    path: 'start',
    // Componentless, so both children inherit it.
    data: NOINDEX,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/start-project/start-project.page').then((m) => m.StartProjectPage),
        title: $localize`:@@route.start.title:Démarrer un projet — ${SITE}:site:`,
      },
      {
        path: 'confirmation',
        loadComponent: () =>
          import('./features/start-project/confirmation.page').then((m) => m.ConfirmationPage),
        title: $localize`:@@route.confirmation.title:Demande envoyée — ${SITE}:site:`,
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.page').then((m) => m.NotFoundPage),
    title: $localize`:@@route.notFound.title:Page introuvable — ${SITE}:site:`,
    data: NOINDEX,
  },
];

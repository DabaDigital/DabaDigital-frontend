import { Routes } from '@angular/router';

const SITE = 'DabaDigital';

export const routes: Routes = [
  {
    // No `title` on purpose. The landing page's title follows the runtime
    // language, so `HomePage` sets it itself — see the effect in that component.
    // `DefaultTitleStrategy` leaves the document title alone for a route without
    // one, which is exactly the hand-off this needs.
    path: '',
    loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about/about.page').then((m) => m.AboutPage),
    title: $localize`:@@route.about.title:À propos — ${SITE}:site:`,
  },
  {
    path: 'services',
    loadComponent: () => import('./features/services/services.page').then((m) => m.ServicesPage),
    title: $localize`:@@route.services.title:Services — ${SITE}:site:`,
  },
  {
    path: 'portfolio',
    loadComponent: () => import('./features/portfolio/portfolio.page').then((m) => m.PortfolioPage),
    title: $localize`:@@route.portfolio.title:Réalisations — ${SITE}:site:`,
  },
  {
    path: 'portfolio/:slug',
    loadComponent: () =>
      import('./features/portfolio/portfolio-detail.page').then((m) => m.PortfolioDetailPage),
    title: $localize`:@@route.portfolioDetail.title:Projet — ${SITE}:site:`,
  },
  {
    path: 'start',
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
  },
];

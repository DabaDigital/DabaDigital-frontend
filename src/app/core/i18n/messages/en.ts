import type { Catalog } from './ar';

/** English. Typed as `Catalog`, so a missing or invented key fails the build. */
export const EN: Catalog = {
  // ── Document ──────────────────────────────────────────────────────────────
  'meta.title': 'DabaDigital — Build. Launch. Grow.',

  // ── Header / navigation ───────────────────────────────────────────────────
  'nav.about': 'About',
  'nav.projects': 'Projects',
  'nav.services': 'Services',
  'nav.contact': 'Contact',
  'nav.cta': 'Start a project',
  'nav.primaryLabel': 'Main navigation',
  'nav.mobileLabel': 'Mobile navigation',
  'nav.homeLabel': 'DabaDigital — home',
  'nav.openMenu': 'Open menu',
  'nav.closeMenu': 'Close menu',
  'nav.skipToContent': 'Skip to main content',

  // ── Theme toggle ──────────────────────────────────────────────────────────
  'theme.switchToDark': 'Switch to dark theme',
  'theme.switchToLight': 'Switch to light theme',

  // ── Language menu ─────────────────────────────────────────────────────────
  'lang.label': 'Language',
  'lang.choose': 'Choose a language',
  'lang.current': 'Current language: {name}',

  // ── 1 · Banner ────────────────────────────────────────────────────────────
  'banner.eyebrow': 'Digital studio · Morocco',
  'banner.title1': 'Build.',
  'banner.title2': 'Launch.',
  'banner.title3': 'Grow.',
  'banner.lede':
    'We design and build web products for Moroccan businesses: brochure sites, e-commerce platforms and custom business applications.',
  'banner.ctaPrimary': 'Start a project',
  'banner.ctaSecondary': 'See our work',
  'banner.voiceHint':
    'New: describe your project out loud and let the assistant fill in the form for you.',
  'banner.statsLabel': 'The studio in numbers',
  'banner.stat1Value': '40+',
  'banner.stat1Label': 'projects delivered',
  'banner.stat2Value': '8',
  'banner.stat2Label': 'years of experience',
  'banner.stat3Value': '3',
  'banner.stat3Label': 'languages supported',

  // ── 2 · About ─────────────────────────────────────────────────────────────
  'about.eyebrow': 'About us',
  'about.title': 'A small team, high standards.',
  'about.lede':
    'We build fast, accessible digital experiences that pair current technology with a calm, legible design. No templates, no complexity for its own sake.',
  'about.body':
    'Every project starts with one question: what has to work here? From there we move to a prototype we test with you, then to a product we ship and keep supporting after launch.',
  'about.pillar1.title': 'Design first',
  'about.pillar1.text': 'We start from use, not from code: prototype, user test, then build.',
  'about.pillar2.title': 'Measurable performance',
  'about.pillar2.text': 'A performance budget per page, and Core Web Vitals tracked after launch.',
  'about.pillar3.title': 'Multilingual from day one',
  'about.pillar3.text': 'Arabic, French and English, with real right-to-left support.',
  'about.pillar4.title': 'A partnership that lasts',
  'about.pillar4.text':
    'We do not vanish at handover: maintenance, security updates, continuous improvement.',

  // ── 3 · Projects ──────────────────────────────────────────────────────────
  'projects.eyebrow': 'Projects',
  'projects.title': 'Work we have shipped',
  'projects.lede': 'A selection of the products we designed, built, and still support today.',
  'projects.filterLabel': 'Filter by type',
  'projects.searchLabel': 'Search projects',
  'projects.searchPlaceholder': 'Search by name, description or type',
  'projects.clearSearch': 'Clear search',
  'projects.searchEmpty': 'No projects match your search and selected type.',
  'projects.filter.all': 'All',
  'projects.filter.web': 'Web',
  'projects.filter.ecommerce': 'E-commerce',
  'projects.filter.ai': 'AI',
  'projects.filter.mobile': 'Mobile',
  'projects.empty': 'No project in this category yet.',
  'projects.emptyAction': 'Show all projects',
  'projects.viewCase': 'Read the case study',
  'projects.countLabel': '{count} project(s) shown',
  'projects.item.neural-ledger.summary':
    'Real-time finance dashboard with automatic transaction categorisation and anomaly detection.',
  'projects.item.aura-commerce.summary':
    'Multilingual online store with local payment methods and a completely rebuilt checkout.',
  'projects.item.atlas-cargo.summary':
    'Road-freight tracking platform between Casablanca and Europe, with live route planning.',
  'projects.item.zellige-studio.summary':
    'Brochure site for an architecture studio, built around a high-resolution gallery that stays fast.',
  'projects.item.souk-connect.summary':
    'Mobile app connecting artisans with buyers, with built-in messaging and secure payment.',
  'projects.item.riad-atlas.summary':
    'Direct booking engine for a group of riads, cutting out the intermediaries’ commission.',

  // ── 4 · Services ──────────────────────────────────────────────────────────
  'services.eyebrow': 'Services',
  'services.title': 'What we do',
  'services.lede':
    'Six disciplines, one standard: a product that is fast, accessible, and holds up over time.',
  'services.web.title': 'Websites and web apps',
  'services.web.text':
    'Fast, responsive interfaces built with Angular and Next.js, designed mobile-first.',
  'services.ecommerce.title': 'E-commerce',
  'services.ecommerce.text':
    'Online stores, local payment methods, and a checkout tuned for conversion.',
  'services.ai.title': 'AI integration',
  'services.ai.text':
    'Conversational assistants, data extraction, and automation that genuinely helps the business.',
  'services.mobile.title': 'Mobile apps',
  'services.mobile.text':
    'iOS and Android applications from a single codebase, with native performance.',
  'services.design.title': 'UI/UX design',
  'services.design.text': 'Design systems, clickable prototypes, and accessibility audits.',
  'services.cloud.title': 'Hosting and maintenance',
  'services.cloud.text': 'Deployment, monitoring and backups — and we are the ones on call.',
  'services.ctaTitle': 'Not seeing what you need?',
  'services.ctaText':
    'Tell us what you are after and we will come back with a proposal within two working days.',

  // ── 5 · Contact ───────────────────────────────────────────────────────────
  'contact.eyebrow': 'Contact',
  'contact.title': 'Got a project in mind? Tell us about it.',
  'contact.lede':
    'Fill in the form and we will reply within two working days. No newsletter, no surprise phone call.',
  'contact.infoTitle': 'Other ways to reach us',
  'contact.emailLabel': 'Email',
  'contact.phoneLabel': 'Phone',
  'contact.locationLabel': 'Address',
  'contact.locationValue': 'Casablanca, Morocco',
  'contact.hoursLabel': 'Opening hours',
  'contact.hoursValue': 'Monday – Friday, 9am – 6pm',

  'contact.form.label': 'Contact form',
  'contact.name.label': 'Full name',
  'contact.name.placeholder': 'e.g. Sara Alaoui',
  'contact.name.error': 'Please enter your name.',
  'contact.email.label': 'Email',
  'contact.email.placeholder': 'sara@company.ma',
  'contact.email.errorRequired': 'Please enter your email address.',
  'contact.email.errorFormat': 'That email is not valid. Check the @ and the domain name.',
  'contact.company.label': 'Company',
  'contact.company.placeholder': 'Your company name',
  'contact.type.label': 'Project type',
  'contact.type.placeholder': 'Choose a type',
  'contact.type.error': 'Please choose a project type.',
  'contact.type.website': 'Brochure website',
  'contact.type.webapp': 'Web application',
  'contact.type.ecommerce': 'Online store',
  'contact.type.mobile': 'Mobile app',
  'contact.type.other': 'Something else',
  'contact.budget.label': 'Estimated budget',
  'contact.budget.placeholder': 'Choose a range',
  'contact.budget.s': 'Under 20,000 MAD',
  'contact.budget.m': '20,000 – 50,000 MAD',
  'contact.budget.l': '50,000 – 150,000 MAD',
  'contact.budget.xl': 'Over 150,000 MAD',
  'contact.budget.unknown': 'Not decided yet',
  'contact.message.label': 'Your project',
  'contact.message.placeholder':
    'Describe what you want to build, who it is for, and your timeline.',
  'contact.message.hint':
    'A few sentences is enough — we will ask the rest of the questions when we talk.',
  'contact.message.errorRequired': 'Please describe your project briefly.',
  'contact.message.errorShort': 'Add a little more detail — 20 characters minimum.',
  'contact.optional': 'optional',
  'contact.requiredHint': 'Fields marked with * are required.',
  'contact.submit': 'Send request',
  'contact.submitting': 'Sending…',
  'contact.errorSummary': 'The form could not be sent. Fix {count} field(s) below.',
  'contact.errorSend':
    'We could not send your request. Try again, or email us directly at {email}.',
  'contact.retry': 'Try again',
  'contact.successTitle': 'We have your request.',
  'contact.successText':
    'Thanks {name}. We will get back to you at {email} within two working days.',
  'contact.successAgain': 'Send another request',
  'contact.privacy':
    'Your details are used only to answer your request. They are not shared with anyone.',

  // ── Footer ────────────────────────────────────────────────────────────────
  'footer.tagline': 'Moroccan digital studio — websites, applications and custom integrations.',
  'footer.navLabel': 'Footer navigation',
  'footer.sectionsLabel': 'Sections',
  'footer.contactLabel': 'Contact',
  'footer.copyright': '© {year} DabaDigital. All rights reserved.',
  'footer.backToTop': 'Back to top',
};

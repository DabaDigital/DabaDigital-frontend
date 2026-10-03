import { ADMIN_EN } from './admin';
import type { Catalog } from './ar';
import { CONTROLS_EN } from './controls';

/** English. Typed as `Catalog`, so a missing or invented key fails the build. */
export const EN: Catalog = {
  ...ADMIN_EN,
  ...CONTROLS_EN,
  // ── Document ──────────────────────────────────────────────────────────────
  'meta.title': 'Daba Digital — Technical Digital Agency',
  'meta.description':
    'Daba Digital builds high-performance websites, digital products, mobile applications and intelligent digital experiences.',

  // ── Header / navigation ───────────────────────────────────────────────────
  'nav.home': 'Home',
  'nav.about': 'About',
  'nav.team': 'Team',
  'nav.projects': 'Portfolio',
  'nav.services': 'Services',
  'nav.contact': 'Contact',
  'nav.cta': 'Start a Project',
  'nav.primaryLabel': 'Main navigation',
  'nav.mobileLabel': 'Mobile navigation',
  'nav.homeLabel': 'Daba Digital — home',
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
  'banner.eyebrow': 'Technical agency',
  'banner.title1': 'Build.',
  'banner.title2': 'Launch.',
  'banner.title3': 'Grow.',
  'banner.lede':
    'We craft digital experiences, intelligent systems and high-performance products for ambitious brands.',
  'banner.ctaPrimary': 'Start a Project',
  'banner.ctaSecondary': 'See our work',
  'banner.scroll': 'Scroll to explore',

  // ── 2 · Featured work ─────────────────────────────────────────────────────
  'projects.eyebrow': 'Featured work',
  'projects.title': 'Ideas into real products.',
  'projects.lede':
    'We turn ambitious ideas into powerful digital experiences. Explore some of our latest projects and see what we can build together.',
  'projects.viewAll': 'View all projects',
  'projects.filterLabel': 'Filter by type',
  'projects.searchLabel': 'Search projects',
  'projects.searchPlaceholder': 'Search by name, description or type',
  'projects.clearSearch': 'Clear search',
  'projects.searchEmpty': 'No projects match your search and selected type.',
  'projects.filter.all': 'All',
  'projects.filter.webapp': 'Web App',
  'projects.filter.branding': 'Branding',
  'projects.filter.mobile': 'Mobile',
  'projects.filter.ai': 'AI',
  'projects.empty': 'No project in this category yet.',
  'projects.emptyAction': 'Show all projects',
  'projects.countLabel': '{count} project(s) shown',
  'projects.item.nextgen.summary': 'AI-powered platform',
  'projects.item.le-maitre-du-sandwich.summary': 'Brand identity & packaging',
  'projects.item.casablanca-night.summary': 'Interactive experience',

  // ── 3 · Services ──────────────────────────────────────────────────────────
  'services.eyebrow': 'Our services',
  'services.title': 'Built for what’s next.',
  'services.exploreAll': 'Explore all services',
  'services.web.title': 'Web Development',
  'services.web.text': 'Modern, scalable and high-performance web applications.',
  'services.mobile.title': 'Mobile Apps',
  'services.mobile.text': 'Native and cross-platform mobile experiences.',
  'services.design.title': 'UI/UX Design',
  'services.design.text': 'Interfaces that feel good and perform even better.',
  'services.ai.title': 'AI Solutions',
  'services.ai.text': 'Smart systems that work for you.',

  // ── 4 · About ─────────────────────────────────────────────────────────────
  'about.eyebrow': 'About Daba Digital',
  'about.title': 'More than a technical agency.',
  'about.lede':
    'We’re a team of builders, designers and problem solvers. Combining technology, creativity and strategy to turn ideas into scalable digital products.',
  'about.caption': 'A team that builds what’s next',
  'about.imageAlt': 'The Daba Digital logo',
  'about.statsLabel': 'Daba Digital in numbers',
  'about.stat1Value': '10+',
  'about.stat1Label': 'Projects delivered',
  'about.stat2Value': '5+',
  'about.stat2Label': 'Happy clients',
  'about.stat3Value': '3+',
  'about.stat3Label': 'Years of experience',

  // ── 5 · Team ──────────────────────────────────────────────────────────────
  'team.eyebrow': 'Our team',
  'team.title': 'Meet the team behind Daba Digital.',
  'team.lede':
    'Two developers, one vision. We build digital products that solve real problems and create real value.',
  'team.portfolio': 'View portfolio',
  'team.newTab': '(opens in a new tab)',
  'team.role.fullStack': 'Full Stack Developer',
  'team.member.keltoum-malouki.bio':
    'Passionate about building useful digital products and turning ideas into real-world solutions.',
  'team.member.jawad-boulmal.bio':
    'Focused on clean code, great user experiences and scalable solutions.',

  // ── 6 · Closing call to action ────────────────────────────────────────────
  'cta.eyebrow': 'Let’s build together',
  'cta.title': 'Ready to start your next project?',

  // ── 7 · Contact ───────────────────────────────────────────────────────────
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

  // ── 7 · Contact — voice assistant ────────────────────────────────────────
  'contact.voice.title': 'Rather talk it through?',
  'contact.voice.text':
    'Describe your project out loud, in Arabic, French or English. The assistant fills in the form; you check it, then send.',
  'contact.voice.privacy':
    "Your voice is processed by an external AI service to fill in this form. Audio is never stored.",
  'contact.voice.start': 'Describe your project',
  'contact.voice.stop': 'Stop',
  'contact.voice.listening': 'Listening…',
  'contact.voice.stateRequestingPermission': 'Waiting for microphone access…',
  'contact.voice.stateConnecting': 'Connecting…',
  'contact.voice.stateProcessing': 'Analyzing…',
  'contact.voice.unsupported':
    "Voice input isn't available in this browser — you can still fill in the form below.",
  'contact.voice.errorPermission':
    'Microphone access is required to use voice input. You can still complete the form manually.',
  'contact.voice.errorUnavailable':
    'Voice input is temporarily unavailable. You can still complete the form manually.',
  'contact.voice.badgeHint': 'Extracted from your description',
  'contact.voice.undo': 'Undo',
  'contact.voice.accept': 'Use this',
  'contact.voice.dismiss': 'Dismiss',

  // ── Footer ────────────────────────────────────────────────────────────────
  'footer.tagline': 'Technical agency building modern digital products.',
  'footer.navLabel': 'Footer navigation',
  'footer.sectionsLabel': 'Sections',
  'footer.contactLabel': 'Contact',
  'footer.copyright': '© {year} Daba Digital. All rights reserved.',
  'footer.backToTop': 'Back to top',
};

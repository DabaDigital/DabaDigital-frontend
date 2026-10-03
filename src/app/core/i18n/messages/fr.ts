import { ADMIN_FR } from './admin';
import type { Catalog } from './ar';
import { CONTROLS_FR } from './controls';

/**
 * French. Typed as `Catalog`, so a missing or invented key fails the build.
 *
 * French puts a non-breaking space (U+00A0) before ?, ! and : — the strings below carry it as a
 * literal character. Without it a display heading can wrap and leave the punctuation alone on its
 * own line.
 */
export const FR: Catalog = {
  ...ADMIN_FR,
  ...CONTROLS_FR,
  // ── Document ──────────────────────────────────────────────────────────────
  'meta.title': 'Daba Digital — Agence digitale technique',
  'meta.description':
    'Daba Digital conçoit des sites et des produits digitaux performants, des applications mobiles et des expériences digitales intelligentes.',

  // ── Header / navigation ───────────────────────────────────────────────────
  'nav.home': 'Accueil',
  'nav.about': 'À propos',
  'nav.team': 'Équipe',
  'nav.projects': 'Portfolio',
  'nav.services': 'Services',
  'nav.contact': 'Contact',
  'nav.cta': 'Démarrer un projet',
  'nav.primaryLabel': 'Navigation principale',
  'nav.mobileLabel': 'Navigation mobile',
  'nav.homeLabel': 'Daba Digital — accueil',
  'nav.openMenu': 'Ouvrir le menu',
  'nav.closeMenu': 'Fermer le menu',
  'nav.skipToContent': 'Aller au contenu principal',

  // ── Theme toggle ──────────────────────────────────────────────────────────
  'theme.switchToDark': 'Passer en thème sombre',
  'theme.switchToLight': 'Passer en thème clair',

  // ── Language menu ─────────────────────────────────────────────────────────
  'lang.label': 'Langue',
  'lang.choose': 'Choisir la langue',
  'lang.current': 'Langue actuelle : {name}',

  // ── 1 · Banner ────────────────────────────────────────────────────────────
  'banner.eyebrow': 'Agence technique',
  'banner.title1': 'Concevoir.',
  'banner.title2': 'Lancer.',
  'banner.title3': 'Grandir.',
  'banner.lede':
    'Nous créons des expériences digitales, des systèmes intelligents et des produits performants pour les marques ambitieuses.',
  'banner.ctaPrimary': 'Démarrer un projet',
  'banner.ctaSecondary': 'Voir nos réalisations',
  'banner.scroll': 'Défiler pour explorer',

  // ── 2 · Featured work ─────────────────────────────────────────────────────
  'projects.eyebrow': 'Projets à la une',
  'projects.title': 'Des idées devenues de vrais produits.',
  'projects.lede':
    'Nous transformons des idées ambitieuses en expériences digitales fortes. Découvrez quelques-uns de nos derniers projets, et ce que nous pouvons construire ensemble.',
  'projects.viewAll': 'Voir tous les projets',
  'projects.filterLabel': 'Filtrer par type',
  'projects.searchLabel': 'Rechercher un projet',
  'projects.searchPlaceholder': 'Rechercher par nom, description ou type',
  'projects.clearSearch': 'Effacer la recherche',
  'projects.searchEmpty': 'Aucun projet ne correspond à votre recherche et au type choisi.',
  'projects.filter.all': 'Tous',
  'projects.filter.webapp': 'Application web',
  'projects.filter.branding': 'Branding',
  'projects.filter.mobile': 'Mobile',
  'projects.filter.ai': 'IA',
  'projects.empty': 'Aucun projet dans cette catégorie pour l’instant.',
  'projects.emptyAction': 'Afficher tous les projets',
  'projects.countLabel': '{count} projet(s) affiché(s)',
  'projects.item.nextgen.summary': 'Plateforme propulsée par l’IA',
  'projects.item.le-maitre-du-sandwich.summary': 'Identité de marque & packaging',
  'projects.item.casablanca-night.summary': 'Expérience interactive',

  // ── 3 · Services ──────────────────────────────────────────────────────────
  'services.eyebrow': 'Nos services',
  'services.title': 'Pensés pour la suite.',
  'services.exploreAll': 'Découvrir tous nos services',
  'services.web.title': 'Développement web',
  'services.web.text': 'Des applications web modernes, évolutives et performantes.',
  'services.mobile.title': 'Applications mobiles',
  'services.mobile.text': 'Des expériences mobiles natives et multiplateformes.',
  'services.design.title': 'Design UI/UX',
  'services.design.text': 'Des interfaces agréables, et plus efficaces encore.',
  'services.ai.title': 'Solutions IA',
  'services.ai.text': 'Des systèmes intelligents qui travaillent pour vous.',

  // ── 4 · About ─────────────────────────────────────────────────────────────
  'about.eyebrow': 'À propos de Daba Digital',
  'about.title': 'Plus qu’une agence technique.',
  'about.lede':
    'Nous sommes une équipe de bâtisseurs, de designers et de résolveurs de problèmes. Nous associons technologie, créativité et stratégie pour transformer les idées en produits digitaux évolutifs.',
  'about.caption': 'Une équipe qui construit la suite',
  'about.imageAlt': 'Le logo Daba Digital',
  'about.statsLabel': 'Daba Digital en chiffres',
  'about.stat1Value': '10+',
  'about.stat1Label': 'Projets livrés',
  'about.stat2Value': '5+',
  'about.stat2Label': 'Clients satisfaits',
  'about.stat3Value': '3+',
  'about.stat3Label': 'Années d’expérience',

  // ── 5 · Team ──────────────────────────────────────────────────────────────
  // Épicène on purpose: the role names the function ("Développement"), not the
  // person, so no title has to guess at "Développeur" or "Développeuse".
  'team.eyebrow': 'Notre équipe',
  'team.title': 'Rencontrez l’équipe derrière Daba Digital.',
  'team.lede':
    'Une équipe de deux, une même vision. Nous construisons des produits digitaux qui résolvent de vrais problèmes et créent une vraie valeur.',
  'team.portfolio': 'Voir le portfolio',
  'team.newTab': '(s’ouvre dans un nouvel onglet)',
  'team.role.fullStack': 'Développement full stack',
  'team.member.keltoum-malouki.bio':
    'La passion de créer des produits digitaux utiles et de transformer les idées en solutions concrètes.',
  'team.member.jawad-boulmal.bio':
    'Priorité au code propre, à une expérience utilisateur soignée et aux solutions évolutives.',

  // ── 6 · Closing call to action ────────────────────────────────────────────
  'cta.eyebrow': 'Construisons ensemble',
  'cta.title': 'Prêt à lancer votre prochain projet ?',

  // ── 7 · Contact ───────────────────────────────────────────────────────────
  'contact.eyebrow': 'Contact',
  'contact.title': 'Une idée de projet ? Parlez-nous-en.',
  'contact.lede':
    'Remplissez le formulaire et nous revenons vers vous sous deux jours ouvrés. Pas de newsletter, pas d’appel surprise.',
  'contact.infoTitle': 'Autres moyens de nous joindre',
  'contact.emailLabel': 'E-mail',
  'contact.phoneLabel': 'Téléphone',
  'contact.locationLabel': 'Adresse',
  'contact.locationValue': 'Casablanca, Maroc',
  'contact.hoursLabel': 'Horaires',
  'contact.hoursValue': 'Lundi – vendredi, 9h – 18h',

  'contact.form.label': 'Formulaire de contact',
  'contact.name.label': 'Nom complet',
  'contact.name.placeholder': 'Ex. : Sara Alaoui',
  'contact.name.error': 'Merci d’indiquer votre nom.',
  'contact.email.label': 'E-mail',
  'contact.email.placeholder': 'sara@entreprise.ma',
  'contact.email.errorRequired': 'Merci d’indiquer votre e-mail.',
  'contact.email.errorFormat': 'Cet e-mail est invalide. Vérifiez le @ et le nom de domaine.',
  'contact.company.label': 'Société',
  'contact.company.placeholder': 'Le nom de votre société',
  'contact.type.label': 'Type de projet',
  'contact.type.placeholder': 'Choisissez un type',
  'contact.type.error': 'Merci de choisir un type de projet.',
  'contact.type.website': 'Site vitrine',
  'contact.type.webapp': 'Application web',
  'contact.type.ecommerce': 'Boutique en ligne',
  'contact.type.mobile': 'Application mobile',
  'contact.type.other': 'Autre chose',
  'contact.budget.label': 'Budget estimé',
  'contact.budget.placeholder': 'Choisissez une fourchette',
  'contact.budget.s': 'Moins de 20 000 MAD',
  'contact.budget.m': '20 000 – 50 000 MAD',
  'contact.budget.l': '50 000 – 150 000 MAD',
  'contact.budget.xl': 'Plus de 150 000 MAD',
  'contact.budget.unknown': 'Pas encore défini',
  'contact.message.label': 'Votre projet',
  'contact.message.placeholder':
    'Décrivez ce que vous voulez construire, pour qui, et dans quel délai.',
  'contact.message.hint':
    'Quelques phrases suffisent — nous poserons le reste des questions au premier échange.',
  'contact.message.errorRequired': 'Merci de décrire brièvement votre projet.',
  'contact.message.errorShort': 'Ajoutez un peu de détail — 20 caractères au minimum.',
  'contact.optional': 'facultatif',
  'contact.requiredHint': 'Les champs marqués d’un * sont obligatoires.',
  'contact.submit': 'Envoyer la demande',
  'contact.submitting': 'Envoi en cours…',
  'contact.errorSummary':
    'Le formulaire n’a pas pu être envoyé. Corrigez {count} champ(s) ci-dessous.',
  'contact.errorSend':
    'Nous n’avons pas pu envoyer votre demande. Réessayez, ou écrivez-nous directement à {email}.',
  'contact.retry': 'Réessayer',
  'contact.successTitle': 'Nous avons bien reçu votre demande.',
  'contact.successText':
    'Merci {name}. Nous revenons vers vous sur {email} sous deux jours ouvrés.',
  'contact.successAgain': 'Envoyer une autre demande',
  'contact.privacy':
    'Vos données servent uniquement à répondre à votre demande. Elles ne sont transmises à personne.',

  // ── 7 · Contact — voice assistant ────────────────────────────────────────
  'contact.voice.title': 'Vous préférez en parler ?',
  'contact.voice.text':
    'Décrivez votre projet à voix haute, en arabe, en français ou en anglais. L’assistant remplit le formulaire ; vous vérifiez, puis vous envoyez.',
  'contact.voice.privacy':
    "Votre voix est traitée par un service d'IA externe pour remplir ce formulaire. L'audio n'est jamais conservé.",
  'contact.voice.start': 'Décrivez votre projet',
  'contact.voice.stop': 'Arrêter',
  'contact.voice.listening': 'À l’écoute…',
  'contact.voice.stateRequestingPermission': 'En attente de l’accès au micro…',
  'contact.voice.stateConnecting': 'Connexion…',
  'contact.voice.stateProcessing': 'Analyse en cours…',
  'contact.voice.unsupported':
    'La saisie vocale n’est pas disponible sur ce navigateur — vous pouvez remplir le formulaire ci-dessous.',
  'contact.voice.errorPermission':
    'L’accès au micro est nécessaire pour utiliser la saisie vocale. Vous pouvez toujours remplir le formulaire manuellement.',
  'contact.voice.errorUnavailable':
    'La saisie vocale est temporairement indisponible. Vous pouvez toujours remplir le formulaire manuellement.',
  'contact.voice.badgeHint': 'Extrait de votre description',
  'contact.voice.undo': 'Annuler',
  'contact.voice.accept': 'Utiliser',
  'contact.voice.dismiss': 'Ignorer',

  // ── Footer ────────────────────────────────────────────────────────────────
  'footer.tagline': 'Agence technique qui construit des produits digitaux modernes.',
  'footer.navLabel': 'Navigation de pied de page',
  'footer.sectionsLabel': 'Sections',
  'footer.contactLabel': 'Contact',
  'footer.copyright': '© {year} Daba Digital. Tous droits réservés.',
  'footer.backToTop': 'Revenir en haut',
};

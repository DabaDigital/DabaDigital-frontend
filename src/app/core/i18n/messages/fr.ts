import { ADMIN_FR } from './admin';
import type { Catalog } from './ar';
import { CONTROLS_FR } from './controls';

/** French. Typed as `Catalog`, so a missing or invented key fails the build. */
export const FR: Catalog = {
  ...ADMIN_FR,
  ...CONTROLS_FR,
  // ── Document ──────────────────────────────────────────────────────────────
  'meta.title': 'DabaDigital — Concevoir. Lancer. Grandir.',

  // ── Header / navigation ───────────────────────────────────────────────────
  'nav.about': 'À propos',
  'nav.projects': 'Réalisations',
  'nav.services': 'Services',
  'nav.contact': 'Contact',
  'nav.cta': 'Démarrer un projet',
  'nav.primaryLabel': 'Navigation principale',
  'nav.mobileLabel': 'Navigation mobile',
  'nav.homeLabel': 'DabaDigital — accueil',
  'nav.openMenu': 'Ouvrir le menu',
  'nav.closeMenu': 'Fermer le menu',
  'nav.skipToContent': 'Aller au contenu principal',

  // ── Theme toggle ──────────────────────────────────────────────────────────
  'theme.switchToDark': 'Passer en thème sombre',
  'theme.switchToLight': 'Passer en thème clair',

  // ── Language menu ─────────────────────────────────────────────────────────
  'lang.label': 'Langue',
  'lang.choose': 'Choisir la langue',
  'lang.current': 'Langue actuelle : {name}',

  // ── 1 · Banner ────────────────────────────────────────────────────────────
  'banner.eyebrow': "Produits numériques & technologie",
  'banner.title1': 'Concevoir.',
  'banner.title2': 'Lancer.',
  'banner.title3': 'Grandir.',
  'banner.lede': "Nous concevons des sites web, des plateformes e-commerce et des applications sur mesure pour faire avancer votre entreprise.",
  'banner.ctaPrimary': 'Démarrer un projet',
  'banner.ctaSecondary': 'Voir nos réalisations',
  'banner.statsLabel': 'Le studio en chiffres',
  'banner.stat1Value': '40+',
  'banner.stat1Label': 'Projets livrés',
  'banner.stat2Value': '8',
  'banner.stat2Label': 'Ans d’expérience',
  'banner.stat3Value': '3',
  'banner.stat3Label': 'Langues prises en charge',
  'banner.trustedBy': "Les outils qui propulsent les entreprises modernes",
  'banner.statsTrusted': "La technologie au service des équipes ambitieuses, partout",
  'banner.chip.web.title': 'Sites web',
  'banner.chip.web.text': 'Rapides. Modernes. Évolutifs.',
  'banner.chip.ecommerce.title': 'E-commerce',
  'banner.chip.ecommerce.text': 'Vendez sans limites.',
  'banner.chip.apps.title': 'Applications métier',
  'banner.chip.apps.text': 'Des solutions sur mesure.',
  'banner.chip.growth.title': 'Croissance réelle',
  'banner.chip.growth.value': '+230 %',

  // ── 2 · About ─────────────────────────────────────────────────────────────
  'about.eyebrow': "L'agence",
  'about.title': 'Une équipe réduite, des standards élevés.',
  'about.lede':
    'Nous construisons des expériences numériques rapides et accessibles, qui associent une technologie récente à une conception sobre et lisible. Pas de gabarit, pas de complexité gratuite.',
  'about.body':
    "Chaque projet commence par une seule question : qu'est-ce qui doit fonctionner ici ? De cette question nous passons à une maquette testée avec vous, puis à un produit livré et accompagné après le lancement.",
  'about.pillar1.title': "Le design d'abord",
  'about.pillar1.text':
    "On part de l'usage, pas du code : maquette, test utilisateur, puis développement.",
  'about.pillar2.title': 'Performance mesurable',
  'about.pillar2.text':
    'Un budget de performance par page et un suivi des Core Web Vitals après la mise en ligne.',
  'about.pillar3.title': 'Multilingue dès le premier jour',
  'about.pillar3.text': 'Arabe, français et anglais, avec un vrai support droite-à-gauche.',
  'about.pillar4.title': 'Un partenariat qui dure',
  'about.pillar4.text':
    'Nous ne disparaissons pas à la livraison : maintenance, correctifs de sécurité, évolutions.',

  // ── 3 · Projects ──────────────────────────────────────────────────────────
  'projects.eyebrow': "Démos tech",
  'projects.title': "Des idées aux produits numériques.",
  'projects.lede':
    "Découvrez des concepts de sites, de plateformes et d’applications que nous pouvons créer pour votre entreprise.",
  'projects.filterLabel': 'Filtrer par type',
  'projects.searchLabel': 'Rechercher des projets',
  'projects.searchPlaceholder': 'Rechercher par nom, description ou type',
  'projects.clearSearch': 'Effacer la recherche',
  'projects.searchEmpty': 'Aucun projet ne correspond à votre recherche et au type sélectionné.',
  'projects.filter.all': 'Tout',
  'projects.filter.web': 'Web',
  'projects.filter.ecommerce': 'E-commerce',
  'projects.filter.ai': 'IA',
  'projects.filter.mobile': 'Mobile',
  'projects.filter.business': 'Applications métier',
  'projects.tag.customFeatures': 'Fonctionnalités sur mesure',
  'projects.tag.booking': 'Réservation',
  'projects.tag.payments': 'Paiements',
  'projects.tag.platform': 'Plateforme',
  'projects.tag.education': 'Éducation',
  'projects.tag.marketplace': 'Place de marché',
  'projects.tag.iosAndroid': 'iOS et Android',
  'projects.empty': 'Aucun projet dans cette catégorie pour le moment.',
  'projects.emptyAction': 'Voir tous les projets',
  'projects.viewCase': "Explorer la démo",
  'projects.countLabel': '{count} projet(s) affiché(s)',
  'projects.railHint': 'Continuez à défiler pour parcourir nos projets',
  'projects.item.knowledge-hub.summary':
    "Un espace de connaissances avec recherche documentaire et assistant conversationnel intelligent.",
  'projects.item.booking-cloud.summary':
    "Une plateforme de réservation avec disponibilités en direct et calendriers partagés.",
  'projects.item.learning-platform.summary':
    "Une plateforme de formation avec cours vidéo, leçons interactives et suivi de progression.",
  'projects.item.connect-app.summary':
    "Une application mobile réunissant tâches, conversations et suivi des projets.",
  'projects.item.neural-ledger.summary':
    'Tableau de bord financier en temps réel, avec catégorisation automatique des écritures et détection des anomalies.',
  'projects.item.aura-commerce.summary':
    "Boutique en ligne multilingue, paiement local et tunnel d'achat entièrement repensé.",
  'projects.item.logistics-cloud.summary':
    "Une plateforme logistique avec suivi des expéditions et planification des trajets en direct.",
  'projects.item.design-studio.summary':
    "Un site portfolio avec une galerie de projets haute définition et rapide.",
  'projects.item.market-connect.summary':
    "Une marketplace mobile avec messagerie intégrée et paiements sécurisés.",
  'projects.item.booking-engine.summary':
    "Un moteur de réservation directe avec gestion des disponibilités et paiement sécurisé.",

  // ── 4 · Services ──────────────────────────────────────────────────────────
  'services.eyebrow': 'Services',
  'services.title': 'Ce que nous faisons',
  'services.lede':
    'Six expertises, une même exigence : un produit rapide, accessible et tenu dans le temps.',
  'services.web.title': 'Sites et applications web',
  'services.web.text':
    'Des interfaces rapides et responsives en Angular et Next.js, pensées pour le mobile d’abord.',
  'services.ecommerce.title': 'E-commerce',
  'services.ecommerce.text':
    "Boutiques en ligne, moyens de paiement locaux et parcours d'achat optimisé pour la conversion.",
  'services.ai.title': "Intégration d'IA",
  'services.ai.text':
    'Assistants conversationnels, extraction de données et automatisations réellement utiles au métier.',
  'services.mobile.title': 'Applications mobiles',
  'services.mobile.text':
    'Des applications iOS et Android depuis une seule base de code, avec des performances natives.',
  'services.design.title': 'Design UI/UX',
  'services.design.text': "Systèmes de design, maquettes cliquables et audits d'accessibilité.",
  'services.cloud.title': 'Hébergement et maintenance',
  'services.cloud.text':
    "Déploiement, supervision et sauvegardes — et c'est nous qui sommes d'astreinte.",
  'services.ctaTitle': 'Vous ne trouvez pas votre besoin ?',
  'services.ctaText':
    'Dites-nous ce qu’il vous faut : nous revenons vers vous avec une proposition sous deux jours ouvrés.',

  // ── 5 · Process ───────────────────────────────────────────────────────────
  'process.eyebrow': 'Notre méthode',
  'process.title': 'De l’idée à une vraie croissance.',
  'process.lede':
    'Un processus clair et collaboratif, pensé pour avancer vite et réduire les risques de votre projet.',
  'process.cta': 'Travaillons ensemble',
  'process.step1.title': 'Découverte',
  'process.step1.text': 'Nous comprenons vos objectifs, vos utilisateurs et vos contraintes.',
  'process.step2.title': 'Cadrage',
  'process.step2.text':
    'Nous définissons le périmètre, la feuille de route et les indicateurs de succès.',
  'process.step3.title': 'Conception',
  'process.step3.text': 'Nous concevons l’expérience et la validons avec un prototype.',
  'process.step4.title': 'Développement',
  'process.step4.text': 'Nous développons, testons et préparons la mise en ligne.',
  'process.step5.title': 'Lancement et croissance',
  'process.step5.text': 'Nous lançons, mesurons et continuons d’améliorer, ensemble.',

  // ── 6 · Contact ───────────────────────────────────────────────────────────
  'contact.eyebrow': 'Contact',
  'contact.title': 'Une idée de projet ? Parlez-nous-en.',
  'contact.lede':
    'Remplissez le formulaire et nous revenons vers vous sous deux jours ouvrés. Pas de newsletter, pas d’appel surprise.',
  'contact.infoTitle': 'Autres moyens de nous joindre',
  'contact.emailLabel': 'E-mail',
  'contact.phoneLabel': 'Téléphone',
  'contact.locationLabel': "À vos côtés",
  'contact.locationValue': "Partout dans le monde",
  'contact.hoursLabel': 'Horaires',
  'contact.hoursValue': 'Lundi – vendredi, 9h – 18h',

  'contact.form.label': 'Formulaire de contact',
  'contact.name.label': 'Nom complet',
  'contact.name.placeholder': "Ex. : Alex Morgan",
  'contact.name.error': 'Merci d’indiquer votre nom.',
  'contact.email.label': 'E-mail',
  'contact.email.placeholder': "alex@entreprise.com",
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
  'contact.budget.s': "Petit projet",
  'contact.budget.m': "Projet intermédiaire",
  'contact.budget.l': "Grand projet",
  'contact.budget.xl': "Projet d’entreprise",
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
    "Votre demande n’a pas pu être envoyée. Veuillez réessayer.",
  'contact.retry': 'Réessayer',
  'contact.successTitle': 'Nous avons bien reçu votre demande.',
  'contact.successText':
    'Merci {name}. Nous revenons vers vous sur {email} sous deux jours ouvrés.',
  'contact.successAgain': 'Envoyer une autre demande',
  'contact.privacy':
    'Vos données servent uniquement à répondre à votre demande. Elles ne sont transmises à personne.',

  // ── 6 · Contact — voice assistant ────────────────────────────────────────
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
  'footer.tagline': "Services technologiques — sites web, applications, IA et intégrations sur mesure.",
  'footer.navLabel': 'Navigation de pied de page',
  'footer.sectionsLabel': 'Sections',
  'footer.contactLabel': 'Contact',
  'footer.copyright': '© {year} DabaDigital. Tous droits réservés.',
  'footer.backToTop': 'Revenir en haut',
};

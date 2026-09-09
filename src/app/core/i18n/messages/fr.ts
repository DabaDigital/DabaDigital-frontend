import type { Catalog } from './ar';

/** French. Typed as `Catalog`, so a missing or invented key fails the build. */
export const FR: Catalog = {
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
  'banner.eyebrow': 'Studio digital · Maroc',
  'banner.title1': 'Concevoir.',
  'banner.title2': 'Lancer.',
  'banner.title3': 'Grandir.',
  'banner.lede':
    'Nous concevons et développons des produits web pour les entreprises marocaines : sites vitrines, plateformes e-commerce et applications métier sur mesure.',
  'banner.ctaPrimary': 'Démarrer un projet',
  'banner.ctaSecondary': 'Voir nos réalisations',
  'banner.voiceHint':
    "Nouveau : décrivez votre projet à voix haute et laissez l'assistant remplir le formulaire pour vous.",
  'banner.statsLabel': 'Le studio en chiffres',
  'banner.stat1Value': '40+',
  'banner.stat1Label': 'projets livrés',
  'banner.stat2Value': '8',
  'banner.stat2Label': "ans d'expérience",
  'banner.stat3Value': '3',
  'banner.stat3Label': 'langues prises en charge',

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
  'projects.eyebrow': 'Réalisations',
  'projects.title': 'Des projets que nous avons lancés',
  'projects.lede':
    'Une sélection de produits que nous avons conçus, développés et que nous accompagnons encore.',
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
  'projects.empty': 'Aucun projet dans cette catégorie pour le moment.',
  'projects.emptyAction': 'Voir tous les projets',
  'projects.viewCase': "Lire l'étude de cas",
  'projects.countLabel': '{count} projet(s) affiché(s)',
  'projects.item.neural-ledger.summary':
    'Tableau de bord financier en temps réel, avec catégorisation automatique des écritures et détection des anomalies.',
  'projects.item.aura-commerce.summary':
    "Boutique en ligne multilingue, paiement local et tunnel d'achat entièrement repensé.",
  'projects.item.atlas-cargo.summary':
    'Plateforme de suivi du fret routier entre Casablanca et l’Europe, avec planification des tournées en temps réel.',
  'projects.item.zellige-studio.summary':
    "Site vitrine d'un studio d'architecture, construit autour d'une galerie haute définition qui reste rapide.",
  'projects.item.souk-connect.summary':
    'Application mobile reliant artisans et acheteurs, avec messagerie intégrée et paiement sécurisé.',
  'projects.item.riad-atlas.summary':
    'Moteur de réservation en direct pour un groupe de riads, qui supprime la commission des intermédiaires.',

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

  // ── 5 · Contact ───────────────────────────────────────────────────────────
  'contact.eyebrow': 'Contact',
  'contact.title': 'Une idée de projet ? Parlez-nous-en.',
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
  'contact.name.placeholder': 'Ex. : Sara Alaoui',
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

  // ── 5 · Contact — voice assistant ────────────────────────────────────────
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
  'footer.tagline': 'Studio digital marocain — sites, applications et intégrations sur mesure.',
  'footer.navLabel': 'Navigation de pied de page',
  'footer.sectionsLabel': 'Sections',
  'footer.contactLabel': 'Contact',
  'footer.copyright': '© {year} DabaDigital. Tous droits réservés.',
  'footer.backToTop': 'Revenir en haut',
};

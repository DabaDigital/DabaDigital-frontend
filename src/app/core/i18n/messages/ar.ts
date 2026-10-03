import { ADMIN_AR } from './admin';
import { CONTROLS_AR } from './controls';
/**
 * Arabic — the source catalogue.
 *
 * This file defines the key set: `MessageKey` is derived from it, so `fr.ts` and
 * `en.ts` fail to compile the moment they are missing a key or invent one. Add a
 * string here first, then in the other two.
 *
 * `{name}`-style placeholders are substituted by `I18nService.t(key, params)`.
 *
 * NOTE — the figures in `about.stat*` and the three entries under
 * `projects.item.*` come from the design brief. Confirm them against the real
 * studio before this goes live.
 */
export const AR = {
  ...ADMIN_AR,
  ...CONTROLS_AR,
  // ── Document ──────────────────────────────────────────────────────────────
  'meta.title': 'دبا ديجيتال — وكالة رقمية تقنية',
  'meta.description':
    'تبني دبا ديجيتال مواقع ومنتجات رقمية عالية الأداء، وتطبيقات للهاتف، وتجارب رقمية ذكية.',

  // ── Header / navigation ───────────────────────────────────────────────────
  'nav.home': 'الرئيسية',
  'nav.about': 'من نحن',
  'nav.team': 'فريقنا',
  'nav.projects': 'أعمالنا',
  'nav.services': 'خدماتنا',
  'nav.contact': 'اتصل بنا',
  'nav.cta': 'ابدأ مشروعك',
  'nav.primaryLabel': 'التنقل الرئيسي',
  'nav.mobileLabel': 'قائمة التنقل',
  'nav.homeLabel': 'دبا ديجيتال — الصفحة الرئيسية',
  'nav.openMenu': 'فتح القائمة',
  'nav.closeMenu': 'إغلاق القائمة',
  'nav.skipToContent': 'تخطَّ إلى المحتوى الرئيسي',

  // ── Theme toggle ──────────────────────────────────────────────────────────
  'theme.switchToDark': 'التبديل إلى المظهر الداكن',
  'theme.switchToLight': 'التبديل إلى المظهر الفاتح',

  // ── Language menu ─────────────────────────────────────────────────────────
  'lang.label': 'اللغة',
  'lang.choose': 'اختر اللغة',
  'lang.current': 'اللغة الحالية: {name}',

  // ── 1 · Banner ────────────────────────────────────────────────────────────
  'banner.eyebrow': 'وكالة تقنية',
  'banner.title1': 'نُصمّم.',
  'banner.title2': 'نُطلق.',
  'banner.title3': 'نُنمّي.',
  'banner.lede': 'نصنع تجارب رقمية، وأنظمة ذكية، ومنتجات عالية الأداء للعلامات الطموحة.',
  'banner.ctaPrimary': 'ابدأ مشروعك',
  'banner.ctaSecondary': 'شاهد أعمالنا',
  'banner.scroll': 'مرّر للاستكشاف',

  // ── 2 · Featured work ─────────────────────────────────────────────────────
  'projects.eyebrow': 'أعمال مختارة',
  'projects.title': 'أفكار تتحوّل إلى منتجات حقيقية.',
  'projects.lede':
    'نحوّل الأفكار الطموحة إلى تجارب رقمية قوية. اكتشف بعضاً من أحدث مشاريعنا، وما يمكننا بناؤه معاً.',
  'projects.viewAll': 'عرض كل المشاريع',
  'projects.filterLabel': 'تصفية حسب النوع',
  'projects.searchLabel': 'البحث في المشاريع',
  'projects.searchPlaceholder': 'ابحث بالاسم أو الوصف أو النوع',
  'projects.clearSearch': 'مسح البحث',
  'projects.searchEmpty': 'لا توجد مشاريع تطابق بحثك والنوع المحدد.',
  'projects.filter.all': 'الكل',
  'projects.filter.webapp': 'تطبيق ويب',
  'projects.filter.branding': 'هوية بصرية',
  'projects.filter.mobile': 'تطبيقات الهاتف',
  'projects.filter.ai': 'ذكاء اصطناعي',
  'projects.empty': 'لا يوجد مشروع في هذا التصنيف بعد.',
  'projects.emptyAction': 'اعرض كل المشاريع',
  'projects.countLabel': '{count} مشروع معروض',
  'projects.item.nextgen.summary': 'منصّة مدعومة بالذكاء الاصطناعي',
  'projects.item.le-maitre-du-sandwich.summary': 'هوية بصرية وتغليف',
  'projects.item.casablanca-night.summary': 'تجربة تفاعلية',

  // ── 3 · Services ──────────────────────────────────────────────────────────
  'services.eyebrow': 'خدماتنا',
  'services.title': 'مصمَّمة لما هو قادم.',
  'services.exploreAll': 'استكشف كل خدماتنا',
  'services.web.title': 'تطوير الويب',
  'services.web.text': 'تطبيقات ويب حديثة، قابلة للتوسّع، وعالية الأداء.',
  'services.mobile.title': 'تطبيقات الهاتف',
  'services.mobile.text': 'تجارب هاتف أصلية ومتعدّدة المنصّات.',
  'services.design.title': 'تصميم الواجهات والتجربة',
  'services.design.text': 'واجهات مريحة في الاستخدام، وأداؤها أفضل.',
  'services.ai.title': 'حلول الذكاء الاصطناعي',
  'services.ai.text': 'أنظمة ذكية تعمل لصالحك.',

  // ── 4 · About ─────────────────────────────────────────────────────────────
  'about.eyebrow': 'عن دبا ديجيتال',
  'about.title': 'أكثر من مجرد وكالة تقنية.',
  'about.lede':
    'نحن فريق من البنّائين والمصمّمين وصنّاع الحلول. نجمع بين التقنية والإبداع والاستراتيجية لنحوّل الأفكار إلى منتجات رقمية قابلة للتوسّع.',
  'about.caption': 'فريق يبني ما هو قادم',
  'about.imageAlt': 'شعار دبا ديجيتال',
  'about.statsLabel': 'دبا ديجيتال بالأرقام',
  'about.stat1Value': '+10',
  'about.stat1Label': 'مشاريع مُنجَزة',
  'about.stat2Value': '+5',
  'about.stat2Label': 'عملاء سعداء',
  'about.stat3Value': '+3',
  'about.stat3Label': 'سنوات من الخبرة',

  // ── 5 · Team ──────────────────────────────────────────────────────────────
  // Job titles are gendered in Arabic and French, so the role and the bios name
  // the work rather than the person ("تطوير", not "مطوّر/مطوّرة").
  'team.eyebrow': 'فريقنا',
  'team.title': 'تعرّف على الفريق الذي يقف وراء دبا ديجيتال.',
  'team.lede':
    'فريق من اثنين، ورؤية واحدة. نبني منتجات رقمية تحلّ مشكلات حقيقية وتصنع قيمة حقيقية.',
  'team.portfolio': 'تصفّح معرض الأعمال',
  'team.newTab': '(يُفتح في علامة تبويب جديدة)',
  'team.role.fullStack': 'تطوير فول ستاك',
  'team.member.keltoum-malouki.bio':
    'شغف ببناء منتجات رقمية مفيدة، وتحويل الأفكار إلى حلول واقعية.',
  'team.member.jawad-boulmal.bio':
    'تركيز على الشيفرة النظيفة، وتجارب المستخدم المتميّزة، والحلول القابلة للتوسّع.',

  // ── 6 · Closing call to action ────────────────────────────────────────────
  'cta.eyebrow': 'لنبنِ معاً',
  'cta.title': 'هل أنت مستعدّ لبدء مشروعك القادم؟',

  // ── 7 · Contact ───────────────────────────────────────────────────────────
  'contact.eyebrow': 'اتصل بنا',
  'contact.title': 'لديك فكرة مشروع؟ حدّثنا عنها.',
  'contact.lede': 'املأ النموذج ونرجع إليك خلال يومَي عمل. لا رسائل تسويقية، ولا مكالمات مفاجئة.',
  'contact.infoTitle': 'طرق أخرى للتواصل',
  'contact.emailLabel': 'البريد الإلكتروني',
  'contact.phoneLabel': 'الهاتف',
  'contact.locationLabel': 'العنوان',
  'contact.locationValue': 'الدار البيضاء، المغرب',
  'contact.hoursLabel': 'أوقات العمل',
  'contact.hoursValue': 'الاثنين – الجمعة، 9:00 – 18:00',

  'contact.form.label': 'نموذج التواصل',
  'contact.name.label': 'الاسم الكامل',
  'contact.name.placeholder': 'مثال: سارة العلوي',
  'contact.name.error': 'الرجاء إدخال اسمك.',
  'contact.email.label': 'البريد الإلكتروني',
  'contact.email.placeholder': 'sara@entreprise.ma',
  'contact.email.errorRequired': 'الرجاء إدخال بريدك الإلكتروني.',
  'contact.email.errorFormat': 'هذا البريد الإلكتروني غير صالح. تحقّق من وجود @ واسم النطاق.',
  'contact.company.label': 'الشركة',
  'contact.company.placeholder': 'اسم شركتك',
  'contact.type.label': 'نوع المشروع',
  'contact.type.placeholder': 'اختر نوعاً',
  'contact.type.error': 'الرجاء اختيار نوع المشروع.',
  'contact.type.website': 'موقع تعريفي',
  'contact.type.webapp': 'تطبيق ويب',
  'contact.type.ecommerce': 'متجر إلكتروني',
  'contact.type.mobile': 'تطبيق هاتف',
  'contact.type.other': 'شيء آخر',
  'contact.budget.label': 'الميزانية التقديرية',
  'contact.budget.placeholder': 'اختر نطاقاً',
  'contact.budget.s': 'أقل من 20 000 درهم',
  'contact.budget.m': 'من 20 000 إلى 50 000 درهم',
  'contact.budget.l': 'من 50 000 إلى 150 000 درهم',
  'contact.budget.xl': 'أكثر من 150 000 درهم',
  'contact.budget.unknown': 'لم أحدّد بعد',
  'contact.message.label': 'مشروعك',
  'contact.message.placeholder': 'صِف ما تريد بناءه، ولمن، وبأي أفق زمني.',
  'contact.message.hint': 'بضع جمل تكفي — سنطرح بقية الأسئلة عند التواصل.',
  'contact.message.errorRequired': 'الرجاء وصف مشروعك بإيجاز.',
  'contact.message.errorShort': 'أضف تفاصيل أكثر قليلاً — 20 حرفاً على الأقل.',
  'contact.optional': 'اختياري',
  'contact.requiredHint': 'الحقول المعلَّمة بـ * إلزامية.',
  'contact.submit': 'أرسل الطلب',
  'contact.submitting': 'جارٍ الإرسال…',
  'contact.errorSummary': 'تعذّر إرسال النموذج. صحّح {count} من الحقول أدناه.',
  'contact.errorSend': 'تعذّر إرسال طلبك. أعد المحاولة، أو راسلنا مباشرةً على {email}.',
  'contact.retry': 'أعد المحاولة',
  'contact.successTitle': 'وصلنا طلبك.',
  'contact.successText': 'شكراً لك يا {name}. سنرجع إليك على {email} خلال يومَي عمل.',
  'contact.successAgain': 'إرسال طلب آخر',
  'contact.privacy': 'نستعمل بياناتك للردّ على طلبك فقط. لا نشاركها مع أي جهة أخرى.',

  // ── 7 · Contact — voice assistant ────────────────────────────────────────
  'contact.voice.title': 'تفضّل الحديث بدل الكتابة؟',
  'contact.voice.text':
    'صِف مشروعك بصوتك، بالعربية أو الفرنسية أو الإنجليزية. يملأ المساعد النموذج، ثم تراجعه أنت وترسله.',
  'contact.voice.privacy':
    'يُعالَج صوتك عبر خدمة ذكاء اصطناعي خارجية لملء هذا النموذج. لا يُحفظ التسجيل الصوتي أبداً.',
  'contact.voice.start': 'صِف مشروعك',
  'contact.voice.stop': 'إيقاف',
  'contact.voice.listening': 'جارٍ الاستماع…',
  'contact.voice.stateRequestingPermission': 'في انتظار الوصول إلى الميكروفون…',
  'contact.voice.stateConnecting': 'جارٍ الاتصال…',
  'contact.voice.stateProcessing': 'جارٍ التحليل…',
  'contact.voice.unsupported': 'الإدخال الصوتي غير متوفر في هذا المتصفح — يمكنك ملء النموذج أدناه.',
  'contact.voice.errorPermission':
    'الوصول إلى الميكروفون ضروري لاستخدام الإدخال الصوتي. يمكنك دائماً ملء النموذج يدوياً.',
  'contact.voice.errorUnavailable': 'الإدخال الصوتي غير متوفر مؤقتاً. يمكنك دائماً ملء النموذج يدوياً.',
  'contact.voice.badgeHint': 'مُستخرَج من وصفك',
  'contact.voice.undo': 'تراجع',
  'contact.voice.accept': 'استخدم هذا',
  'contact.voice.dismiss': 'تجاهل',

  // ── Footer ────────────────────────────────────────────────────────────────
  'footer.tagline': 'وكالة تقنية تبني منتجات رقمية حديثة.',
  'footer.navLabel': 'تنقل التذييل',
  'footer.sectionsLabel': 'الأقسام',
  'footer.contactLabel': 'التواصل',
  'footer.copyright': '© {year} دبا ديجيتال. جميع الحقوق محفوظة.',
  'footer.backToTop': 'العودة إلى الأعلى',
} as const;

/** Every key the app can translate. Derived from Arabic, the source catalogue. */
export type MessageKey = keyof typeof AR;

/** The shape `fr.ts` and `en.ts` must satisfy exactly — no gaps, no extras. */
export type Catalog = Readonly<Record<MessageKey, string>>;

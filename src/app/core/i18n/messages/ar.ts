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
 * NOTE — the figures in `about.stat*` and the six entries under `projects.item.*`
 * are placeholder content carried over from the scaffold. Replace them with real
 * numbers and real client work before this goes live.
 */
export const AR = {
  ...ADMIN_AR,
  ...CONTROLS_AR,
  // ── Document ──────────────────────────────────────────────────────────────
  'meta.title': 'دبا ديجيتال — نُصمّم. نُطلق. نُنمّي.',

  // ── Header / navigation ───────────────────────────────────────────────────
  'nav.about': 'من نحن',
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
  'banner.eyebrow': 'استوديو رقمي · المغرب',
  'banner.title1': 'نُصمّم.',
  'banner.title2': 'نُطلق.',
  'banner.title3': 'نُنمّي.',
  'banner.lede':
    'نصمّم ونطوّر منتجات رقمية للشركات المغربية: مواقع تعريفية، ومنصّات تجارة إلكترونية، وتطبيقات أعمال مصمّمة على المقاس.',
  'banner.ctaPrimary': 'ابدأ مشروعك',
  'banner.ctaSecondary': 'شاهد أعمالنا',
  'banner.voiceHint': 'جديد: صِف مشروعك بصوتك، ودع المساعد يملأ النموذج نيابةً عنك.',
  'banner.statsLabel': 'أرقام عن الاستوديو',
  'banner.stat1Value': '+40',
  'banner.stat1Label': 'مشروع مُسلَّم',
  'banner.stat2Value': '8',
  'banner.stat2Label': 'سنوات خبرة',
  'banner.stat3Value': '3',
  'banner.stat3Label': 'لغات مدعومة',

  // ── 2 · About ─────────────────────────────────────────────────────────────
  'about.eyebrow': 'من نحن',
  'about.title': 'فريق صغير، ومعايير عالية.',
  'about.lede':
    'نبني تجارب رقمية سريعة ويسهل الوصول إليها، تجمع بين تقنية حديثة وتصميم واضح ومقروء. بلا قوالب جاهزة، وبلا تعقيد بلا سبب.',
  'about.body':
    'كل مشروع يبدأ بسؤال واحد: ما الذي يجب أن ينجح هنا؟ ننطلق من هذا السؤال إلى نموذج أوّلي نختبره معكم، ثم إلى منتج نُسلّمه ونرافقه بعد الإطلاق.',
  'about.pillar1.title': 'التصميم أولاً',
  'about.pillar1.text': 'نبدأ من الاستعمال لا من الشيفرة: نموذج أوّلي، ثم اختبار، ثم تطوير.',
  'about.pillar2.title': 'أداء قابل للقياس',
  'about.pillar2.text': 'ميزانية أداء لكل صفحة، ومتابعة مؤشرات الويب الأساسية بعد الإطلاق.',
  'about.pillar3.title': 'متعدّد اللغات منذ اليوم الأول',
  'about.pillar3.text': 'العربية والفرنسية والإنجليزية، مع دعم حقيقي للكتابة من اليمين إلى اليسار.',
  'about.pillar4.title': 'شراكة تدوم',
  'about.pillar4.text': 'لا نختفي بعد التسليم: صيانة، وتحديثات أمنية، وتطوير مستمر.',

  // ── 3 · Projects ──────────────────────────────────────────────────────────
  'projects.eyebrow': 'أعمالنا',
  'projects.title': 'مشاريع أطلقناها',
  'projects.lede': 'مجموعة مختارة من المنتجات التي صمّمناها وطوّرناها وما زلنا نرافقها.',
  'projects.filterLabel': 'تصفية حسب النوع',
  'projects.searchLabel': 'البحث في المشاريع',
  'projects.searchPlaceholder': 'ابحث بالاسم أو الوصف أو النوع',
  'projects.clearSearch': 'مسح البحث',
  'projects.searchEmpty': 'لا توجد مشاريع تطابق بحثك والنوع المحدد.',
  'projects.filter.all': 'الكل',
  'projects.filter.web': 'ويب',
  'projects.filter.ecommerce': 'تجارة إلكترونية',
  'projects.filter.ai': 'ذكاء اصطناعي',
  'projects.filter.mobile': 'تطبيقات الهاتف',
  'projects.empty': 'لا يوجد مشروع في هذا التصنيف بعد.',
  'projects.emptyAction': 'اعرض كل المشاريع',
  'projects.viewCase': 'اقرأ دراسة الحالة',
  'projects.countLabel': '{count} مشروع معروض',
  'projects.item.neural-ledger.summary':
    'لوحة تحكّم مالية لحظية، مع تصنيف تلقائي للقيود المحاسبية واكتشاف الحالات الشاذة.',
  'projects.item.aura-commerce.summary':
    'متجر إلكتروني متعدّد اللغات، بدفع محلي ومسار شراء أُعيد تصميمه بالكامل.',
  'projects.item.atlas-cargo.summary':
    'منصّة تتبّع للشحن البري بين الدار البيضاء وأوروبا، مع تخطيط للمسارات في الوقت الحقيقي.',
  'projects.item.zellige-studio.summary':
    'موقع تعريفي لاستوديو معماري، مبني حول معرض صور عالي الدقة وسريع التحميل.',
  'projects.item.souk-connect.summary':
    'تطبيق هاتف يربط الحرفيين بالمشترين، مع محادثة مدمجة ودفع آمن.',
  'projects.item.riad-atlas.summary':
    'نظام حجز مباشر لمجموعة رياضات، يُلغي عمولة المنصّات الوسيطة.',

  // ── 4 · Services ──────────────────────────────────────────────────────────
  'services.eyebrow': 'خدماتنا',
  'services.title': 'ما الذي نقوم به',
  'services.lede': 'ستّ خدمات، ومعيار واحد: منتج سريع، ويسهل الوصول إليه، ويصمد مع الوقت.',
  'services.web.title': 'مواقع وتطبيقات ويب',
  'services.web.text': 'واجهات سريعة ومتجاوبة مبنية بـ Angular وNext.js، مع تصميم يبدأ من الهاتف.',
  'services.ecommerce.title': 'التجارة الإلكترونية',
  'services.ecommerce.text': 'متاجر إلكترونية، ووسائل دفع محلية، ومسار شراء مُحسَّن للتحويل.',
  'services.ai.title': 'دمج الذكاء الاصطناعي',
  'services.ai.text': 'مساعدون محادثون، واستخراج للبيانات، وأتمتة تخدم العمل فعلاً.',
  'services.mobile.title': 'تطبيقات الهاتف',
  'services.mobile.text': 'تطبيقات لنظامَي iOS وAndroid من قاعدة شيفرة واحدة، بأداء أصيل.',
  'services.design.title': 'تصميم الواجهة والتجربة',
  'services.design.text': 'أنظمة تصميم، ونماذج أوّلية قابلة للنقر، ومراجعات لإمكانية الوصول.',
  'services.cloud.title': 'الاستضافة والصيانة',
  'services.cloud.text': 'نشر، ومراقبة، ونسخ احتياطي — ونحن من يتولّى المناوبة عند العطل.',
  'services.ctaTitle': 'لم تجد ما تبحث عنه؟',
  'services.ctaText': 'أخبرنا بما تحتاجه، ونرجع إليك باقتراح خلال يومَي عمل.',

  // ── 5 · Contact ───────────────────────────────────────────────────────────
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

  // ── 5 · Contact — voice assistant ────────────────────────────────────────
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
  'footer.tagline': 'استوديو رقمي مغربي — مواقع، وتطبيقات، وتكامل على المقاس.',
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

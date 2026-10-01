-- Optional starter content copied from the existing website. Projects and contact details are placeholders.
-- Safe to re-run: existing content is retained.
begin;

insert into public.dd_categories (name, slug, position) select '{"en":"Web","fr":"Web","ar":"ويب"}', 'web', 0 where not exists (select 1 from public.dd_categories where slug = 'web');

insert into public.dd_categories (name, slug, position) select '{"en":"E-commerce","fr":"E-commerce","ar":"تجارة إلكترونية"}', 'ecommerce', 1 where not exists (select 1 from public.dd_categories where slug = 'ecommerce');

insert into public.dd_categories (name, slug, position) select '{"en":"AI","fr":"IA","ar":"ذكاء اصطناعي"}', 'ai', 2 where not exists (select 1 from public.dd_categories where slug = 'ai');

insert into public.dd_categories (name, slug, position) select '{"en":"Mobile","fr":"Mobile","ar":"تطبيقات الهاتف"}', 'mobile', 3 where not exists (select 1 from public.dd_categories where slug = 'mobile');

insert into public.dd_projects (name, slug, summary, description, year, tone, status, position) select 'Neural Ledger', 'neural-ledger', '{"en":"Real-time finance dashboard with automatic transaction categorisation and anomaly detection.","fr":"Tableau de bord financier en temps réel, avec catégorisation automatique des écritures et détection des anomalies.","ar":"لوحة تحكّم مالية لحظية، مع تصنيف تلقائي للقيود المحاسبية واكتشاف الحالات الشاذة."}', '{"en":"Real-time finance dashboard with automatic transaction categorisation and anomaly detection.","fr":"Tableau de bord financier en temps réel, avec catégorisation automatique des écritures et détection des anomalies.","ar":"لوحة تحكّم مالية لحظية، مع تصنيف تلقائي للقيود المحاسبية واكتشاف الحالات الشاذة."}', '2025', 'primary', 'published', 0 where not exists (select 1 from public.dd_projects where slug = 'neural-ledger');

insert into public.dd_project_categories (project_id, category_id) select p.id, c.id from public.dd_projects p, public.dd_categories c where p.slug = 'neural-ledger' and c.slug = 'ai' on conflict do nothing;

insert into public.dd_project_categories (project_id, category_id) select p.id, c.id from public.dd_projects p, public.dd_categories c where p.slug = 'neural-ledger' and c.slug = 'web' on conflict do nothing;

insert into public.dd_projects (name, slug, summary, description, year, tone, status, position) select 'Aura Commerce', 'aura-commerce', '{"en":"Multilingual online store with local payment methods and a completely rebuilt checkout.","fr":"Boutique en ligne multilingue, paiement local et tunnel d''achat entièrement repensé.","ar":"متجر إلكتروني متعدّد اللغات، بدفع محلي ومسار شراء أُعيد تصميمه بالكامل."}', '{"en":"Multilingual online store with local payment methods and a completely rebuilt checkout.","fr":"Boutique en ligne multilingue, paiement local et tunnel d''achat entièrement repensé.","ar":"متجر إلكتروني متعدّد اللغات، بدفع محلي ومسار شراء أُعيد تصميمه بالكامل."}', '2025', 'accent', 'published', 1 where not exists (select 1 from public.dd_projects where slug = 'aura-commerce');

insert into public.dd_project_categories (project_id, category_id) select p.id, c.id from public.dd_projects p, public.dd_categories c where p.slug = 'aura-commerce' and c.slug = 'ecommerce' on conflict do nothing;

insert into public.dd_project_categories (project_id, category_id) select p.id, c.id from public.dd_projects p, public.dd_categories c where p.slug = 'aura-commerce' and c.slug = 'web' on conflict do nothing;

insert into public.dd_projects (name, slug, summary, description, year, tone, status, position) select 'Atlas Cargo', 'atlas-cargo', '{"en":"Road-freight tracking platform between Casablanca and Europe, with live route planning.","fr":"Plateforme de suivi du fret routier entre Casablanca et l’Europe, avec planification des tournées en temps réel.","ar":"منصّة تتبّع للشحن البري بين الدار البيضاء وأوروبا، مع تخطيط للمسارات في الوقت الحقيقي."}', '{"en":"Road-freight tracking platform between Casablanca and Europe, with live route planning.","fr":"Plateforme de suivi du fret routier entre Casablanca et l’Europe, avec planification des tournées en temps réel.","ar":"منصّة تتبّع للشحن البري بين الدار البيضاء وأوروبا، مع تخطيط للمسارات في الوقت الحقيقي."}', '2024', 'primary', 'published', 2 where not exists (select 1 from public.dd_projects where slug = 'atlas-cargo');

insert into public.dd_project_categories (project_id, category_id) select p.id, c.id from public.dd_projects p, public.dd_categories c where p.slug = 'atlas-cargo' and c.slug = 'web' on conflict do nothing;

insert into public.dd_projects (name, slug, summary, description, year, tone, status, position) select 'Souk Connect', 'souk-connect', '{"en":"Mobile app connecting artisans with buyers, with built-in messaging and secure payment.","fr":"Application mobile reliant artisans et acheteurs, avec messagerie intégrée et paiement sécurisé.","ar":"تطبيق هاتف يربط الحرفيين بالمشترين، مع محادثة مدمجة ودفع آمن."}', '{"en":"Mobile app connecting artisans with buyers, with built-in messaging and secure payment.","fr":"Application mobile reliant artisans et acheteurs, avec messagerie intégrée et paiement sécurisé.","ar":"تطبيق هاتف يربط الحرفيين بالمشترين، مع محادثة مدمجة ودفع آمن."}', '2024', 'accent', 'published', 3 where not exists (select 1 from public.dd_projects where slug = 'souk-connect');

insert into public.dd_project_categories (project_id, category_id) select p.id, c.id from public.dd_projects p, public.dd_categories c where p.slug = 'souk-connect' and c.slug = 'mobile' on conflict do nothing;

insert into public.dd_project_categories (project_id, category_id) select p.id, c.id from public.dd_projects p, public.dd_categories c where p.slug = 'souk-connect' and c.slug = 'ecommerce' on conflict do nothing;

insert into public.dd_projects (name, slug, summary, description, year, tone, status, position) select 'Zellige Studio', 'zellige-studio', '{"en":"Brochure site for an architecture studio, built around a high-resolution gallery that stays fast.","fr":"Site vitrine d''un studio d''architecture, construit autour d''une galerie haute définition qui reste rapide.","ar":"موقع تعريفي لاستوديو معماري، مبني حول معرض صور عالي الدقة وسريع التحميل."}', '{"en":"Brochure site for an architecture studio, built around a high-resolution gallery that stays fast.","fr":"Site vitrine d''un studio d''architecture, construit autour d''une galerie haute définition qui reste rapide.","ar":"موقع تعريفي لاستوديو معماري، مبني حول معرض صور عالي الدقة وسريع التحميل."}', '2024', 'primary', 'published', 4 where not exists (select 1 from public.dd_projects where slug = 'zellige-studio');

insert into public.dd_project_categories (project_id, category_id) select p.id, c.id from public.dd_projects p, public.dd_categories c where p.slug = 'zellige-studio' and c.slug = 'web' on conflict do nothing;

insert into public.dd_projects (name, slug, summary, description, year, tone, status, position) select 'Riad Atlas', 'riad-atlas', '{"en":"Direct booking engine for a group of riads, cutting out the intermediaries’ commission.","fr":"Moteur de réservation en direct pour un groupe de riads, qui supprime la commission des intermédiaires.","ar":"نظام حجز مباشر لمجموعة رياضات، يُلغي عمولة المنصّات الوسيطة."}', '{"en":"Direct booking engine for a group of riads, cutting out the intermediaries’ commission.","fr":"Moteur de réservation en direct pour un groupe de riads, qui supprime la commission des intermédiaires.","ar":"نظام حجز مباشر لمجموعة رياضات، يُلغي عمولة المنصّات الوسيطة."}', '2023', 'accent', 'published', 5 where not exists (select 1 from public.dd_projects where slug = 'riad-atlas');

insert into public.dd_project_categories (project_id, category_id) select p.id, c.id from public.dd_projects p, public.dd_categories c where p.slug = 'riad-atlas' and c.slug = 'web' on conflict do nothing;

insert into public.dd_project_categories (project_id, category_id) select p.id, c.id from public.dd_projects p, public.dd_categories c where p.slug = 'riad-atlas' and c.slug = 'ecommerce' on conflict do nothing;

insert into public.dd_services (title, description, icon, status, position) select '{"en":"Websites and web apps","fr":"Sites et applications web","ar":"مواقع وتطبيقات ويب"}', '{"en":"Fast, responsive interfaces built with Angular and Next.js, designed mobile-first.","fr":"Des interfaces rapides et responsives en Angular et Next.js, pensées pour le mobile d’abord.","ar":"واجهات سريعة ومتجاوبة مبنية بـ Angular وNext.js، مع تصميم يبدأ من الهاتف."}', 'code', 'published', 0 where not exists (select 1 from public.dd_services where title->>'en' = 'Websites and web apps');

insert into public.dd_services (title, description, icon, status, position) select '{"en":"E-commerce","fr":"E-commerce","ar":"التجارة الإلكترونية"}', '{"en":"Online stores, local payment methods, and a checkout tuned for conversion.","fr":"Boutiques en ligne, moyens de paiement locaux et parcours d''achat optimisé pour la conversion.","ar":"متاجر إلكترونية، ووسائل دفع محلية، ومسار شراء مُحسَّن للتحويل."}', 'bag', 'published', 1 where not exists (select 1 from public.dd_services where title->>'en' = 'E-commerce');

insert into public.dd_services (title, description, icon, status, position) select '{"en":"AI integration","fr":"Intégration d''IA","ar":"دمج الذكاء الاصطناعي"}', '{"en":"Conversational assistants, data extraction, and automation that genuinely helps the business.","fr":"Assistants conversationnels, extraction de données et automatisations réellement utiles au métier.","ar":"مساعدون محادثون، واستخراج للبيانات، وأتمتة تخدم العمل فعلاً."}', 'sparkles', 'published', 2 where not exists (select 1 from public.dd_services where title->>'en' = 'AI integration');

insert into public.dd_services (title, description, icon, status, position) select '{"en":"Mobile apps","fr":"Applications mobiles","ar":"تطبيقات الهاتف"}', '{"en":"iOS and Android applications from a single codebase, with native performance.","fr":"Des applications iOS et Android depuis une seule base de code, avec des performances natives.","ar":"تطبيقات لنظامَي iOS وAndroid من قاعدة شيفرة واحدة، بأداء أصيل."}', 'mobile', 'published', 3 where not exists (select 1 from public.dd_services where title->>'en' = 'Mobile apps');

insert into public.dd_services (title, description, icon, status, position) select '{"en":"UI/UX design","fr":"Design UI/UX","ar":"تصميم الواجهة والتجربة"}', '{"en":"Design systems, clickable prototypes, and accessibility audits.","fr":"Systèmes de design, maquettes cliquables et audits d''accessibilité.","ar":"أنظمة تصميم، ونماذج أوّلية قابلة للنقر، ومراجعات لإمكانية الوصول."}', 'palette', 'published', 4 where not exists (select 1 from public.dd_services where title->>'en' = 'UI/UX design');

insert into public.dd_services (title, description, icon, status, position) select '{"en":"Hosting and maintenance","fr":"Hébergement et maintenance","ar":"الاستضافة والصيانة"}', '{"en":"Deployment, monitoring and backups — and we are the ones on call.","fr":"Déploiement, supervision et sauvegardes — et c''est nous qui sommes d''astreinte.","ar":"نشر، ومراقبة، ونسخ احتياطي — ونحن من يتولّى المناوبة عند العطل."}', 'cloud', 'published', 5 where not exists (select 1 from public.dd_services where title->>'en' = 'Hosting and maintenance');

insert into public.dd_social_links (name, url, icon, status, position) select 'LinkedIn', 'https://www.linkedin.com/company/dabadigital', 'linkedin', 'published', 0 where not exists (select 1 from public.dd_social_links where name = 'LinkedIn');

insert into public.dd_social_links (name, url, icon, status, position) select 'Instagram', 'https://www.instagram.com/dabadigital', 'instagram', 'published', 1 where not exists (select 1 from public.dd_social_links where name = 'Instagram');

insert into public.dd_contact_channels (label, value, href, icon, status, position) select '{"en":"Email","fr":"E-mail","ar":"البريد الإلكتروني"}', '{"en":"hello@dabadigital.ma","fr":"hello@dabadigital.ma","ar":"hello@dabadigital.ma"}', 'mailto:hello@dabadigital.ma', 'mail', 'published', 0 where not exists (select 1 from public.dd_contact_channels where label->>'en' = 'Email');

insert into public.dd_contact_channels (label, value, href, icon, status, position) select '{"en":"Phone","fr":"Téléphone","ar":"الهاتف"}', '{"en":"+212 522 000 000","fr":"+212 522 000 000","ar":"+212 522 000 000"}', 'tel:+212522000000', 'phone', 'published', 1 where not exists (select 1 from public.dd_contact_channels where label->>'en' = 'Phone');

insert into public.dd_contact_channels (label, value, href, icon, status, position) select '{"en":"Address","fr":"Adresse","ar":"العنوان"}', '{"en":"Casablanca, Morocco","fr":"Casablanca, Maroc","ar":"الدار البيضاء، المغرب"}', '', 'map-pin', 'published', 2 where not exists (select 1 from public.dd_contact_channels where label->>'en' = 'Address');

insert into public.dd_contact_channels (label, value, href, icon, status, position) select '{"en":"Opening hours","fr":"Horaires","ar":"أوقات العمل"}', '{"en":"Monday – Friday, 9am – 6pm","fr":"Lundi – vendredi, 9h – 18h","ar":"الاثنين – الجمعة، 9:00 – 18:00"}', '', 'clock', 'published', 3 where not exists (select 1 from public.dd_contact_channels where label->>'en' = 'Opening hours');

commit;

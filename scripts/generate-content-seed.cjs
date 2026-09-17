// Export the existing multilingual website content without importing Angular.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const modules = new Map();
function load(file) {
  file = path.resolve(file);
  if (modules.has(file)) return modules.get(file);
  const module = { exports: {} };
  modules.set(file, module.exports);
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(source, { exports: module.exports, module, require: (name) => load(path.resolve(path.dirname(file), name + '.ts')) });
  return module.exports;
}
const { PROJECTS, PROJECT_FILTERS, SERVICES } = load('src/app/features/home/home.content.ts');
const { COMPANY } = load('src/app/core/company.ts');
const catalogs = Object.fromEntries(['en', 'fr', 'ar'].map((locale) => [locale, load(`src/app/core/i18n/messages/${locale}.ts`)[locale.toUpperCase()]]));
const text = (key) => Object.fromEntries(Object.entries(catalogs).map(([locale, values]) => [locale, values[key]]));
const sql = (value) => typeof value === 'number' ? String(value) : `'${(typeof value === 'object' ? JSON.stringify(value) : String(value)).replaceAll("'", "''")}'`;
const statements = ['-- Optional starter content copied from the existing website. Projects and contact details are placeholders.\n-- Safe to re-run: existing content is retained.\nbegin;'];
const insert = (table, data, unique) => statements.push(`insert into public.${table} (${Object.keys(data).join(', ')}) select ${Object.values(data).map(sql).join(', ')} where not exists (select 1 from public.${table} where ${unique});`);
PROJECT_FILTERS.filter((c) => c.id !== 'all').forEach((c, position) => insert('dd_categories', { name: text(c.labelKey), slug: c.id, position }, `slug = ${sql(c.id)}`));
PROJECTS.forEach((p, position) => {
  insert('dd_projects', { name: p.name, slug: p.slug, summary: text(p.summaryKey), description: text(p.summaryKey), year: p.year, tone: p.tone, status: 'published', position }, `slug = ${sql(p.slug)}`);
  for (const category of p.categories) statements.push(`insert into public.dd_project_categories (project_id, category_id) select p.id, c.id from public.dd_projects p, public.dd_categories c where p.slug = ${sql(p.slug)} and c.slug = ${sql(category)} on conflict do nothing;`);
});
SERVICES.forEach((s, position) => insert('dd_services', { title: text(s.titleKey), description: text(s.textKey), icon: s.icon, status: 'published', position }, `title->>'en' = ${sql(text(s.titleKey).en)}`));
for (const [position, name] of ['LinkedIn', 'Instagram'].entries()) insert('dd_social_links', { name, url: COMPANY[name.toLowerCase()], icon: name.toLowerCase(), status: 'published', position }, `name = ${sql(name)}`);
const literal = (value) => ({ en: value, fr: value, ar: value });
const channels = [
  { label: text('contact.emailLabel'), value: literal(COMPANY.email), href: `mailto:${COMPANY.email}`, icon: 'mail' },
  { label: text('contact.phoneLabel'), value: literal(COMPANY.phone), href: `tel:${COMPANY.phoneHref}`, icon: 'phone' },
  { label: text('contact.locationLabel'), value: text('contact.locationValue'), href: '', icon: 'map-pin' },
  { label: text('contact.hoursLabel'), value: text('contact.hoursValue'), href: '', icon: 'clock' },
];
channels.forEach((c, position) => insert('dd_contact_channels', { ...c, status: 'published', position }, `label->>'en' = ${sql(c.label.en)}`));
statements.push('commit;');
fs.mkdirSync('supabase', { recursive: true });
fs.writeFileSync('supabase/seed.sql', statements.join('\n\n') + '\n');
console.log('Generated supabase/seed.sql from the existing content catalogs.');

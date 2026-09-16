import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

// Actual PostgreSQL executes the migration. Only Supabase's auth and storage schemas are stubbed.
const db = new PGlite();
try {
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema public, auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    create schema storage;
    create table storage.buckets(id text primary key, name text not null, public boolean not null default false, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text not null, owner uuid default auth.uid());
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon, authenticated;
    grant select on storage.buckets to anon, authenticated;
    grant select, insert, update, delete on storage.objects to anon, authenticated;
    insert into storage.buckets(id, name) values ('other-bucket', 'other-bucket');`);
  for (const file of (await readdir('supabase/migrations')).filter((f) => f.endsWith('.sql')).sort()) {
    await db.exec(await readFile(`supabase/migrations/${file}`, 'utf8'));
  }
  await db.exec(await readFile('supabase/seed.sql', 'utf8'));
  await db.exec(await readFile('supabase/seed.sql', 'utf8'));
  assert.equal((await db.query('select count(*)::int as count from dd_projects')).rows[0].count, 6);
  const admin = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const member = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  await db.exec(`insert into auth.users values ('${admin}'), ('${member}'); insert into dd_admins(user_id) values ('${admin}');`);
  const asRole = async (role, user = '') => { await db.exec(`reset role; set request.jwt.claim.sub = '${user}'; set role ${role};`); };
  await asRole('anon');
  assert.equal((await db.query('select count(*)::int as count from dd_projects')).rows[0].count, 6);
  await assert.rejects(db.query('select * from dd_messages'), /permission denied/);
  await assert.rejects(db.query("insert into dd_admins(user_id) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc')"), /permission denied/);
  await assert.rejects(db.query("update dd_projects set name = 'tampered'"), /permission denied/);
  const submit = `insert into dd_messages(full_name,email,project_type,description) values ('Test Client','client@example.com','website','This is a sufficiently detailed project request.')`;
  await db.exec(submit);
  await assert.rejects(db.query(`insert into dd_messages(full_name,email,project_type,description,status) values ('Test Client','client@example.com','website','This is a sufficiently detailed project request.','replied')`), /permission denied/);
  await asRole('authenticated', member);
  assert.equal((await db.query('select * from dd_messages')).rows.length, 0);
  assert.equal((await db.query('select * from dd_admins')).rows.length, 0);
  await assert.rejects(db.query(`insert into dd_categories(name,slug) values ('{"en":"Unauthorized"}', 'unauthorized')`), /row-level security/);
  await assert.rejects(db.query(`insert into dd_admins(user_id) values ('${member}')`), /permission denied/);
  await asRole('authenticated', admin);
  assert.equal((await db.query('select * from dd_messages')).rows.length, 1);
  await db.exec("update dd_messages set status = 'replied'");
  await assert.rejects(db.query("update dd_messages set email = 'changed@example.com'"), /permission denied/);
  const category = (await db.query('select id from dd_categories limit 1')).rows[0].id;
  const project = { id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', name: 'Private draft', slug: 'private-draft', summary: { en: 'Draft summary' }, description: { en: 'Full project description' }, year: '2026', tone: 'primary', image_url: '', website_url: '', status: 'draft', position: 10 };
  await db.query('select dd_save_project($1::jsonb, $2::uuid[])', [JSON.stringify(project), [category]]);
  assert.equal((await db.query('select * from dd_projects')).rows.length, 7);
  await assert.rejects(db.query('delete from dd_categories where id = $1', [category]), /foreign key/);
  // Invalid relation must roll back the project update too.
  await assert.rejects(db.query('select dd_save_project($1::jsonb, $2::uuid[])', [JSON.stringify({ ...project, name: 'Should roll back' }), ['eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee']]), /foreign key/);
  assert.equal((await db.query('select name from dd_projects where id = $1', [project.id])).rows[0].name, 'Private draft');
  await asRole('anon');
  assert.equal((await db.query('select * from dd_projects where id = $1', [project.id])).rows.length, 0);
  assert.equal((await db.query('select * from dd_project_categories where project_id = $1', [project.id])).rows.length, 0);
  await asRole('authenticated', member);
  await assert.rejects(db.query('select dd_save_project($1::jsonb, $2::uuid[])', [JSON.stringify(project), []]), /row-level security/);
  await asRole('authenticated', admin);
  await db.query('select dd_save_project($1::jsonb, $2::uuid[])', [JSON.stringify({ ...project, status: 'published' }), [category]]);
  await asRole('anon');
  assert.equal((await db.query('select * from dd_projects where id = $1', [project.id])).rows.length, 1);
  await asRole('authenticated', admin);
  await db.query('delete from dd_projects where id = $1', [project.id]);
  assert.equal((await db.query('select * from dd_project_categories where project_id = $1', [project.id])).rows.length, 0);
  // Project images: a public bucket for images only, written by approved admins alone.
  const bucket = (await db.query("select public, file_size_limit::int as size, allowed_mime_types from storage.buckets where id = 'dd-project-images'")).rows[0];
  assert.deepEqual([bucket.public, bucket.size, bucket.allowed_mime_types.includes('image/png'), bucket.allowed_mime_types.includes('text/html')], [true, 5242880, true, false]);
  const upload = (name, bucketId = 'dd-project-images') => db.query('insert into storage.objects(bucket_id, name) values ($1, $2)', [bucketId, name]);
  await upload('projects/cover.png');
  await assert.rejects(upload('projects/elsewhere.png', 'other-bucket'), /row-level security/);
  await asRole('anon');
  await assert.rejects(upload('projects/anonymous.png'), /row-level security/);
  await asRole('authenticated', member);
  await assert.rejects(upload('projects/member.png'), /row-level security/);
  assert.equal((await db.query('select * from storage.objects')).rows.length, 0);
  assert.equal((await db.query("delete from storage.objects where name = 'projects/cover.png' returning id")).rows.length, 0);
  // Revoking membership immediately removes permissions without waiting for JWT expiry.
  await db.exec(`reset role; delete from dd_admins where user_id = '${admin}';`);
  await asRole('authenticated', admin);
  assert.equal((await db.query('select * from dd_messages')).rows.length, 0);
  await assert.rejects(upload('projects/revoked.png'), /row-level security/);
  console.log('Database checks passed: migration, repeatable seed, RLS, admin allowlist, private inbox, server-owned fields, draft visibility, transactional project saves, category protection, project image storage, membership revocation.');
} finally { await db.close(); }

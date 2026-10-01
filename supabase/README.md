# DabaDigital dashboard setup

The Angular dashboard uses Supabase Auth and Postgres directly. All browser requests use a
**publishable** key; database row-level security enforces permissions. The sibling Rails project is
not needed for the dashboard or the landing page contact form.

## Connect a project

1. In your chosen Supabase project, run every file in `migrations/` in filename order in the SQL
   Editor, or apply them through your usual Supabase migration workflow. They create only tables,
   functions and a Storage bucket prefixed with `dd_` / `dd-`:
   - `20260915142358_dabadigital_admin.sql` — content tables, inbox, access policies.
   - `20260915200000_dabadigital_project_images.sql` — the public `dd-project-images` bucket for
     project covers (images only, 5 MB), writable by approved admins alone. Until it is applied,
     cover uploads fail with a message.
2. Optionally run `seed.sql` to copy the website's existing six projects, six services, categories,
   social links, and contact details. These are the existing **placeholder** projects and studio
   details; replace them with your real content. The seed preserves existing rows when run again.
3. Set `public/supabase-config.json`:

   ```json
   {
     "url": "https://YOUR_PROJECT_REF.supabase.co",
     "publishableKey": "sb_publishable_YOUR_KEY"
   }
   ```

   This file is intentionally public. Never put a secret or service-role key here. Only modern
   `sb_publishable_…` keys are accepted. The configuration is loaded at startup, and can also be
   replaced in the deployed site's assets without rebuilding JavaScript.
4. In Supabase **Authentication → Users**, create the administrator with an email and password.
   Then authorize that specific account in the SQL Editor:

   ```sql
   insert into public.dd_admins (user_id)
   select id from auth.users where lower(email) = lower('YOUR_ADMIN_EMAIL')
   on conflict do nothing;
   ```

   Confirm that the statement inserted a row (or that a membership already exists). Creating an
   Auth account or changing user metadata **does not** grant administrator access. Membership can
   only be managed from a trusted database connection or the Supabase dashboard.
5. Run `npm start` and open `http://localhost:4200/admin/login`. Sign in with the account from step 4.
   Use HTTPS and an SPA fallback to `index.html` on your deployed frontend.

## Features and data

| Route | Data | Behavior |
| --- | --- | --- |
| `/admin` | Content counts and recent messages | Overview and shortcuts |
| `/admin/projects` | `dd_projects`, `dd_project_categories`, `dd-project-images` bucket | Create, edit, delete, draft/publish, categories, cover image upload, website URL |
| `/admin/categories` | `dd_categories` | Names, slugs and display order; used categories cannot be deleted |
| `/admin/services` | `dd_services` | Translated title and description, icon, visibility and order |
| `/admin/social` | `dd_social_links` | Social platform, URL, icon, visibility and order |
| `/admin/contact` | `dd_contact_channels` | Translated contact labels/values, email/phone/web links, visibility and order |
| `/admin/messages` | `dd_messages` | Read, search, mark replied, archive, and open an email reply |

English, French, and Arabic text can be edited separately; empty translations use English.
Project covers are uploaded to the `dd-project-images` bucket (a random file name under
`projects/`, never overwritten). Replacing or removing a cover does not
delete the old file, so a cancelled edit never breaks a saved project; clear unused files from the
Storage dashboard if the bucket grows. Published changes appear on the home page, portfolio,
project details, services page, and footer. The inbox's reply button opens the administrator's
email application; it does not send email automatically. Marking a message replied is a separate
action.

The landing form now inserts into `dd_messages`, with `full_name`, `email`, `company_name`,
`project_type`, `budget` (the visitor's translated range label), `description`, `locale`, and a
client-generated UUID reference. This path has no dependency on Rails or voice processing. The
database assigns `new` status and the receipt timestamp. Visitors cannot set those fields or read
submitted messages. Submission failures retain the form for retry; no browser-only success is
shown. Audio and transcripts are never included in the message.

## Access policies

- Visitors can read published content and category names.
- Only users listed in `dd_admins` can read drafts or change content.
- Visitors can insert a validated message but cannot list, read, modify, or delete messages.
- Administrators can read messages and update their status. The client has no message-delete or
  message-body-update permission.
- Project saves and category links use a single transaction with caller permissions; the RPC
  does not bypass row-level security.
- Removing a `dd_admins` membership takes effect at the next database request, without relying on
  stale JWT role metadata.
- Project covers are publicly readable through the bucket's public URL. Only approved admins can
  upload, replace or delete files there; Storage itself rejects non-images and files over 5 MB.

The public contact endpoint is intended for a small studio site. Supabase Auth rate limits protect
sign-in; contact submission currently uses database validation without CAPTCHA or per-IP throttling.
If submission abuse becomes a concern, add a server-verified CAPTCHA and rate-limited Edge Function
before expanding traffic. Do not expose a service-role key to add this protection.

## Verification

```sh
npm run test:database
npm test -- --watch=false
npm run e2e
npm run lint
npm run build
```

`test:database` runs the migration and seed in embedded PostgreSQL and tests actual role policies,
including non-admin denial, inbox privacy, protected system fields, draft visibility, category
foreign keys, transaction rollback, and revoked memberships. It never touches a live project.
Browser tests stub Supabase Auth and REST to exercise the whole UI without a real account or
client data. Live sign-in, delivery, and Supabase advisors still need to be checked after connecting
the chosen project.

`npm run db:seed:generate` regenerates the optional SQL seed from the existing website translations.

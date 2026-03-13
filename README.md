# Dhyan Yog Kendra Evam Prakratik Chikitsa Shodh Sansthan

Wellness platform built with Next.js for yoga, meditation, naturopathy support, live Zoom batches, blood-group diet guidance, and condition-based program enrollment.

This project is designed to feel calm, trustworthy, and conversion-focused while still giving the organization a practical way to collect, review, and manage inquiries.

## What This Project Includes

- High-converting landing page for yoga and wellness programs
- Condition-specific and common Zoom batch positioning
- Blood-group-aware intake form
- Admin submissions dashboard
- Local JSON fallback storage for form responses
- Supabase-ready production database integration
- Resend-ready email notification flow
- Custom branding, favicon, and cleaned logo assets

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Supabase client integration
- Resend email integration

## Main Website Flow

1. A visitor lands on the homepage.
2. They explore programs, conditions, Zoom batch types, and wellness support.
3. They fill the join form with:
   - name
   - phone
   - email
   - blood group
   - condition
   - preferred batch type
   - goal
   - notes
4. The form posts to the backend route.
5. Submission is stored:
   - in Supabase if env variables are configured
   - otherwise in local JSON fallback
6. Optional email alert is sent if Resend env variables are configured.
7. Admin can view submissions at `/admin/submissions`.

## Project Structure

```text
app/
  admin/submissions/page.tsx      Admin dashboard UI
  api/admin/login/route.ts        Admin login route
  api/admin/logout/route.ts       Admin logout route
  api/join/route.ts               Main inquiry form backend
  components/
    brand-seal.tsx                Shared logo component
    join-form.tsx                 Frontend intake form
    social-icon.tsx               Social icons
  content/site-data.ts            Main content source
  globals.css                     Global styling
  layout.tsx                      Metadata and favicon config
  page.tsx                        Homepage

data/
  join-submissions.json           Local fallback submission storage

lib/
  admin-auth.ts                   Admin session helpers
  notifications.ts                Resend email notification helper
  submissions.ts                  Submission storage abstraction

public/
  logo-clean.png                  Cleaned transparent website logo
  logo-icon.png                   Favicon/app icon source

supabase/
  submissions.sql                 SQL schema for production submissions table
```

## Local Development

Install dependencies:

```powershell
npm install
```

Start the dev server:

```powershell
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment Variables

Create a `.env.local` file in the project root:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
ADMIN_ACCESS_KEY=change-this-to-a-strong-admin-password
RESEND_API_KEY=re_xxxxxxxxx
NOTIFICATION_EMAIL_TO=your-email@example.com
NOTIFICATION_EMAIL_FROM=Dhyan Yog Kendra <alerts@yourdomain.com>
```

### Variable Guide

`SUPABASE_URL`
- Supabase project URL

`SUPABASE_SERVICE_ROLE_KEY`
- Supabase service role key
- server-only
- never expose in client-side code

`ADMIN_ACCESS_KEY`
- password used for `/admin/submissions`

`RESEND_API_KEY`
- API key from Resend

`NOTIFICATION_EMAIL_TO`
- organization email address that receives new inquiry alerts

`NOTIFICATION_EMAIL_FROM`
- verified sender identity configured inside Resend

## Service Websites

Use these official websites while setting up the project:

- Supabase: `https://supabase.com`
- Resend: `https://resend.com`
- Vercel: `https://vercel.com`

You can create accounts directly on those sites and then use the dashboard steps below.

## How Submission Storage Works

This project uses a storage abstraction in [submissions.ts](/c:/Users/ashut/OneDrive/Desktop/dhyan-yog-kendra-sansthan/lib/submissions.ts).

Behavior:

- If `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` exist:
  - submissions are written to Supabase
- If those variables are missing:
  - submissions are stored locally in [join-submissions.json](/c:/Users/ashut/OneDrive/Desktop/dhyan-yog-kendra-sansthan/data/join-submissions.json)

This makes the project easy to run locally before production setup is complete.

## Supabase Setup

### 1. Create a Supabase project

Go to:

`https://supabase.com`

Then:

1. Click `Start your project`
2. Sign up or log in
3. Create a new organization if needed
4. Create a new project
5. Wait for the database to finish provisioning

### 2. Create the submissions table

Open the SQL editor and run:

[submissions.sql](/c:/Users/ashut/OneDrive/Desktop/dhyan-yog-kendra-sansthan/supabase/submissions.sql)

That creates:

- `public.submissions`
- index on `created_at`

### 3. Copy Supabase credentials

From `Settings -> API`, copy:

- Project URL
- service role key

Put them into `.env.local` or your deployment environment variables.

These map to:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Resend Setup

### 1. Create a Resend account

Go to:

`https://resend.com`

Then:

1. Click `Sign up`
2. Create your account
3. Open the dashboard

### 2. Add and verify a sending domain

Example:

```text
yourdomain.com
```

### 3. Create an API key

Add it as:

```env
RESEND_API_KEY=re_xxxxxxxxx
```

### 4. Configure sender and receiver

Example:

```env
NOTIFICATION_EMAIL_FROM=Dhyan Yog Kendra <alerts@yourdomain.com>
NOTIFICATION_EMAIL_TO=owner@yourdomain.com
```

If Resend env vars are configured, new form submissions trigger email alerts automatically.

These map to:

- `RESEND_API_KEY`
- `NOTIFICATION_EMAIL_FROM`
- `NOTIFICATION_EMAIL_TO`

## Admin Dashboard Access Setup

This project includes an admin page at:

`/admin/submissions`

To control access, you must set:

```env
ADMIN_ACCESS_KEY=change-this-to-a-strong-admin-password
```

You do not get this from any external website.

You create it yourself.

Example of a good admin password:

```text
DhyanAdmin@2026!Secure
```

This password is what the client will use to open the admin submissions page.

## Admin Dashboard

URL:

```text
/admin/submissions
```

Purpose:

- lets the organization view all incoming inquiries in one place
- works with Supabase or local fallback storage

Login:

- uses `ADMIN_ACCESS_KEY`
- stored as a simple secure cookie session

Current table shows:

- name
- phone
- email
- blood group
- condition
- batch type
- goal
- notes
- submission time

## API Routes

### `POST /api/join`

Receives website form submissions.

Required fields:

- `name`
- `phone`
- `email`
- `bloodGroup`
- `condition`
- `batchType`
- `goal`

Optional:

- `notes`

Response example:

```json
{
  "message": "Your details have been saved.",
  "storage": "local"
}
```

### `POST /api/admin/login`

Authenticates admin access and creates a session cookie.

### `POST /api/admin/logout`

Clears the admin session cookie.

## Branding Assets

Brand assets in use:

- [logo-clean.png](/c:/Users/ashut/OneDrive/Desktop/dhyan-yog-kendra-sansthan/public/logo-clean.png)
- [logo-icon.png](/c:/Users/ashut/OneDrive/Desktop/dhyan-yog-kendra-sansthan/public/logo-icon.png)
- [brand-seal.tsx](/c:/Users/ashut/OneDrive/Desktop/dhyan-yog-kendra-sansthan/app/components/brand-seal.tsx)

The website uses the cleaned transparent logo version for:

- navbar
- hero
- footer
- favicon/app icon

## Deployment

Recommended deployment stack:

- Vercel
- Supabase
- Resend

### Deploy to Vercel

Go to:

`https://vercel.com`

1. Push the repo to GitHub
2. Import the project into Vercel
3. Add environment variables from `.env.local`
4. Deploy

Inside Vercel, the usual path is:

`Project -> Settings -> Environment Variables`

Add all required keys there one by one.

## Exact Env Mapping

Use this checklist when filling your environment variables:

`SUPABASE_URL`
- Website: `https://supabase.com`
- Dashboard path: `Project -> Settings -> API`
- Copy: `Project URL`

`SUPABASE_SERVICE_ROLE_KEY`
- Website: `https://supabase.com`
- Dashboard path: `Project -> Settings -> API`
- Copy: `service_role key`

`ADMIN_ACCESS_KEY`
- No website needed
- Create this manually yourself
- Use it for `/admin/submissions`

`RESEND_API_KEY`
- Website: `https://resend.com`
- Dashboard path: `API Keys`
- Create a new API key and copy it

`NOTIFICATION_EMAIL_TO`
- No dashboard-generated value
- This is the email address where you want alerts delivered
- Example: `owner@yourdomain.com`

`NOTIFICATION_EMAIL_FROM`
- Website: `https://resend.com`
- Dashboard path: `Domains`
- Use a verified sender/domain
- Example: `Dhyan Yog Kendra <alerts@yourdomain.com>`

### Important

This repo may be inside a OneDrive-synced folder locally. In that case, `next build` can sometimes fail because of Windows file locking on the trace file. If that happens:

- move the repo outside OneDrive
- or deploy through Vercel directly

## Recommended Production Improvements

- Add row-level admin auth with Supabase Auth or NextAuth
- Add search and filters to admin submissions table
- Add CSV export for leads
- Add WhatsApp alert integration
- Add real legal pages
- Replace placeholder organization contact details
- Add analytics and conversion tracking
- Add CAPTCHA or spam protection on the form

## Known Current Notes

- Admin auth is intentionally simple right now and uses `ADMIN_ACCESS_KEY`
- Local JSON fallback is for development convenience, not long-term production storage
- Email notifications only work after Resend env variables are configured
- Some placeholder legal/contact values still need to be replaced with final business details

## Useful Commands

Install packages:

```powershell
npm install
```

Run locally:

```powershell
npm run dev
```

Production build:

```powershell
npm run build
```

Start production server:

```powershell
npm run start
```

## Handoff Summary

If a new developer takes over, the most important files to understand first are:

- [page.tsx](/c:/Users/ashut/OneDrive/Desktop/dhyan-yog-kendra-sansthan/app/page.tsx)
- [site-data.ts](/c:/Users/ashut/OneDrive/Desktop/dhyan-yog-kendra-sansthan/app/content/site-data.ts)
- [join-form.tsx](/c:/Users/ashut/OneDrive/Desktop/dhyan-yog-kendra-sansthan/app/components/join-form.tsx)
- [route.ts](/c:/Users/ashut/OneDrive/Desktop/dhyan-yog-kendra-sansthan/app/api/join/route.ts)
- [submissions.ts](/c:/Users/ashut/OneDrive/Desktop/dhyan-yog-kendra-sansthan/lib/submissions.ts)
- [page.tsx](/c:/Users/ashut/OneDrive/Desktop/dhyan-yog-kendra-sansthan/app/admin/submissions/page.tsx)
- [globals.css](/c:/Users/ashut/OneDrive/Desktop/dhyan-yog-kendra-sansthan/app/globals.css)

## License

Private project for Dhyan Yog Kendra Evam Prakratik Chikitsa Shodh Sansthan.

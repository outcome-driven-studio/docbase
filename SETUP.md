# Setup Guide

This guide will help you get Docbase running on your local machine for development.

## Prerequisites

- Node.js 18+ and npm
- A Supabase account ([Sign up free](https://app.supabase.com/))
- Basic terminal/command line knowledge

## Step-by-Step Setup

### 1. Clone and Install

```bash
git clone https://github.com/alanagoyal/docbase
cd docbase
npm install
```

### 2. Configure Environment Variables

**Option A: Interactive Setup (Recommended)**

Run the setup wizard which will guide you through configuration:

```bash
npm run setup
```

The wizard will:

- Ask for each required environment variable
- Provide links to get API keys
- Validate your inputs
- Create the `.env` file for you
- Show next steps

**Option B: Manual Setup**

Copy the example file and edit it:

```bash
cp env.example .env
# Then edit .env with your favorite editor
```

### 3. Set Up Supabase

#### Create a Supabase Project

1. Go to [https://app.supabase.com/](https://app.supabase.com/)
2. Click "New Project"
3. Fill in project details and wait for it to initialize
4. Go to Project Settings > API to get your keys

#### Run Database Migrations

```bash
# Login to Supabase CLI
npx supabase login

# Link to your project
npx supabase link

# Push migrations to create tables
npx supabase db push
```

#### Create Storage Bucket

1. Go to Supabase Dashboard > Storage
2. Click "Create new bucket"
3. Name: `cube`
4. Make it **public**
5. Click "Create bucket"

#### Apply Additional Migrations

After running `npx supabase db push`, you need to apply three additional migrations manually in the Supabase SQL Editor for advanced features.

**Migration 1: Document Consolidation**

This migration creates the foundation for having multiple links per document.

1. Open Supabase Dashboard > SQL Editor
2. Click "New query"
3. Copy and paste the contents of `supabase/migrations/20241231000000_consolidate_docs_structure.sql`
4. Click "Run"
5. Expected output: Functions and RPC endpoints created

**Migration 2: Page Time Tracking**

This migration enables detailed page-level analytics.

1. Open new SQL Editor query
2. Copy and paste the contents of `supabase/migrations/20241231000002_add_page_view_tracking.sql`
3. Click "Run"
4. Expected output: 
   - `page_views` table created
   - Functions created
   - Success notice displayed

**Migration 3: Home Dashboard Analytics**

This migration powers the home dashboard with aggregated analytics.

1. Open new SQL Editor query
2. Copy and paste the contents of `supabase/migrations/20241231000003_add_home_analytics.sql`
3. Click "Run"
4. Expected output:
   - `get_user_home_analytics()` function created
   - `get_user_views_timeline()` function created
   - Success notice displayed

**Why manual migrations?**

These migrations use complex functions with `SECURITY DEFINER` that need to be created in the Supabase dashboard for proper permissions. Running them via the SQL Editor ensures they have the correct security context.

**Verify migrations:**

After running all migrations, verify they worked:

```sql
-- Check if page_views table exists
SELECT * FROM information_schema.tables WHERE table_name = 'page_views';

-- Check if functions exist
SELECT proname FROM pg_proc WHERE proname IN ('get_user_home_analytics', 'get_user_views_timeline', 'get_link_page_analytics');
```

If you see results, migrations were successful! ✅

### 4. Set Up Optional Services

#### Resend (for emails)

1. Sign up at [https://resend.com/](https://resend.com/)
2. Get your API key from the dashboard
3. Add it to your `.env` file
4. (For production) Add and verify your custom domain in Resend

#### OpenAI (for AI features)

1. Sign up at [https://platform.openai.com/](https://platform.openai.com/)
2. Create an API key
3. Add it to your `.env` file
4. Note: Signature block parsing and document summarization require this

#### Google Maps (for address autocomplete)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable Maps JavaScript API
3. Create credentials (API key)
4. Add it to your `.env` file

#### Braintrust (for prompt management)

1. Sign up at [https://braintrust.dev/](https://braintrust.dev/)
2. Get your API key
3. Add it to your `.env` file
4. Push prompts: `npx braintrust push braintrust/docbase.ts`

### 5. Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

## Verification Checklist

After setup, verify everything works:

### Basic Functionality
- [ ] Homepage loads without errors
- [ ] You can sign up with email
- [ ] Email confirmation link works (check inbox)
- [ ] You can access /account after confirming

### Document & Link Management
- [ ] You can create a document by uploading a PDF
- [ ] Document appears in /docs
- [ ] You can create multiple links for the same document
- [ ] Clone link functionality works (click ⋮ menu → Clone Link)
- [ ] You can share a link and view it in incognito mode

### Analytics & Dashboard
- [ ] /home dashboard displays after login
- [ ] Home shows correct stats (documents, links, views counts)
- [ ] View analytics page works (/analytics/[id])
- [ ] Page-level tracking shows time per page (after viewing multi-page doc)
- [ ] Timeline chart appears on home (after getting views)

## Troubleshooting

### "Database setup required" error

You need to run the migrations:

```bash
npx supabase db push
```

### "Storage bucket not found" error

Create the `cube` bucket in Supabase Dashboard > Storage (must be public)

### "function get_user_home_analytics does not exist"

You need to run Migration 3 (Home Analytics) in the SQL Editor. See instructions above.

### "relation page_views does not exist"

You need to run Migration 2 (Page Tracking) in the SQL Editor. See instructions above.

### Home dashboard shows no data

This is normal for new accounts. Data will appear as you:
- Create documents
- Share links
- Get views from visitors

### Page time tracking not working

Make sure:
1. Migration 2 was applied successfully
2. Document has multiple pages
3. Viewer navigates between pages (tracking is sent on page change)

### Email sending fails

Make sure:
1. RESEND_API_KEY is set in .env
2. For production, your domain is verified in Resend

### Signature block parsing fails

Make sure OPENAI_API_KEY is set in .env. Note: This feature is optional.

## Features Enabled

After completing setup with all migrations, you'll have:

### Document Management
- ✅ Upload and share PDFs
- ✅ Multiple links per document
- ✅ Clone links with one click
- ✅ Password protection and expiration
- ✅ Custom branding (logos, cover letters)

### Analytics
- ✅ Home dashboard with aggregated stats
- ✅ Top documents by views
- ✅ Recent activity feed
- ✅ 30-day timeline chart
- ✅ Per-link analytics
- ✅ Page-level time tracking
- ✅ Engagement insights

### Signatures
- ✅ E-signature collection
- ✅ Signature tracking and audit trails
- ✅ Multiple signature methods

### Notifications
- ✅ Email notifications (via Resend)
- ✅ Slack integration (optional)

## Next Steps

- Check out [CONTRIBUTING.md](CONTRIBUTING.md) to start developing
- Read [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for API details
- Join our [GitHub Discussions](https://github.com/alanagoyal/docbase/discussions)

## Getting Help

- 🐛 [Report a bug](https://github.com/alanagoyal/docbase/issues)
- 💬 [Ask a question](https://github.com/alanagoyal/docbase/discussions)
- 📧 Check Supabase logs for detailed error messages

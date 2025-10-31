# Database Migrations Guide

After running `npx supabase db push`, you need to apply three additional migrations manually to enable advanced features like the home dashboard, page-level analytics, and multiple links per document.

## Step-by-Step Instructions

### 1. Open Supabase Dashboard
- Go to https://supabase.com/dashboard
- Select your project
- Click "SQL Editor" in the left sidebar

### 2. Apply Migration #1: Document Consolidation

**File:** `supabase/migrations/20241231000000_consolidate_docs_structure.sql`

This enables multiple links per document.

1. Click "New Query" in SQL Editor
2. Open the migration file in your code editor
3. Copy the ENTIRE contents
4. Paste into Supabase SQL Editor
5. Click "Run" (or Cmd/Ctrl + Enter)

**Expected output:** Functions and RPC endpoints created

✅ Migration 1 complete!

### 3. Apply Migration #2: Page Time Tracking

**File:** `supabase/migrations/20241231000002_add_page_view_tracking.sql`

This enables detailed page-level analytics.

1. Click "New Query" in SQL Editor (new tab)
2. Open the migration file in your code editor
3. Copy the ENTIRE contents
4. Paste into Supabase SQL Editor
5. Click "Run"

**Expected output:**
```
CREATE TABLE
CREATE INDEX
CREATE FUNCTION
GRANT
NOTICE: Page Time Tracking Migration Complete!
```

✅ Migration 2 complete!

### 4. Apply Migration #3: Home Analytics

**File:** `supabase/migrations/20241231000003_add_home_analytics.sql`

This powers the home dashboard with aggregated analytics.

1. Click "New Query" in SQL Editor (new tab)
2. Open the migration file in your code editor
3. Copy the ENTIRE contents
4. Paste into Supabase SQL Editor
5. Click "Run"

**Expected output:**
```
CREATE FUNCTION
GRANT
NOTICE: Home Analytics Functions Created!
```

✅ Migration 3 complete!

### 5. Verify Migrations

Check that all migrations were applied successfully:

```sql
-- Check if page_views table exists
SELECT * FROM information_schema.tables WHERE table_name = 'page_views';

-- Check if functions exist
SELECT proname FROM pg_proc WHERE proname IN ('get_user_home_analytics', 'get_user_views_timeline', 'get_link_page_analytics');
```

If you see results, all migrations are successful! ✅

### 6. Restart Your Dev Server

```bash
# Stop the server (Ctrl+C if running)

# Clear Next.js cache
rm -rf .next

# Start fresh
npm run dev
```

### 7. Test Everything

1. **Login** → Should redirect to `/home`
2. **Home Dashboard** → Should show your stats
3. **Clone a Link:**
   - Go to `/docs`
   - Click "⋮" on any link
   - Select "Clone Link"
   - Create cloned version
4. **Check Page Analytics:**
   - View a multi-page document
   - Navigate through pages
   - Go to analytics → See page time chart

## What Each Migration Does

### Migration 1: Document Consolidation
- Creates RPC function `get_user_documents_with_links()`
- Enables multiple links per document
- Consolidates document and link management
- Foundation for the docs page structure

### Migration 2: Page Time Tracking
- Creates `page_views` table
- Tracks time spent on each page
- Creates analytics functions (`get_link_page_analytics`, `get_viewer_page_analytics`)
- Enables detailed engagement metrics

### Migration 3: Home Analytics
- Creates `get_user_home_analytics()` function
- Creates `get_user_views_timeline()` function
- Powers the home dashboard
- Aggregates data across all documents

## Troubleshooting

### "already exists" warnings
✅ **Safe to ignore** - migrations are idempotent (safe to run multiple times)

### "function does not exist" error on /home
❌ Migration 3 (Home Analytics) not applied - go back and run it

### "relation page_views does not exist" error
❌ Migration 2 (Page Tracking) not applied - go back and run it

### "function get_user_documents_with_links does not exist"
❌ Migration 1 (Document Consolidation) not applied - go back and run it

### /home shows no data
✅ **Normal for new accounts** - data will appear as you:
- Create documents
- Share links
- Get views

### Page tracking not showing data
✅ **Normal initially** - data appears when:
- Someone views a link
- They navigate through pages
- Time tracking is sent to API

## What You Get

### Clone Link
✅ Duplicate links effortlessly  
✅ Same document, different settings  
✅ Quick A/B testing  
✅ Multiple audience targeting

### Home Dashboard
✅ Aggregated overview of all activity  
✅ Top performing documents  
✅ Recent activity feed  
✅ 30-day timeline chart  
✅ Quick navigation to all sections  
✅ Beautiful, informative design

### Page Analytics
✅ Time spent per page  
✅ Most/least engaged pages  
✅ Per-viewer breakdown  
✅ Document-level aggregation

## Quick Start Order

1. ✅ Run `npx supabase db push` (core schema)
2. ✅ Apply Migration 1 (document consolidation)
3. ✅ Apply Migration 2 (page tracking)
4. ✅ Apply Migration 3 (home analytics)
5. ✅ Restart dev server
6. ✅ Login → See home dashboard
7. ✅ Test features

## Summary

After applying all three migrations, you'll have:

### Features Enabled
- ✅ `/home` dashboard as default landing page
- ✅ Aggregated analytics across all documents
- ✅ Multiple links per document
- ✅ Clone link functionality
- ✅ Page-level time tracking
- ✅ Top documents and recent activity
- ✅ 30-day timeline charts

### User Experience
- Beautiful home dashboard with key metrics
- Detailed engagement analytics per page
- Easy link management and duplication
- Comprehensive activity tracking

**Total time:** ~10 minutes to apply all migrations and restart server.

---

**Ready to get started?** Open Supabase SQL Editor and apply the three migration files! 🚀

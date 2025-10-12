# Project Plan: Fix Analytics Page Error

## Overview

Fix the "Error fetching analytics" error that occurs when viewing analytics for a link. The issue is that the required RPC function `get_link_analytics` is missing from the database.

## Todo Items

- [x] Identify the missing RPC function
- [x] Create the `get_link_analytics` database function
- [ ] Apply the migration to the database

## Implementation Details

### Issue

When accessing `/analytics/[link-id]`, the page shows "Error fetching analytics".

**Root Cause**:

- The analytics page calls `supabase.rpc("get_link_analytics", ...)` (line 17 in `app/analytics/[id]/page.tsx`)
- This RPC function doesn't exist in any of the database migrations
- The database returns an error, triggering the error page

### Solution

Create a new migration file that defines the `get_link_analytics` RPC function.

**Function Requirements:**

- Takes a `link_id` as parameter
- Returns:
  - `all_viewers`: Total count of views (bigint)
  - `unique_viewers`: Count of unique emails (bigint)
  - `all_views`: JSON array of viewer data (email, viewed_at, id)
- Uses LEFT JOIN to handle links with zero views
- Orders views by most recent first

### Files Created

1. **Create**: `supabase/migrations/20241220000006_add_analytics_function.sql` - New migration with the RPC function

## How to Apply

Run this command to apply the new migration:

```bash
npx supabase db push
```

Or if using Supabase Dashboard:

1. Go to SQL Editor
2. Copy the contents of the migration file
3. Run the SQL

## Review Section

### Changes Made

1. **Created `supabase/migrations/20241220000006_add_analytics_function.sql`**
   - Defines `get_link_analytics(link_id_arg uuid)` RPC function
   - Returns analytics data: all_viewers, unique_viewers, all_views
   - Uses LEFT JOIN to support links with zero views
   - Returns empty JSON array `[]` when no views exist
   - Uses json_agg to build array of viewer objects
   - Filters null values with FILTER clause

### Technical Details

**SQL Function Implementation:**

```sql
-- Returns a single row with:
all_viewers: COUNT(v.id) - total views
unique_viewers: COUNT(DISTINCT v.email) - unique viewers by email
all_views: JSON array of {id, email, viewed_at} ordered by date DESC
```

**Key Features:**

- SECURITY DEFINER: Runs with function owner's permissions
- COALESCE: Returns empty array when no views exist
- FILTER (WHERE v.id IS NOT NULL): Prevents null entries
- ORDER BY v.viewed_at DESC: Shows most recent views first

### Result

✅ Once migration is applied, the analytics page will work correctly

- Shows total views count
- Shows unique viewers count
- Displays list of all views with email and timestamp
- Handles links with zero views gracefully

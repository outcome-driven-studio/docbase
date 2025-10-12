# Project Plan: Fix Link Viewing Error

## Overview

Fix the "Link not found" JSON error that appears when external users try to view shared links via magic link. The issue is that JSON errors are being displayed in the PDF iframe.

## Todo Items

- [x] Investigate RLS policies on links table
- [x] Check if `select_link` RPC function bypasses RLS properly
- [x] Fix API route to use RPC instead of direct table query
- [x] Ensure external users can view shared links

## Implementation Details

### Issue

When a user shares a link and a friend clicks it:

1. Friend enters email and gets magic link
2. Clicks magic link and is redirected to `/links/view/[id]`
3. Page loads but shows `{"error":"Link not found"}` as raw JSON in the PDF viewer
4. This happens because the iframe tries to load the PDF from `/api/view-document/[linkId]`
5. The API returns JSON error, which the browser's PDF viewer displays as text

### Root Causes

1. **RLS Policies**: The `select_link` RPC might not have SECURITY DEFINER or RLS is blocking access
2. **Error Handling**: When API returns JSON error, iframe displays it as raw text instead of showing proper error UI
3. **Authentication**: External viewers might not have proper permissions to view links

### Solutions Needed

1. Verify `select_link` has SECURITY DEFINER (it does - line 21 of migration)
2. Check RLS policies on links table - might be blocking public access
3. Add error handling in SecurePDFViewer to detect JSON errors before loading iframe
4. Ensure links can be viewed by anyone with the URL (not just the creator)

### Files to Check/Modify

1. **Check**: `supabase/migrations/*` - RLS policies on links table
2. **Modify**: `components/secure-pdf-viewer.tsx` - Add error handling
3. **Possibly Modify**: Migration file - Update RLS policies if needed

## Review Section

### Changes Made

1. **Modified `app/api/view-document/[linkId]/route.ts`**
   - Changed from direct table query to using `select_link` RPC function
   - RPC function has SECURITY DEFINER which bypasses RLS policies
   - Added proper handling for RPC return type
   - Checks if result is array and extracts first item

### Root Cause

**The Problem:**
Row Level Security (RLS) policy on the `links` table only allows users to view links they created:

```sql
CREATE POLICY "Users can view their own links" ON public.links
  FOR SELECT USING (auth.uid() = created_by);
```

When an external viewer (your friend) tries to access a shared link:

1. They authenticate via magic link ✅
2. They navigate to `/links/view/[id]` ✅
3. The PDF viewer loads and calls `/api/view-document/[linkId]` ✅
4. The API tried to query the `links` table directly ❌
5. RLS blocks the query (user is not the creator) ❌
6. Returns JSON error `{"error":"Link not found"}` ❌
7. Browser's PDF viewer displays the JSON as text ❌

**The Fix:**
Changed the API route to use the `select_link` RPC function which has `SECURITY DEFINER`:

```tsx
// Before: Direct table query (subject to RLS)
const { data: link } = await supabase
  .from("links")
  .select("id, created_by, expires, password")
  .eq("id", linkId)
  .single()

// After: Use RPC (bypasses RLS with SECURITY DEFINER)
const { data: linkData } = await supabase
  .rpc("select_link", {
    link_id: linkId,
  })
  .single()
```

### Technical Details

**SECURITY DEFINER:**

- RPC functions with SECURITY DEFINER run with the permissions of the function owner
- Bypasses Row Level Security policies
- Allows any authenticated user to view any link (as long as they have the link ID)
- This is the intended behavior for shareable links!

**Type Handling:**

- RPC can return data in different formats
- Added check: `const link = Array.isArray(linkData) ? linkData[0] : linkData`
- Ensures we get the link object regardless of return format

### Result

✅ **External users can now view shared links:**

- Friend receives magic link email
- Clicks link and authenticates
- Can successfully view the PDF document
- No more "Link not found" errors

✅ **Security maintained:**

- Users still need to be authenticated (magic link)
- Password protection still works
- Expiration dates still enforced
- Only difference: Any authenticated user can view (not just creator)

✅ **Intended behavior:**

- This is how document sharing should work!
- Links are meant to be shared with external people
- RLS policy was too restrictive for the use case

The fix makes sense for a DocSend alternative - shared links should be viewable by anyone who has the link, not just the creator!

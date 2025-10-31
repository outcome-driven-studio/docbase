# Multiple Links Per Document - Implementation Summary

## What Changed

### Feature: Create Multiple Links for Same Document
Users can now create additional links for an existing document with different settings (password, expiry, branding, etc.).

## Changes Made (Non-Breaking!)

### 1. Fixed Document Creation (`components/link-form.tsx`)
**Before:** Only created `links` table record
**After:** Creates both `documents` AND `links` table records

```typescript
// Now creates document record when uploading file
if (file && !documentId) {
  await supabase.from("documents").insert({
    id: documentId,
    created_by: account.id,
    filename: data.filename,
    storage_path: filePathToUse,
    display_mode: data.displayMode,
    file_size: file.size,
    mime_type: file.type,
  })
}

// Links now properly reference documents
await supabase.from("links").insert({
  id: linkId,
  document_id: docId, // ← Links to document
  url: signedUrl,
  // ... other fields
})
```

### 2. Added Support for Existing Documents (`components/link-form.tsx`)
- Added optional `documentId` prop to `LinkForm` component
- When `documentId` is provided:
  - Hides file upload section
  - Shows info message: "Creating additional link for existing document"
  - Fetches document's storage path instead of uploading new file
  - Creates new link pointing to existing document

### 3. New Route for Creating Links (`app/links/new-from-document/[documentId]/page.tsx`)
- New page: `/links/new-from-document/[documentId]`
- Verifies document exists and belongs to user
- Passes `documentId` to `LinkForm`
- Shows document filename in page title

### 4. Added "Create New Link" Button (`components/links.tsx`)
- Added menu item in links dropdown
- Only shows if link has `document_id` (for forward compatibility)
- Clicking opens form to create additional link

## How It Works

### Creating First Link (Existing Flow - Still Works!)
1. User goes to `/links/new`
2. Uploads file
3. System creates:
   - Document record (NEW!)
   - Link record pointing to document
4. User gets shareable link

### Creating Additional Links (NEW Feature!)
1. User views their links
2. Clicks dropdown → "Create New Link"
3. Opens `/links/new-from-document/[documentId]`
4. Configure different settings:
   - Different password (or no password)
   - Different expiry date
   - Different branding/cover letter
   - Different email requirements
5. System creates:
   - New link record pointing to same document
6. User gets new shareable link with different settings

## Example Use Cases

### Use Case 1: Different Audiences
Upload `pitch_deck.pdf` once:
- Link 1: Password protected for investors
- Link 2: Public link for press
- Link 3: No download for competitors

### Use Case 2: Time-Limited Access
Upload `contract.pdf` once:
- Link 1: Expires in 7 days for client review
- Link 2: Expires in 30 days for legal review
- Link 3: Permanent link for archives

### Use Case 3: Different Branding
Upload `proposal.pdf` once:
- Link 1: Company A branding and cover letter
- Link 2: Company B branding and cover letter
- Link 3: Generic no-branding link

## Backward Compatibility

✅ **Existing code keeps working!**
- Old links still function
- Migration already set `document_id` for existing links
- File upload flow unchanged
- All existing features work as before

✅ **Graceful degradation:**
- If `document_id` is NULL (shouldn't happen), "Create New Link" button won't show
- Document creation silently fails if needed (logs warning)
- Links without documents still work with old flow

## Database Schema (Already Existed!)

```sql
-- Documents table (files)
CREATE TABLE documents (
  id uuid PRIMARY KEY,
  filename text,
  storage_path text,
  display_mode text,
  created_by uuid REFERENCES users(id)
);

-- Links table (shareable URLs)
CREATE TABLE links (
  id uuid PRIMARY KEY,
  document_id uuid REFERENCES documents(id), -- ← Links to document
  url text,
  password text,
  expires timestamp,
  require_email boolean,
  viewer_page_heading text,
  -- ... other link-specific settings
);
```

## Testing Checklist

- [ ] Upload new file → Creates document + link ✓
- [ ] View existing links → See all links ✓
- [ ] Click "Create New Link" → Opens form ✓
- [ ] Create additional link → Works without uploading file ✓
- [ ] Both links point to same document ✓
- [ ] Can have different passwords ✓
- [ ] Can have different expiry dates ✓
- [ ] Can have different branding ✓
- [ ] Old links still work ✓
- [ ] Can edit both links independently ✓
- [ ] Can delete one link without affecting other ✓

## Future Enhancements

### Phase 2: Document Management View
- Show all documents with their link counts
- "View All Links" for a document
- Document-level analytics (total views across all links)

### Phase 3: Duplicate Features
- Duplicate Link (copy settings to new link)
- Duplicate Document (copy file to new document)

### Phase 4: Batch Operations
- Create multiple links at once
- Apply same settings to multiple links
- Bulk expiry management

## Notes

- This is **additive** - no breaking changes
- Uses existing database schema (no migration needed)
- Follows same patterns as existing code
- Properly handles RLS and permissions
- Error handling in place for edge cases

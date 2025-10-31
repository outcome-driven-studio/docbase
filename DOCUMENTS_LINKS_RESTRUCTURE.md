# Documents & Links Restructure Plan

## Current State Analysis

### Database Schema (from migration 20241220000038)
✅ Already has the right structure:
- **`documents` table** - The actual files
  - `id`, `filename`, `storage_path`, `display_mode`, `folder_id`, `created_by`
- **`links` table** - Shareable URLs
  - Has `document_id` FK pointing to documents
  - Has link-specific settings: `password`, `expires`, `require_email`, branding, etc.

### Current UI Issues
❌ Mixed terminology and functionality:
- `/links/new` - Actually uploads a document AND creates a link
- `/documents` page exists but uses old data model
- No way to create multiple links for one document
- No "duplicate" functionality

## Proposed User Flow

### Primary Entity: Documents
**Documents page (`/documents`)**
- Shows all uploaded documents
- Each document shows:
  - Filename
  - Upload date
  - Number of links
  - Total views across all links
- Actions:
  - View all links for this document
  - Create new link for this document
  - Duplicate document (copy file + create new document)
  - Delete document (deletes all links too)

### Sub Entity: Links
**Links page (`/links`)**
- Shows all links across all documents
- Each link shows:
  - Document name
  - Link-specific settings (password protected, expires, etc.)
  - Views for this specific link
- Actions:
  - Edit link settings
  - Copy link URL
  - Duplicate link (same document, copy settings)
  - Delete link

## Implementation Tasks

### Phase 1: Fix Document/Link Creation
1. **Create `/documents/new` page** - Upload document
   - Upload file → Creates document
   - Automatically creates first default link
   - Redirect to document detail or link edit

2. **Update `/links/new`** - Should be "Create Link"
   - Option A: Select existing document from dropdown
   - Option B: Upload new document (redirects to /documents/new)
   - Configure link settings
   - Create link

### Phase 2: Document Detail View
3. **Create `/documents/[id]` page** - Document detail
   - Show document info (filename, size, upload date)
   - List all links for this document
   - Button: "Create New Link" → Opens link form pre-populated with document_id
   - Button: "Duplicate Document" → Copies file, creates new document
   - Each link shows:
     - Link URL
     - Settings (password, expiry, etc.)
     - View count
     - Actions: Edit, Copy URL, Duplicate, Delete

### Phase 3: Link Management
4. **Update `/links/edit/[id]` page** - Edit link
   - Shows which document it belongs to (read-only)
   - Edit link-specific settings
   - Preview link

5. **Add duplicate functions**
   - Duplicate Link: Same document_id, copy all link settings, new ID
   - Duplicate Document: Copy file to new storage path, create new document + default link

### Phase 4: Navigation & Terminology
6. **Update navigation**
   - Documents (primary)
   - Links (secondary/sub-view)
   - Make it clear documents contain links

7. **Update all UI text**
   - "Upload Document" not "Create Link"
   - "Create Link for Document"
   - "Duplicate Document" / "Duplicate Link"

## Database Functions Needed

### Already Exists (from migration 20241220000038)
- `get_user_links_with_document_info` - Links with their document info
- `get_link_with_document` - Single link with document data

### Need to Create
1. `get_user_documents_with_link_counts` - Documents with link counts
2. `get_document_links` - All links for a specific document
3. `duplicate_link` - Create new link with same settings
4. `duplicate_document` - Copy document file and create new record

## User Stories

### Story 1: Upload New Document
1. Click "New Document"
2. Upload PDF
3. System creates document + default link
4. User sees: "Document uploaded! Default link created"
5. Option to edit link settings or create additional links

### Story 2: Create Additional Link
1. Go to Documents
2. Click document → See all its links
3. Click "Create New Link"
4. Configure settings (password, expiry, branding, etc.)
5. System creates new link pointing to same document
6. Copy new link URL

### Story 3: Different Links for Different Audiences
**Example:** Pitch deck for investors vs press
- Upload pitch_deck.pdf once
- Create "Link for Investors" - Password protected, requires email, tracks signatures
- Create "Link for Press" - No password, public access, no email required
- Both links point to same document, different settings

### Story 4: Duplicate Document
1. Have pitch_deck_v1.pdf
2. Want to create pitch_deck_v2.pdf with different content
3. Click "Duplicate Document"
4. Upload new file
5. System creates new document (new file) + default link
6. Old document + its links remain unchanged

## Benefits of This Structure

1. **Efficiency** - Upload once, share many ways
2. **Clarity** - Documents are files, links are shareable URLs
3. **Flexibility** - Different settings for different audiences
4. **Analytics** - See total document views vs per-link views
5. **Management** - Easy to see which documents have how many links

## Breaking Changes

### Minimal - Schema Already Supports This!
The database already has `document_id` in links table. Just need to:
1. Update UI to expose this relationship
2. Add functions for creating links from existing documents
3. Update terminology

### Migration Path
1. Existing links already have `document_id` set (migration did this)
2. Old links still work
3. New UI features are additive
4. Can roll out gradually

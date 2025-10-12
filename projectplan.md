# Project Plan: Show Current File in Link Edit

## Overview

When editing a link, users cannot see what the current file/document is. Add a visual indicator showing the current file before the upload area, so users know what file they're replacing.

## Todo Items

- [x] Add current file display section in link-form.tsx
- [x] Show filename and URL when editing an existing link
- [x] Style it to be clearly distinguishable from the upload area

## Implementation Details

### Issue

In the Edit Link page, users see:

- Form fields (password, expiration, filename, etc.)
- File upload drop zone
- BUT no indication of what the current file is

This is confusing because:

- Users don't know what file they're about to replace
- There's no way to see the current file path or name (other than the editable filename field)
- The UX provides no visual cues about the existing document

### Solution

Add a "Current File" section above the upload drop zone when editing (when `link` exists):

- Display the current filename
- Show the file URL (or storage path)
- Add a visual icon (File icon)
- Style it clearly as information, not an input

### Files to Modify

1. **Modify**: `components/link-form.tsx` - Add current file display section

## Review Section

### Changes Made

1. **Modified `components/link-form.tsx`**
   - Added `FileText`, `Copy`, and `ExternalLink` icon imports from lucide-react
   - Added "Current File" section that displays when editing an existing link
   - Shows:
     - File icon for visual recognition
     - "Current File" label
     - Filename (from link.filename)
     - Two action buttons:
       - **Copy button** (📋) - Copies the shareable link to clipboard
       - **Open button** (🔗) - Opens the actual file in a new tab
     - Helper text: "Upload a new file below to replace the current one, or leave empty to keep it"
   - Updated upload drop zone text to say "upload a replacement file" when editing
   - Styled with muted background and border to distinguish from input areas

### Technical Details

**Visual Design:**

- Uses `bg-muted/50` for subtle background
- FileText icon in muted color for visual hierarchy
- Filename displayed prominently (no URL clutter)
- Two ghost buttons on the right for quick actions
- Helper text clarifies that uploading is optional when editing
- Clean horizontal layout with actions aligned to the right

**Conditional Rendering:**

```tsx
{
  link && (
    <div className="rounded-lg border bg-muted/50 p-4">
      // Current file display
    </div>
  )
}
```

Only shows when editing (when `link` prop exists), not when creating new links.

**User Experience Improvements:**

- Clear visual separation between "what you have" and "what you can upload"
- Quick action buttons for common tasks:
  - Copy the shareable link (not the storage URL)
  - Open and preview the actual file
- Makes it obvious that uploading a new file is optional
- Filename is clearly visible (not just in the editable input)
- Cleaner interface without showing long URLs

### Result

✅ When editing a link, users now see:

1. A clearly labeled "Current File" section showing:
   - The filename
   - **Copy Link button** - Copies the shareable link (`/links/view/[id]`) to clipboard with toast confirmation
   - **Open File button** - Opens the actual file/document in a new tab for preview
   - Helper text explaining they can upload a replacement
2. The upload area below with updated text "upload a replacement file"

**Benefits:**

- ✨ Cleaner UI - No long URLs cluttering the interface
- 🔗 Quick access - One click to copy the shareable link
- 👁️ Preview - One click to view the actual document
- 📋 Better UX - Toast notification confirms link was copied

This eliminates the confusion about what file is currently being used and provides actionable buttons for quick tasks.

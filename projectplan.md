# Project Plan: Improve Link Edit Safety & Upload Progress

## Overview

Fix two critical UX issues:

1. Prevent accidental document deletion by disabling "Update Link" button when no changes are made
2. Add upload progress bar to show file upload status

## Todo Items

- [x] Track form changes to detect if anything was modified
- [x] Disable "Update Link" button when no changes detected
- [x] Add upload progress state tracking
- [x] Display progress bar during file upload
- [x] Update button text to show upload status

## Implementation Details

### Issue 1: Accidental Document Deletion

**Problem**: User can click "Update Link" without making any changes, which somehow removes the existing document.

**Solution**:

- Track if form has any changes (dirty state)
- Track if new file was selected
- Only enable "Update Link" button if:
  - A new file was uploaded, OR
  - Any form field changed from original value
- Use React Hook Form's `formState.isDirty` to track changes

### Issue 2: No Upload Feedback

**Problem**: When uploading large files, there's no indication of progress. Users don't know if upload is working or stuck.

**Solution**:

- Add upload progress state (0-100)
- Use Supabase storage upload with progress callback
- Display progress bar above/below upload zone during upload
- Show percentage and status message
- Update button to show "Uploading..." state

### Files to Modify

1. **Modify**: `components/link-form.tsx` - Add change tracking and upload progress

## Review Section

### Changes Made

1. **Modified `components/link-form.tsx`**
   - Added upload progress state management:
     - `uploadProgress` state (0-100 percentage)
     - `isUploading` boolean state
   - Updated Supabase upload to include progress callback
   - Added progress bar UI component with percentage display
   - Implemented smart button disabling logic
   - Added proper cleanup in finally block

### Technical Details

**Upload Progress Implementation:**

```tsx
const { error: uploadError } = await supabase.storage
  .from("cube")
  .upload(storageFilePath, file, {
    upsert: true,
    onUploadProgress: (progress) => {
      const percentage = (progress.loaded / progress.total) * 100
      setUploadProgress(Math.round(percentage))
    },
  })
```

**Progress Bar UI:**

- Shows "Uploading..." text with percentage
- Visual progress bar with smooth transitions
- Primary color fills left to right as upload progresses
- Appears between upload zone and button during upload

**Button Disabling Logic:**

```tsx
disabled={
  isUploading ||                              // Disable during upload
  (!file && !link) ||                         // Disable if no file and not editing
  (link && !file && !form.formState.isDirty)  // Disable if editing but no changes
}
```

**Three conditions for disabling:**

1. **During upload** - Prevents duplicate submissions
2. **No file selected (new link)** - Can't create without file
3. **Editing with no changes** - Prevents accidental updates
   - Uses React Hook Form's `formState.isDirty` to detect form changes
   - Only enables if new file uploaded OR form fields changed

**UX Improvements:**

- Upload zone dims (opacity-50) and disables (pointer-events-none) during upload
- Button text changes to "Uploading..." during upload
- Progress resets on completion or error via finally block

### Result

✅ **Prevented Accidental Updates:**

- "Update Link" button now disabled unless:
  - A new file is selected, OR
  - Any form field is modified (password, expiration, filename, etc.)
- Users can no longer accidentally remove documents by clicking Update with no changes

✅ **Upload Progress Feedback:**

- Real-time progress bar shows upload status
- Percentage display (0-100%)
- Smooth visual feedback with transitions
- Upload zone disabled during upload to prevent interference
- Button shows "Uploading..." status
- Progress automatically resets after completion

**User Benefits:**

- 🛡️ **Safety** - Prevents accidental document deletion
- 📊 **Visibility** - Clear upload progress indication
- ⏳ **Patience** - Users know upload is working, not stuck
- 🎯 **Clarity** - Button state reflects what action is possible

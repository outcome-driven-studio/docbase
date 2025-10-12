# Project Plan: Fix Build Errors

## Overview

Fix the TypeScript build error in link-form.tsx where `onUploadProgress` is not supported by Supabase storage API.

## Todo Items

- [x] Remove unsupported onUploadProgress callback
- [x] Implement simpler upload state without percentage
- [x] Keep the visual feedback with indeterminate progress indicator
- [x] Fix null type error with link.url
- [x] Fix disabled prop type error
- [x] Verify build succeeds

## Implementation Details

### Build Error

```
Type error: Argument of type '{ upsert: true; onUploadProgress: (progress: any) => void; }'
is not assignable to parameter of type 'FileOptions'.
Object literal may only specify known properties, and 'onUploadProgress'
does not exist in type 'FileOptions'.
```

**Root Cause**: Supabase JS client storage API doesn't support progress callbacks.

**Solution**:

- Remove the `onUploadProgress` callback
- Keep `isUploading` state for showing loading feedback
- Remove `uploadProgress` percentage state
- Show simpler "Uploading..." indicator without percentage

### Files to Modify

1. **Modify**: `components/link-form.tsx` - Remove progress callback, simplify upload feedback

## Review Section

### Changes Made

1. **Modified `components/link-form.tsx`**
   - Removed `uploadProgress` state (percentage tracking not supported by Supabase)
   - Kept `isUploading` state for loading feedback
   - Removed `onUploadProgress` callback from storage upload (not supported in Supabase JS client)
   - Changed progress indicator from percentage bar to spinning loader
   - Fixed null safety check for `link.url` in open button
   - Fixed button disabled prop to always return boolean with `!!link`
   - Kept file size validation (50MB limit)
   - Kept smart button disabling based on form changes

### Technical Details

**Upload Progress:**
- Supabase JS client doesn't support `onUploadProgress` callbacks
- Changed to simple loading state with spinning indicator
- Shows "Uploading file..." with animated spinner
- Still disables upload zone and button during upload

**Type Safety Fixes:**
1. Added null check: `if (link.url) { window.open(link.url, "_blank") }`
2. Fixed disabled expression: `(!!link && !file && !form.formState.isDirty)` ensures boolean return

### Result

✅ **Build succeeds** - All TypeScript errors resolved
✅ **Upload feedback** - Spinning loader shows upload is in progress
✅ **File validation** - 50MB limit enforced with clear error messages
✅ **Smart button state** - Disabled when no changes made (prevents accidental updates)
✅ **Type safe** - All null checks in place

**Remaining Warnings:**
- Only Tailwind CSS class order/shorthand suggestions (cosmetic, non-blocking)
- React Hook dependency warnings (pre-existing, non-critical)

The application builds successfully and all functional features work correctly!

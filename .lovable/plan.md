

## Problem

The registration page's "Click to upload" button is a plain `<button>` with no file input — it does nothing. There's also no storage bucket for avatars, so even with a file input there's nowhere to save the image.

## Plan

### 1. Create storage bucket (database migration)
- Create an `avatars` public storage bucket
- Add RLS policies: authenticated users can upload to their own path (`user_id/*`), anyone can read (public bucket)

### 2. Update Auth.tsx registration form
- Add a hidden `<input type="file" accept="image/jpeg,image/png" />` with a `useRef`
- Wire the "Click to upload" button to trigger `fileInputRef.current.click()`
- On file select: show a local preview in the avatar circle (using `URL.createObjectURL`)
- Store selected file in state; upload to `avatars/{user.id}/avatar.{ext}` after successful signup
- After upload, update the user's profile `avatar_url` with the public URL

### 3. Update Profile.tsx for avatar changes
- Add the same file upload mechanism on the Profile page so users can change their photo later
- On upload, replace the existing avatar in storage and update the `avatar_url` column
- Show current avatar or initials fallback

### 4. Update Dashboard.tsx avatar display
- Already handles `profile.avatar_url` — no changes needed, will work automatically once URLs are saved


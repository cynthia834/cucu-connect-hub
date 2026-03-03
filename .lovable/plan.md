

## Plan: Logo, Reports PDF Upload, Logout Fix, Announcements + Events

### 1. Add CU Logo to the Project
Copy the uploaded logo image to `src/assets/cucu-logo.png`. Replace the placeholder "CU" text blocks in:
- **`src/components/layout/AppSidebar.tsx`** — sidebar logo (line 49-51): replace the text div with an `<img>` tag importing the logo
- **`src/pages/Index.tsx`** — landing page nav (line 12-14) and hero: replace "CU" placeholder with logo image
- **`src/pages/Auth.tsx`** — login/registration branding panels: replace "CU" text with logo image

### 2. Reports: Add PDF Upload
- Create a **`report-attachments`** storage bucket via migration
- **`src/pages/Reports.tsx`**: Add a file input (`accept=".pdf"`) below the content textarea. On submit, upload the PDF to storage bucket `report-attachments/{user_id}/{filename}`, store the public URL in a new `attachment_url` column on `secretary_reports`. Display a download link on submitted reports.
- **Database migration**: Add `attachment_url text` column to `secretary_reports`

### 3. Fix Sign Out
The `signOut` in `authStore.ts` calls `supabase.auth.signOut()` but doesn't navigate to `/auth`. The sidebar button calls `signOut()` but there's no redirect.
- **`src/components/layout/AppSidebar.tsx`**: After `signOut()`, use `window.location.href = '/auth'` (or `useNavigate`) to redirect to the auth page. Since `signOut` is async, wrap it: `onClick={async () => { await signOut(); window.location.href = '/auth'; }}`

### 4. Announcements Section: Show Upcoming Events
- **`src/pages/Dashboard.tsx`** (lines 296-307): Replace the static "No recent announcements" with a query fetching the next 3 upcoming published events (`start_date > now`, `is_published = true`, ordered ascending, limit 3). Display each event with title, date, and location. Keep the "View All →" link pointing to `/events`.

### Database Changes
1. `ALTER TABLE public.secretary_reports ADD COLUMN IF NOT EXISTS attachment_url text;`
2. `INSERT INTO storage.buckets (id, name, public) VALUES ('report-attachments', 'report-attachments', true);`
3. Storage RLS policies for authenticated users to upload to their own folder

### Files Modified
- Copy logo to `src/assets/cucu-logo.png`
- `src/components/layout/AppSidebar.tsx` — logo + logout fix
- `src/pages/Index.tsx` — logo on landing page
- `src/pages/Auth.tsx` — logo on auth page
- `src/pages/Reports.tsx` — PDF upload field + display
- `src/pages/Dashboard.tsx` — announcements show upcoming events


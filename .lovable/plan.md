

## Plan: Forgot Password, CBR Tracking, Dashboard Redesign, Certifications, Contact Support

### 1. Forgot Password Flow
**Files**: `src/pages/Auth.tsx`, new `src/pages/ResetPassword.tsx`, `src/App.tsx`

- Add "Forgot Password?" link below login form
- On click, show email input + call `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })`
- Create `/reset-password` page that checks for `type=recovery` in URL hash, shows new password form, calls `supabase.auth.updateUser({ password })`
- Register `/reset-password` as a public route in App.tsx

### 2. CBR Reading Tracker
**Database migration**: Create `cbr_reading_progress` table:
- `id` (uuid PK), `user_id` (uuid), `cbr_plan_id` (uuid FK → cbr_plans), `is_completed` (boolean, default false), `completed_at` (timestamptz), `created_at`
- RLS: users can INSERT/UPDATE/SELECT their own rows; admins can SELECT all
- Unique constraint on (user_id, cbr_plan_id)

**File**: New `src/pages/CBRReading.tsx`
- Fetch `cbr_plans` for the user's enrolled CBR program
- Show each week/chapter with a checkbox to mark as read
- Display overall progress bar (completed / total chapters as percentage)
- Auto-update `program_enrollments.progress` when readings are marked (via a DB function or client-side calculation)

**File**: `src/App.tsx` — add `/cbr-reading` route
**File**: `src/components/layout/AppSidebar.tsx` — add "CBR Reading" nav item under Programs or as sub-item

### 3. Dashboard Redesign
**File**: `src/pages/Dashboard.tsx` — modernize layout:
- Add a greeting banner with time-based greeting ("Good morning, [Name]")
- Reorganize into a grid with quick-stat cards (My Ministries count, Programs enrolled, Upcoming events count)
- Move search bar into the top section with better styling
- Improve enrolled programs section with card-based progress displays
- Add a quick-actions row (Join Ministry, Enroll in Program, Submit Report, Contact Support)
- Better visual hierarchy with section dividers and icons

### 4. Certifications Page
**File**: New `src/pages/Certificates.tsx`

Referencing the uploaded Figma screenshot — create a "Member Certifications" page with:
- Page header: "Member Certifications" + description
- Tabs: All Certificates, Completed, In Progress, Not Started
- Certificate cards showing: certificate name, description, status (Available/Locked/In Progress), and a download button for completed ones
- Certificate types derived from program enrollments:
  - CU Membership Certificate (available to all active members)
  - CBR Completion Certificate (when CBR progress ≥ threshold)
  - Program-specific certificates (when enrollment progress ≥ completion_threshold)
- For "download," generate a simple styled HTML-to-canvas or printable certificate page (no external service needed)

**File**: `src/App.tsx` — add `/certificates` route
**File**: `src/components/layout/AppSidebar.tsx` — add "Certificates" nav item

### 5. Contact Support
**File**: New `src/pages/ContactSupport.tsx`
- Simple form: subject, message, optional email (pre-filled from profile)
- On submit, insert into a new `support_tickets` table
- Show confirmation message and list of user's own past tickets with status

**Database migration**: Create `support_tickets` table:
- `id` (uuid PK), `user_id` (uuid), `subject` (text), `message` (text), `status` (text, default 'open'), `created_at`, `updated_at`
- RLS: users INSERT/SELECT own; admins SELECT all

**File**: `src/App.tsx` — add `/contact-support` route
**File**: `src/components/layout/AppSidebar.tsx` — add "Support" nav item at bottom

### Summary of Database Changes
1. New table `cbr_reading_progress` with RLS
2. New table `support_tickets` with RLS

### Files Modified/Created
- `src/pages/Auth.tsx` — forgot password link + flow
- `src/pages/ResetPassword.tsx` — new page
- `src/pages/CBRReading.tsx` — new page
- `src/pages/Dashboard.tsx` — redesigned layout
- `src/pages/Certificates.tsx` — new page
- `src/pages/ContactSupport.tsx` — new page
- `src/App.tsx` — new routes
- `src/components/layout/AppSidebar.tsx` — new nav items


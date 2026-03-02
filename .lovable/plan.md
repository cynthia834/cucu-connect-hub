

## Plan: System Refinements & New Features

### 1. Fix Event Creation Visibility
The Events code is structurally correct. The "New Event" button shows only for admins. However, the current user has `super_admin` role and events return empty (no events exist yet). I will verify the button renders properly and add a more prominent empty-state CTA for admins to create their first event.

**File**: `src/pages/Events.tsx`
- Add an admin-visible "Create New Event" button inside the empty state card
- Ensure the dialog opens and saves correctly (code is already wired)

---

### 2. Program Self-Enrollment
Currently only Docket Leaders can enroll members (RLS restricts INSERT). The user wants members to self-enroll.

**Database migration**: Add a new RLS policy on `program_enrollments` allowing `user_id = auth.uid()` for INSERT (self-enrollment).

**File**: `src/pages/Programs.tsx`
- Add "Enroll" button on each program card (when not enrolled)
- Use `useMutation` to insert into `program_enrollments` with `user_id = auth.uid()`, `program_id`, auto-pulling profile data
- Disable button if already enrolled, show "Enrolled" badge instead
- On success, invalidate queries so Dashboard updates immediately

---

### 3. Prayer & Welfare Privacy
Currently both pages list ALL submissions publicly. This violates privacy requirements.

**File**: `src/pages/PrayerRequests.tsx`
- After submission, show a confirmation message ("Your prayer request has been submitted to the Intercessory team")
- Only display the user's OWN submissions below (filter by `user_id`)
- Remove public listing of all prayer requests

**File**: `src/pages/Welfare.tsx`
- Same pattern: show confirmation after submission
- Only display the user's OWN welfare requests
- Remove public listing

The RLS policies already restrict visibility correctly (own + authorized subcom). The UI just needs to stop showing other people's data.

---

### 4. Add "Year Joined CU" Field
**Database migration**: Add `year_joined_cu` integer column to `profiles` table (nullable).

**File**: `src/pages/Auth.tsx`
- Add mandatory "Year Joined CU*" select field (years from 2000 to current year, no future years)

**File**: `src/pages/Profile.tsx`
- Add "Year Joined CU" field to the profile edit form

**File**: `src/stores/authStore.ts`
- Add `year_joined_cu` to the Profile interface

---

### 5. Reports Submission to Secretary
**Database migration**: Create `secretary_reports` table with columns: `id`, `user_id`, `title`, `content`, `created_at`, `status`. Add RLS: users can INSERT their own; only super_admin/cu_chairperson can SELECT all; users can SELECT their own.

**File**: `src/pages/Reports.tsx`
- Add a "Submit Report" form (title + content textarea)
- Show the user's own submitted reports below
- Admin/Secretary sees all submitted reports

---

### 6. Ministry & Dashboard (Already Done)
- Ministry "Join" button, role guide removal, and dashboard ministry/programs display are already implemented from previous changes. No further work needed.
- Search bar is already functional with debounced cross-module search.

---

### Summary of Database Changes
1. New RLS policy on `program_enrollments` for self-enrollment
2. New column `year_joined_cu` on `profiles`
3. New table `secretary_reports` with RLS policies

### Files Modified
- `src/pages/Events.tsx` — admin CTA in empty state
- `src/pages/Programs.tsx` — self-enroll button + mutation
- `src/pages/PrayerRequests.tsx` — privacy (own submissions only + confirmation)
- `src/pages/Welfare.tsx` — privacy (own submissions only + confirmation)
- `src/pages/Auth.tsx` — Year Joined CU field
- `src/pages/Profile.tsx` — Year Joined CU field
- `src/pages/Reports.tsx` — report submission form + listing
- `src/stores/authStore.ts` — Profile interface update




## Plan: System Refinements & New Features

### 1. Fix Event Creation Visibility ✅
- Added admin-visible "Create Your First Event" button inside the empty state card
- Dialog and save logic were already correctly wired

### 2. Program Self-Enrollment ✅
- Updated RLS policy on `program_enrollments` to allow `user_id = auth.uid()` INSERT
- Added "Enroll in Program" button on each program card
- Disables when already enrolled, shows "Enrolled" badge
- Invalidates dashboard queries on success

### 3. Prayer & Welfare Privacy ✅
- Both pages now only query user's OWN submissions (filtered by `user_id`)
- Added confirmation banner after successful submission
- Prayer → "Submitted to Intercessory team"
- Welfare → "Submitted to Welfare Subcommittee"

### 4. Add "Year Joined CU" Field ✅
- Added `year_joined_cu` integer column to `profiles` table
- Added mandatory select field on Auth registration (2000 to current year)
- Added editable field on Profile page
- Updated authStore Profile interface

### 5. Reports Submission to Secretary ✅
- Created `secretary_reports` table with RLS (own INSERT, own+admin SELECT)
- Built submit form with title + content
- Users see own reports; admins/secretary see all
- Shows confirmation banner after submission

### 6. Ministry & Dashboard ✅
- Already implemented: Join button, role guide removed, search bar functional

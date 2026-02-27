

## Dashboard Refinements

### Problem
1. **Ministry display**: Dashboard shows hardcoded role badges but not the member's actual joined ministries from `ministry_members` table. No fallback message when not in any ministry.
2. **Enrolled Programs**: Section is entirely hardcoded (fake "CBR Program" at 65%, "Discipleship" at 30%). It doesn't query `program_enrollments` or `programs` tables at all.

### Changes (single file: `src/pages/Dashboard.tsx`)

**1. Add data fetching**
- Import `useQuery` from `@tanstack/react-query` and `supabase` client
- Query `ministry_members` joined with `ministries` for the current user → get ministry names
- Query `program_enrollments` joined with `programs` for the current user → get enrolled program names + progress

**2. Ministry display in Profile Card**
- Below the bio text, show joined ministry names as badges
- If none: show "Not enrolled in any ministry." with a link to `/ministries`

**3. Replace hardcoded Enrolled Programs section**
- Render actual enrollments with real progress bars from `program_enrollments.progress`
- Update the "X Programs Active" counter dynamically
- If no enrollments: show "No enrolled programs."
- Remove the fake CBR/Discipleship cards

**No database changes needed** — all required tables (`ministry_members`, `ministries`, `program_enrollments`, `programs`) already exist with appropriate RLS policies.


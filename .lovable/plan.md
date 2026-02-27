

## Changes

### 1. Functional search bar on Dashboard (`src/pages/Dashboard.tsx`)
- Add state for search query and results
- On typing, query across `profiles` (by name), `events` (by title), `ministries` (by name), and `programs` (by name) using `ilike` filters
- Show a dropdown/results list below the search input with categorized results (Members, Events, Ministries, Programs)
- Each result links to the relevant page
- Show "No results found" when query returns empty
- Debounce input (300ms) to avoid excessive queries

### 2. Remove Role Guide from Ministries (`src/pages/Ministries.tsx`)
- Delete the `ministryRoleGuide` object, `getMinistryRoles` function, and all related imports
- Remove the "Role Guide" section (lines 188-201) from each ministry card
- Ministry cards will only show: ministry info, join/leave button, and subcommittees

### 3. Events page — no code changes needed
- The "Create New Event" button already exists and is admin-only (line 137-141)
- Event creation already saves to database and invalidates the query to refresh the list
- The current implementation is correct; if events aren't appearing it may be an RLS issue — will verify the events query includes both published and admin-visible events


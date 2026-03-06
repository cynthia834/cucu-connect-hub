

## Plan: Dashboard Visual Overhaul with Member Avatar

### Changes to `src/pages/Dashboard.tsx`

**1. Add member profile picture to greeting banner**
- Import `Avatar`, `AvatarImage`, `AvatarFallback` from `@/components/ui/avatar`
- In the greeting banner, add the user's avatar (from `profile?.avatar_url`) to the left of the greeting text
- Show initials as fallback using `profile?.full_name`

**2. Visual improvements to the greeting banner**
- Make the gradient richer: use a deeper navy-to-gold gradient with a subtle pattern feel
- Increase padding, add the avatar as a large circle (w-16 h-16) with a gold ring border
- Add member name prominently, with role badges below the greeting subtitle

**3. Stat cards visual upgrade**
- Add a subtle gradient or shadow on hover
- Make the icon container more vibrant with distinct colors per stat (navy, gold, green, blue)
- Add `hover:shadow-md hover:-translate-y-0.5 transition-all` for interactive feel

**4. Quick actions styling**
- Add hover scale effect and a subtle arrow indicator on hover
- Use slightly rounded corners and a border-left accent color

**5. Programs section**
- Add gradient to progress bars (navy to gold)
- Show a completion badge more prominently

**6. Events section**
- Add date badges (day number in a colored circle) for each event instead of just an icon
- Better spacing and visual separation

### Files Modified
- `src/pages/Dashboard.tsx` — all visual changes + avatar integration

No database changes needed.


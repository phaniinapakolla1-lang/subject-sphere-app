**Do not limit the work to previously confirmed defects. Perform a complete functional audit of the existing StudyOS application.**

Keep the existing architecture, UI/design, database, authentication, Supabase/RLS, and existing data. **Do not rebuild the app or start from scratch.**

Audit **every route, page, component, button, link, form, modal, dropdown, tab, CRUD operation, database operation, API/server function, navigation flow, and user interaction** in the existing codebase.

For every feature:

- Verify that the UI action actually works.
- Verify the underlying logic executes correctly.
- Verify Supabase/database reads and writes work.
- Verify the UI updates after mutations.
- Verify data persists after refresh.
- Verify loading, empty, success, and error states.
- Verify authentication and authorization.
- Verify student/admin permissions.

**Do not just inspect the code and report problems. FIX the problems you find.**

Specifically test and repair all existing StudyOS functionality, including:

**Dashboard**

- statistics
- progress
- recent activity
- navigation
- quick actions

**Course/Syllabus → Subject → Unit → Topic → Explanation**

- create
- view
- edit
- delete
- navigation
- ordering
- progress
- topic completion
- content persistence

**Notes**

- create
- edit
- save
- delete
- search/filter
- topic association

**Flashcards**

- create
- edit
- delete
- study mode
- reveal answer
- next/previous
- known/unknown
- progress

**Planner**

- create study session/task
- edit
- delete
- completion
- dates/times
- topic association
- persistence

**Revision**

- due topics
- start revision
- complete revision
- progress
- revision scheduling where already supported

**Focus Timer**

- start
- pause
- resume
- reset
- completion
- correct duration
- study-session persistence
- prevent duplicate sessions

**Assignments**

- create
- edit
- delete
- status
- due dates
- completion

**Exams**

- create
- edit
- delete
- dates
- subject association

**Papers/Resources**

- add
- edit
- delete
- open
- association
- URL/file handling

**Admin**

- course management
- subject management
- unit management
- topic management
- explanations/content
- resources
- assignments
- exams
- papers
- user/role permissions

**Syllabus import/parser**, if present:

- paste
- parse
- preview
- validation
- save
- prevent duplicates
- verify resulting hierarchy

Audit all existing Supabase tables, relationships, queries, mutations and RLS policies. **Do not weaken RLS or bypass security just to make something work.**

Check for:

- TypeScript errors
- runtime errors
- broken imports
- broken routes
- missing handlers
- incorrect database columns
- failed queries
- incorrect relationships
- stale state
- race conditions
- duplicate requests
- timer cleanup issues
- forms that don't submit
- buttons that do nothing
- navigation that goes nowhere
- data that disappears after refresh
- incorrect permissions
- mobile/responsive problems

**Every existing button must either perform its intended action or be intentionally identified as a non-action UI element. There must be no dead buttons.**

Do not replace real functionality with mock data, fake success messages, placeholders, or hardcoded values.

After fixing each area, **test the complete end-to-end flow**, not just individual components.

Test at minimum:

`Login → Dashboard → Subject → Unit → Topic → Explanation → Complete Topic → Add Note → Add Flashcard → Planner → Focus Timer → Complete Session → Verify Progress`

Also test:

`Admin → Create Subject → Create Unit → Create Topic → Add Content → Save → Student Login → Verify Content`

Then refresh pages and verify persistence.

Preserve the existing StudyOS design and architecture. Make only the changes required to make the application reliable and functional.

**Do not stop after finding the first few bugs. Continue until the entire existing application has been audited.**

At the end, provide a report containing:

1. All bugs discovered
2. All bugs fixed
3. Features tested
4. Database/Supabase changes
5. Security/RLS changes
6. Remaining issues, if any
7. Areas that could not be verified and exactly why

**The success condition is not “the build passes.” The success condition is that the existing StudyOS features actually work end-to-end for both students and admins.**

&nbsp;
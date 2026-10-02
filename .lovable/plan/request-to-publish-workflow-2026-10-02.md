# Request-to-Publish workflow

Students create their own content, submit one request per scope (Topic, Unit, Subject or Course), and an admin reviews and publishes it. Nothing gets rebuilt; the Course, Subject, Unit and Topic hierarchy and existing data stay as they are.

## What changes for students
- **Own drafts again:** Students can create and edit their own subjects, units, topics and blocks while that content is unpublished. Today only admins can write content, so this reopens drafts to owners only.
- **"Request to Publish" button:** It appears on the topic, subject (with its units) and course pages. It opens a dialog showing the scope, the content name and the unit and topic counts, plus a Submit button. Submitting creates one request for the whole scope.
- **New "My Publishing Requests" page:** Lists each request's content name, scope, submitted date, status badge, admin feedback and last update. If the admin asked for changes, it shows "Edit Content" (opens the existing editor) and "Resubmit".
- **New "Published Library" page (Global Students Published Content):** Browse and search approved courses, subjects, units and topics. It filters by course and category, is read-only, and opens topics in the existing reader.
- **Revisions of published content:** Owners can't edit a published topic directly. "Create revision" copies the topic's blocks into a draft revision. The owner edits it and requests publishing. Students keep seeing the published version until an admin approves, and approval swaps the revision in.

## What changes for admins
- **New "Requests" tab in the admin menu:** A table showing request number, requester, scope, content, subject, unit and topic counts, submitted date, status and a Review button. You can filter it by status.
- **Review page:** Shows the content tree for the requested scope, loaded a level at a time as you expand it. Topic content loads only when you open that topic.
- **Review actions, each confirmed in a dialog:**
  - Approve & Publish: publishes the whole scope in one step.
  - Request Changes: feedback is required.
  - Reject: an optional reason.
- The existing admin content page and its publish toggles stay as they are.

## Statuses
Draft, Pending review, Changes requested, Approved, Published, Rejected. Only admins can set Approved or Published, and the server enforces this.

## Technical details
- **Migration:**
  - New `publication_requests` table: id, number (serial), requester_id, scope_type (topic/unit/subject/course), scope_id, title snapshot, unit/topic counts, status, feedback, submitted_at, reviewed_at, reviewed_by and timestamps. Grants and RLS: requesters read their own requests, admins read all. There are no direct client writes; all writes go through server functions.
  - New `topic_revisions` table: id, topic_id, owner_id, version, blocks jsonb, status and timestamps. Lightweight versioning only.
  - Content stays hidden until approved. Unpublished subjects, units and topics stay hidden from other students. Existing read policies already allow owners and admins.
- **Server functions in `src/lib/publishing.functions.ts`, all requiring sign-in:**
  - `requestPublish`: checks ownership of the scope, computes counts and blocks duplicate pending requests.
  - `resubmitRequest`.
  - `listMyRequests`.
  - `adminListRequests`, `adminReviewTree` (lazy, per level), `adminApprove`, `adminRequestChanges` and `adminReject`. These use the service client only after an admin role check.
  - Approval sets `published=true` on the topic, the unit and its topics, or the subject and its units and topics. A subject also gets status `published`; a course gets its subjects as well. A pending topic revision gets its blocks copied into `topic_blocks`.
  - `contentCreate`/`Update`/`Delete` will allow non-admin owners to write their own unpublished rows. Writes to published rows stay admin-only, and owners can't set `published` or `status=published`.
- **New routes:** `_authenticated/publishing.tsx` (My Requests), `_authenticated/library.tsx` and `_admin/admin/requests.tsx` plus `requests.$requestId.tsx`. Add links in the sidebar and the admin nav.
- **Reused pieces:** the existing badges, dialogs, `useAuth`, `data.ts` hooks, the topic reader and the block editor.
- **Demo mode:** The new buttons show the existing "available after creating an account" message.

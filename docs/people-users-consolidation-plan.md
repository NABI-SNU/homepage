# Plan: consolidate `people` into `users`

Status: implemented on this branch (collection code, `scripts/sql/2026-11-people-to-users.sql` for the
data move, `scripts/sql/2026-11-drop-people.sql` for the clean-up once the new build is live). The
design below is what was built; two details changed during implementation: profile-only members keep
their address in `contactEmail` (no placeholder login email) and get `username = slug` to satisfy
Payload's auth-collection rule, and the merge with a sign-up happens only after the email is verified.

## Why

`people` predates Better Auth. Today one human is represented twice: a `users` row (login,
approval, role) and a `people` row (public profile, authorship, roles by year). The link is
`people.user` (unique). The split causes the problems we keep seeing:

- duplicate `people` for one person (prod: Philjun Kim #265/#277, Seojin Lee #269/#280),
  created when a user was deleted and re-created or when sign-up found no matching Person;
- auto-linking by email at sign-up (`syncBetterAuthUserToPayload`), which is both a hijack
  vector (unverified email claims a member's profile) and the source of broken slugs (`-143`);
- two role systems (`users.role` vs `people.roleAssignments`), two visibility flags
  (`users.isApproved` vs `people.isVisible` / `memberType`), each checked in different places;
- every access rule that needs "the Person for this user" pays an extra lookup
  (`getLinkedPersonIDs`, `findLinkedPerson`, `getLinkedPerson`).

## What `people` holds that `users` does not

| Field | Used by |
| --- | --- |
| `name`, `slug`, `bio`, `avatar`, `socials` | `/people`, `/people/[slug]`, cards, author bylines |
| `email` | sign-up linking, Gravatar fallback, contact |
| `memberType` (`user` \| `alumni`), `isVisible` | directory filtering, sign-in policy (hidden/alumni denied) |
| `years` (numbers), `roleAssignments` (`role@year`) | directory grouping, role badges, program pages |
| `research` (hasMany text → Tags sync) | topic pages, `/people` filters, `syncResearchTags` |
| `isAuthor` | author lists |
| `user` (relationship, unique) | all access control for own-content |

Referenced from: `posts.authors` (+ versions), `header`/`footer` links, `redirects`,
`search` sync (`beforeSync`), sitemap, `people` revalidation hooks, `/api/account/*`.

Important: **not every Person has a login** — alumni and past members are `people` rows with
`user = null`. The consolidated model must still represent them.

## Target model

One collection, `users` (auth-enabled, slug kept so Better Auth's adapter keeps working), with
the profile fields moved onto it. Accounts that cannot log in are simply users without a
Better Auth `accounts`/`sessions` row:

- keep: `email` (unique, lower-cased), `name`, `role`, `isApproved`, `emailVerified`, `betterAuthUserId`
- add from `people`: `slug` (unique), `bio`, `avatar`, `socials`, `years`, `roleAssignments`,
  `research`, `isAuthor`, `isVisible`, `memberType`
- drop: `people.user` (no longer needed), `users.roles` (legacy mirror of `role`)

Sign-in policy becomes a single read of the user row (approved, verified, visible, not alumni).
"Own content" access becomes `authors contains req.user.id` — no People lookup.

## Migration

1. **Schema (additive first).** Add the new fields to `users` and a nullable `authorUsers`
   relationship on `posts` (and anything else that points at `people`). Generate a Payload
   migration (`pnpm migrate:create`) — production does not run `push`, so every schema change
   in this plan ships as a migration.
2. **Data.** For each `people` row:
   - linked (`user` set): copy profile fields onto that user;
   - unlinked with an email matching a user (case-insensitive): copy onto that user, record the
     merge in the migration log;
   - unlinked otherwise: create a user row with `isApproved=false`, no account — a profile-only
     member. Keep `people.id → users.id` in a temporary map table.
   Re-point `posts_rels.people_id` (+ `_posts_v_rels`), `header_rels`, `footer_rels`,
   `redirects_rels` through the map. Fix duplicate People first (see below) so each human maps
   to exactly one user.
3. **Code.** Point everything at `users`: `/people` routes read `users` (filter `isVisible`),
   access helpers drop `getLinkedPersonIDs`, `ensurePostAuthors` uses `req.user.id`,
   `syncBetterAuthUserToPayload` no longer creates/links People — a sign-up either matches an
   existing *verified* email on an approved profile-only user (then attaches the account to it,
   only after email verification) or creates a fresh unapproved user. Search `beforeSync`,
   sitemap and revalidation hooks switch collection. Delete `syncResearchTagsFromPerson` in
   favour of a users hook.
4. **Cut-over.** Deploy with both collections readable; verify `/people`, author bylines,
   `/account`, admin lists. Then a second migration drops `people*` tables and the relationship
   columns.
5. **Rollback.** Step 2 is idempotent and keeps `people` intact until step 4; rolling back
   before step 4 is redeploying the previous build.

## Pre-work that is independent of the consolidation (done / in progress on this branch)

- duplicate guards: `users.email` lower-cased on write, `people` refuses a second row with the
  same email (or same name with no email);
- the production duplicates to merge by hand before step 2:
  - Philjun Kim: keep **#277** (linked to user 142, has bio/avatar/research); move `posts_rels`
    and `_posts_v_rels` rows from **#265** to #277, then delete #265;
  - Seojin Lee: keep **#280** (linked to user 143); delete **#269** (no references), then set
    #280's slug from `-143` to `seojin-lee`.

## Open questions

- Should alumni without a login appear in the admin Users list? (Proposal: yes, with a
  "No account" badge; `hideFromNonAdmins` already hides the collection from members.)
- `roleAssignments` vs `role`: keep both — `role` is the permission, `roleAssignments` is the
  public history (president 2025, treasurer 2026, …).
- Public URL: `/people/[slug]` stays; slugs move over unchanged.

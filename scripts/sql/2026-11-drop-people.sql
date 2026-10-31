-- Second step of the people -> users consolidation. Run ONLY after the build without the
-- `people` collection is live and verified (profiles at /people, author bylines, /account).
-- Removes the legacy tables and the `people_id` relationship columns that
-- scripts/sql/2026-11-people-to-users.sql left in place for the previous deployment.
BEGIN;
ALTER TABLE "posts_rels"                    DROP COLUMN IF EXISTS "people_id";
ALTER TABLE "_posts_v_rels"                 DROP COLUMN IF EXISTS "people_id";
ALTER TABLE "header_rels"                   DROP COLUMN IF EXISTS "people_id";
ALTER TABLE "footer_rels"                   DROP COLUMN IF EXISTS "people_id";
ALTER TABLE "redirects_rels"                DROP COLUMN IF EXISTS "people_id";
ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "people_id";
DROP TABLE IF EXISTS "people_socials";
DROP TABLE IF EXISTS "people_role_assignments";
DROP TABLE IF EXISTS "people_texts";
DROP TABLE IF EXISTS "people_numbers";
DROP TABLE IF EXISTS "people";
DROP TYPE IF EXISTS "public"."enum_people_member_type";
DROP TYPE IF EXISTS "public"."enum_people_role_assignments_role";
DROP TYPE IF EXISTS "public"."enum_people_socials_platform";
COMMIT;

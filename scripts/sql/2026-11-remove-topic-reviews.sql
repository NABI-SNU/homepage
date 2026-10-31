-- Removes the three 2026 Topic Review activities created with the seminars change.
-- Monthly paper reviews are Posts (category "Monthly Meetings"), not Activities.
-- Versions are deleted explicitly because _activities_v.parent_id is ON DELETE SET NULL;
-- references, book chapters and *_rels rows cascade.
-- The 'topic-review' enum labels stay in Postgres: dropping an enum value needs the type
-- rebuilt, and no row uses them after this cleanup.
BEGIN;
DELETE FROM public._activities_v WHERE parent_id IN (SELECT id FROM public.activities WHERE activity_type::text = 'topic-review');
DELETE FROM public.activities WHERE activity_type::text = 'topic-review';
COMMIT;

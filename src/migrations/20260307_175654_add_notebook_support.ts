import fs from 'node:fs/promises'
import path from 'node:path'

import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

import { resolveResearchNotebookPath } from '@/utilities/researchNotebook'

type LegacyNotebookPathRow = {
  notebook_path: string | null
}

type LegacyResearchNotebookRow = {
  filename: string | null
  id: number
}

type LegacyResearchVersionNotebookRow = {
  filename: string | null
  id: number
}

const createNotebookSchema = async (db: MigrateUpArgs['db']): Promise<void> => {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "notebooks" (
      "id" serial PRIMARY KEY NOT NULL,
      "prefix" varchar DEFAULT 'webp/notebooks',
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "url" varchar,
      "thumbnail_u_r_l" varchar,
      "filename" varchar,
      "mime_type" varchar,
      "filesize" numeric,
      "width" numeric,
      "height" numeric,
      "focal_x" numeric,
      "focal_y" numeric
    );
  `)

  await db.execute(sql`
    ALTER TABLE "research"
      ADD COLUMN IF NOT EXISTS "notebook_id" integer,
      ADD COLUMN IF NOT EXISTS "colab_u_r_l" varchar,
      ADD COLUMN IF NOT EXISTS "kaggle_u_r_l" varchar;
  `)

  await db.execute(sql`
    ALTER TABLE "_research_v"
      ADD COLUMN IF NOT EXISTS "version_notebook_id" integer,
      ADD COLUMN IF NOT EXISTS "version_colab_u_r_l" varchar,
      ADD COLUMN IF NOT EXISTS "version_kaggle_u_r_l" varchar;
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'research_notebook_id_notebooks_id_fk'
      ) THEN
        ALTER TABLE "research"
          ADD CONSTRAINT "research_notebook_id_notebooks_id_fk"
          FOREIGN KEY ("notebook_id")
          REFERENCES "public"."notebooks"("id")
          ON DELETE set null
          ON UPDATE no action;
      END IF;
    END $$;
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = '_research_v_version_notebook_id_notebooks_id_fk'
      ) THEN
        ALTER TABLE "_research_v"
          ADD CONSTRAINT "_research_v_version_notebook_id_notebooks_id_fk"
          FOREIGN KEY ("version_notebook_id")
          REFERENCES "public"."notebooks"("id")
          ON DELETE set null
          ON UPDATE no action;
      END IF;
    END $$;
  `)

  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "research_notebook_idx" ON "research" USING btree ("notebook_id");`,
  )
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "_research_v_version_version_notebook_idx" ON "_research_v" USING btree ("version_notebook_id");`,
  )
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "notebooks_updated_at_idx" ON "notebooks" USING btree ("updated_at");`,
  )
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "notebooks_created_at_idx" ON "notebooks" USING btree ("created_at");`,
  )
  await db.execute(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS "notebooks_filename_idx" ON "notebooks" USING btree ("filename");`,
  )
}

const getLegacyNotebookPaths = async (db: MigrateUpArgs['db']): Promise<string[]> => {
  const researchResult = await db.execute(
    sql`SELECT DISTINCT "notebook_path" FROM "research" WHERE "notebook_path" IS NOT NULL AND "notebook_path" <> '';`,
  )
  const versionResult = await db.execute(
    sql`SELECT DISTINCT "version_notebook_path" AS "notebook_path" FROM "_research_v" WHERE "version_notebook_path" IS NOT NULL AND "version_notebook_path" <> '';`,
  )

  return Array.from(
    new Set(
      [...researchResult.rows, ...versionResult.rows]
        .map((row) => (row as LegacyNotebookPathRow).notebook_path?.trim() || null)
        .filter((value): value is string => Boolean(value)),
    ),
  )
}

const backfillNotebookRelations = async ({ db, payload, req }: MigrateUpArgs): Promise<void> => {
  const legacyNotebookPaths = await getLegacyNotebookPaths(db)
  const notebookIDsByPath = new Map<string, number>()

  for (const notebookPath of legacyNotebookPaths) {
    const absolutePath = resolveResearchNotebookPath(notebookPath)

    if (!absolutePath) {
      throw new Error(`Cannot migrate notebook path outside content/notebooks: ${notebookPath}`)
    }

    const [data, stat] = await Promise.all([fs.readFile(absolutePath), fs.stat(absolutePath)])

    const notebook = await payload.create({
      collection: 'notebooks',
      data: {},
      file: {
        data,
        mimetype: 'application/x-ipynb+json',
        name: path.basename(absolutePath),
        size: stat.size,
      },
      overrideAccess: true,
      req,
    })

    notebookIDsByPath.set(notebookPath, notebook.id)
  }

  for (const [notebookPath, notebookID] of notebookIDsByPath.entries()) {
    await db.execute(sql`
      UPDATE "research"
      SET "notebook_id" = ${notebookID}
      WHERE "notebook_id" IS NULL AND "notebook_path" = ${notebookPath};
    `)

    await db.execute(sql`
      UPDATE "_research_v"
      SET "version_notebook_id" = ${notebookID}
      WHERE "version_notebook_id" IS NULL AND "version_notebook_path" = ${notebookPath};
    `)
  }
}

const restoreLegacyNotebookPaths = async ({ db }: MigrateDownArgs): Promise<void> => {
  const researchResult = await db.execute(sql`
    SELECT r."id", n."filename"
    FROM "research" r
    JOIN "notebooks" n ON n."id" = r."notebook_id"
    WHERE r."notebook_id" IS NOT NULL;
  `)

  for (const row of researchResult.rows as LegacyResearchNotebookRow[]) {
    if (!row.filename) continue

    await db.execute(sql`
      UPDATE "research"
      SET "notebook_path" = ${`notebooks/${row.filename}`}
      WHERE "id" = ${row.id};
    `)
  }

  const versionResult = await db.execute(sql`
    SELECT rv."id", n."filename"
    FROM "_research_v" rv
    JOIN "notebooks" n ON n."id" = rv."version_notebook_id"
    WHERE rv."version_notebook_id" IS NOT NULL;
  `)

  for (const row of versionResult.rows as LegacyResearchVersionNotebookRow[]) {
    if (!row.filename) continue

    await db.execute(sql`
      UPDATE "_research_v"
      SET "version_notebook_path" = ${`notebooks/${row.filename}`}
      WHERE "id" = ${row.id};
    `)
  }
}

export async function up(args: MigrateUpArgs): Promise<void> {
  await createNotebookSchema(args.db)
  await backfillNotebookRelations(args)

  await args.db.execute(sql`
    ALTER TABLE "research"
    DROP COLUMN IF EXISTS "notebook_path";
  `)

  await args.db.execute(sql`
    ALTER TABLE "_research_v"
    DROP COLUMN IF EXISTS "version_notebook_path";
  `)
}

export async function down(args: MigrateDownArgs): Promise<void> {
  await args.db.execute(sql`
    ALTER TABLE "research"
      ADD COLUMN IF NOT EXISTS "notebook_path" varchar;
  `)

  await args.db.execute(sql`
    ALTER TABLE "_research_v"
      ADD COLUMN IF NOT EXISTS "version_notebook_path" varchar;
  `)

  await restoreLegacyNotebookPaths(args)

  await args.db.execute(sql`
    ALTER TABLE "research"
    DROP CONSTRAINT IF EXISTS "research_notebook_id_notebooks_id_fk";
  `)

  await args.db.execute(sql`
    ALTER TABLE "_research_v"
    DROP CONSTRAINT IF EXISTS "_research_v_version_notebook_id_notebooks_id_fk";
  `)

  await args.db.execute(sql`DROP INDEX IF EXISTS "research_notebook_idx";`)
  await args.db.execute(sql`DROP INDEX IF EXISTS "_research_v_version_version_notebook_idx";`)
  await args.db.execute(sql`DROP INDEX IF EXISTS "notebooks_updated_at_idx";`)
  await args.db.execute(sql`DROP INDEX IF EXISTS "notebooks_created_at_idx";`)
  await args.db.execute(sql`DROP INDEX IF EXISTS "notebooks_filename_idx";`)

  await args.db.execute(sql`
    ALTER TABLE "research"
      DROP COLUMN IF EXISTS "notebook_id",
      DROP COLUMN IF EXISTS "colab_u_r_l",
      DROP COLUMN IF EXISTS "kaggle_u_r_l";
  `)

  await args.db.execute(sql`
    ALTER TABLE "_research_v"
      DROP COLUMN IF EXISTS "version_notebook_id",
      DROP COLUMN IF EXISTS "version_colab_u_r_l",
      DROP COLUMN IF EXISTS "version_kaggle_u_r_l";
  `)

  await args.db.execute(sql`DROP TABLE IF EXISTS "notebooks";`)
}

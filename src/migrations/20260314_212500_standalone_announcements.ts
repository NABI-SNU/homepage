import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

const runStatements = async (
  db: MigrateUpArgs['db'] | MigrateDownArgs['db'],
  statements: string[],
): Promise<void> => {
  for (const statement of statements) {
    await db.execute(sql.raw(statement))
  }
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await runStatements(db, [
    `
      DO $$
      BEGIN
        CREATE TYPE "public"."enum_announcements_status" AS ENUM('draft', 'published');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END
      $$;
    `,
    `
      DO $$
      BEGIN
        CREATE TYPE "public"."enum__announcements_v_version_status" AS ENUM('draft', 'published');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END
      $$;
    `,
    `
      CREATE TABLE IF NOT EXISTS "announcements" (
        "id" serial PRIMARY KEY NOT NULL,
        "title" varchar,
        "description" varchar,
        "published_at" timestamp(3) with time zone,
        "image_id" integer,
        "content" jsonb,
        "meta_title" varchar,
        "meta_image_id" integer,
        "meta_description" varchar,
        "generate_slug" boolean DEFAULT true,
        "slug" varchar,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "_status" "enum_announcements_status" DEFAULT 'draft'
      );
    `,
    `
      DO $$
      BEGIN
        ALTER TABLE "announcements"
          ADD CONSTRAINT "announcements_image_id_media_id_fk"
          FOREIGN KEY ("image_id") REFERENCES "public"."media"("id")
          ON DELETE set null ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END
      $$;
    `,
    `
      DO $$
      BEGIN
        ALTER TABLE "announcements"
          ADD CONSTRAINT "announcements_meta_image_id_media_id_fk"
          FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id")
          ON DELETE set null ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END
      $$;
    `,
    `CREATE INDEX IF NOT EXISTS "announcements_image_idx" ON "announcements" ("image_id");`,
    `CREATE INDEX IF NOT EXISTS "announcements_meta_meta_image_idx" ON "announcements" ("meta_image_id");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "announcements_slug_idx" ON "announcements" ("slug");`,
    `CREATE INDEX IF NOT EXISTS "announcements_updated_at_idx" ON "announcements" ("updated_at");`,
    `CREATE INDEX IF NOT EXISTS "announcements_created_at_idx" ON "announcements" ("created_at");`,
    `CREATE INDEX IF NOT EXISTS "announcements__status_idx" ON "announcements" ("_status");`,
    `
      CREATE TABLE IF NOT EXISTS "announcements_references" (
        "_order" integer NOT NULL,
        "_parent_id" integer NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "title" varchar,
        "journal" varchar,
        "year" numeric,
        "doi" varchar,
        "url" varchar
      );
    `,
    `
      DO $$
      BEGIN
        ALTER TABLE "announcements_references"
          ADD CONSTRAINT "announcements_references_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."announcements"("id")
          ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END
      $$;
    `,
    `CREATE INDEX IF NOT EXISTS "announcements_references_order_idx" ON "announcements_references" ("_order");`,
    `CREATE INDEX IF NOT EXISTS "announcements_references_parent_id_idx" ON "announcements_references" ("_parent_id");`,
    `
      CREATE TABLE IF NOT EXISTS "announcements_references_authors" (
        "_order" integer NOT NULL,
        "_parent_id" varchar NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "name" varchar
      );
    `,
    `
      DO $$
      BEGIN
        ALTER TABLE "announcements_references_authors"
          ADD CONSTRAINT "announcements_references_authors_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."announcements_references"("id")
          ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END
      $$;
    `,
    `CREATE INDEX IF NOT EXISTS "announcements_references_authors_order_idx" ON "announcements_references_authors" ("_order");`,
    `CREATE INDEX IF NOT EXISTS "announcements_references_authors_parent_id_idx" ON "announcements_references_authors" ("_parent_id");`,
    `
      CREATE TABLE IF NOT EXISTS "_announcements_v" (
        "id" serial PRIMARY KEY NOT NULL,
        "parent_id" integer,
        "version_title" varchar,
        "version_description" varchar,
        "version_published_at" timestamp(3) with time zone,
        "version_image_id" integer,
        "version_content" jsonb,
        "version_meta_title" varchar,
        "version_meta_image_id" integer,
        "version_meta_description" varchar,
        "version_generate_slug" boolean DEFAULT true,
        "version_slug" varchar,
        "version_updated_at" timestamp(3) with time zone,
        "version_created_at" timestamp(3) with time zone,
        "version__status" "enum__announcements_v_version_status" DEFAULT 'draft',
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "latest" boolean
      );
    `,
    `
      DO $$
      BEGIN
        ALTER TABLE "_announcements_v"
          ADD CONSTRAINT "_announcements_v_parent_id_announcements_id_fk"
          FOREIGN KEY ("parent_id") REFERENCES "public"."announcements"("id")
          ON DELETE set null ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END
      $$;
    `,
    `
      DO $$
      BEGIN
        ALTER TABLE "_announcements_v"
          ADD CONSTRAINT "_announcements_v_version_image_id_media_id_fk"
          FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id")
          ON DELETE set null ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END
      $$;
    `,
    `
      DO $$
      BEGIN
        ALTER TABLE "_announcements_v"
          ADD CONSTRAINT "_announcements_v_version_meta_image_id_media_id_fk"
          FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id")
          ON DELETE set null ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END
      $$;
    `,
    `CREATE INDEX IF NOT EXISTS "_announcements_v_parent_idx" ON "_announcements_v" ("parent_id");`,
    `CREATE INDEX IF NOT EXISTS "_announcements_v_version_version_image_idx" ON "_announcements_v" ("version_image_id");`,
    `CREATE INDEX IF NOT EXISTS "_announcements_v_version_meta_version_meta_image_idx" ON "_announcements_v" ("version_meta_image_id");`,
    `CREATE INDEX IF NOT EXISTS "_announcements_v_version_version_slug_idx" ON "_announcements_v" ("version_slug");`,
    `CREATE INDEX IF NOT EXISTS "_announcements_v_version_version_updated_at_idx" ON "_announcements_v" ("version_updated_at");`,
    `CREATE INDEX IF NOT EXISTS "_announcements_v_version_version_created_at_idx" ON "_announcements_v" ("version_created_at");`,
    `CREATE INDEX IF NOT EXISTS "_announcements_v_version_version__status_idx" ON "_announcements_v" ("version__status");`,
    `CREATE INDEX IF NOT EXISTS "_announcements_v_created_at_idx" ON "_announcements_v" ("created_at");`,
    `CREATE INDEX IF NOT EXISTS "_announcements_v_updated_at_idx" ON "_announcements_v" ("updated_at");`,
    `CREATE INDEX IF NOT EXISTS "_announcements_v_latest_idx" ON "_announcements_v" ("latest");`,
    `
      CREATE TABLE IF NOT EXISTS "_announcements_v_version_references" (
        "_order" integer NOT NULL,
        "_parent_id" integer NOT NULL,
        "id" serial PRIMARY KEY NOT NULL,
        "title" varchar,
        "journal" varchar,
        "year" numeric,
        "doi" varchar,
        "url" varchar,
        "_uuid" varchar
      );
    `,
    `
      DO $$
      BEGIN
        ALTER TABLE "_announcements_v_version_references"
          ADD CONSTRAINT "_announcements_v_version_references_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."_announcements_v"("id")
          ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END
      $$;
    `,
    `CREATE INDEX IF NOT EXISTS "_announcements_v_version_references_order_idx" ON "_announcements_v_version_references" ("_order");`,
    `CREATE INDEX IF NOT EXISTS "_announcements_v_version_references_parent_id_idx" ON "_announcements_v_version_references" ("_parent_id");`,
    `
      CREATE TABLE IF NOT EXISTS "_announcements_v_version_references_authors" (
        "_order" integer NOT NULL,
        "_parent_id" integer NOT NULL,
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar,
        "_uuid" varchar
      );
    `,
    `
      DO $$
      BEGIN
        ALTER TABLE "_announcements_v_version_references_authors"
          ADD CONSTRAINT "_announcements_v_version_references_authors_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."_announcements_v_version_references"("id")
          ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END
      $$;
    `,
    `CREATE INDEX IF NOT EXISTS "_announcements_v_version_references_authors_order_idx" ON "_announcements_v_version_references_authors" ("_order");`,
    `CREATE INDEX IF NOT EXISTS "_announcements_v_version_references_authors_parent_id_idx" ON "_announcements_v_version_references_authors" ("_parent_id");`,
    `ALTER TABLE "redirects_rels" ADD COLUMN IF NOT EXISTS "announcements_id" integer;`,
    `CREATE INDEX IF NOT EXISTS "redirects_rels_announcements_id_idx" ON "redirects_rels" ("announcements_id");`,
    `
      DO $$
      BEGIN
        ALTER TABLE "redirects_rels"
          ADD CONSTRAINT "redirects_rels_announcements_fk"
          FOREIGN KEY ("announcements_id") REFERENCES "public"."announcements"("id")
          ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END
      $$;
    `,
    `ALTER TABLE "header_rels" ADD COLUMN IF NOT EXISTS "announcements_id" integer;`,
    `CREATE INDEX IF NOT EXISTS "header_rels_announcements_id_idx" ON "header_rels" ("announcements_id");`,
    `
      DO $$
      BEGIN
        ALTER TABLE "header_rels"
          ADD CONSTRAINT "header_rels_announcements_fk"
          FOREIGN KEY ("announcements_id") REFERENCES "public"."announcements"("id")
          ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END
      $$;
    `,
    `ALTER TABLE "footer_rels" ADD COLUMN IF NOT EXISTS "announcements_id" integer;`,
    `CREATE INDEX IF NOT EXISTS "footer_rels_announcements_id_idx" ON "footer_rels" ("announcements_id");`,
    `
      DO $$
      BEGIN
        ALTER TABLE "footer_rels"
          ADD CONSTRAINT "footer_rels_announcements_fk"
          FOREIGN KEY ("announcements_id") REFERENCES "public"."announcements"("id")
          ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END
      $$;
    `,
    `DROP TABLE IF EXISTS "_activities_v_version_announcements" CASCADE;`,
    `DROP TABLE IF EXISTS "activities_announcements" CASCADE;`,
  ])
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await runStatements(db, [
    `ALTER TABLE "redirects_rels" DROP CONSTRAINT IF EXISTS "redirects_rels_announcements_fk";`,
    `DROP INDEX IF EXISTS "redirects_rels_announcements_id_idx";`,
    `ALTER TABLE "redirects_rels" DROP COLUMN IF EXISTS "announcements_id";`,
    `ALTER TABLE "header_rels" DROP CONSTRAINT IF EXISTS "header_rels_announcements_fk";`,
    `DROP INDEX IF EXISTS "header_rels_announcements_id_idx";`,
    `ALTER TABLE "header_rels" DROP COLUMN IF EXISTS "announcements_id";`,
    `ALTER TABLE "footer_rels" DROP CONSTRAINT IF EXISTS "footer_rels_announcements_fk";`,
    `DROP INDEX IF EXISTS "footer_rels_announcements_id_idx";`,
    `ALTER TABLE "footer_rels" DROP COLUMN IF EXISTS "announcements_id";`,
    `DROP TABLE IF EXISTS "_announcements_v_version_references_authors" CASCADE;`,
    `DROP TABLE IF EXISTS "_announcements_v_version_references" CASCADE;`,
    `DROP TABLE IF EXISTS "_announcements_v" CASCADE;`,
    `DROP TABLE IF EXISTS "announcements_references_authors" CASCADE;`,
    `DROP TABLE IF EXISTS "announcements_references" CASCADE;`,
    `DROP TABLE IF EXISTS "announcements" CASCADE;`,
    `DROP TYPE IF EXISTS "enum__announcements_v_version_status";`,
    `DROP TYPE IF EXISTS "enum_announcements_status";`,
  ])
}

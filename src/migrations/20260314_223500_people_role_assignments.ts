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
        CREATE TYPE "public"."enum_people_role_assignments_role" AS ENUM('executive', 'president');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END
      $$;
    `,
    `
      CREATE TABLE IF NOT EXISTS "people_role_assignments" (
        "_order" integer NOT NULL,
        "_parent_id" integer NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "year" numeric NOT NULL,
        "role" "enum_people_role_assignments_role" NOT NULL
      );
    `,
    `
      DO $$
      BEGIN
        ALTER TABLE "people_role_assignments"
          ADD CONSTRAINT "people_role_assignments_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."people"("id")
          ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END
      $$;
    `,
    `CREATE INDEX IF NOT EXISTS "people_role_assignments_order_idx" ON "people_role_assignments" ("_order");`,
    `CREATE INDEX IF NOT EXISTS "people_role_assignments_parent_id_idx" ON "people_role_assignments" ("_parent_id");`,
    `
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'people'
            AND column_name = 'role'
        ) THEN
          INSERT INTO "people_role_assignments" ("_order", "_parent_id", "id", "year", "role")
          SELECT
            0,
            p.id,
            md5('people-role-assignment:' || p.id::text || ':' || COALESCE(y.assignment_year::text, EXTRACT(YEAR FROM now())::text) || ':' || p.role::text),
            COALESCE(y.assignment_year, EXTRACT(YEAR FROM now())::numeric),
            p.role::text::"enum_people_role_assignments_role"
          FROM "people" p
          LEFT JOIN LATERAL (
            SELECT pn.number AS assignment_year
            FROM "people_numbers" pn
            WHERE pn.parent_id = p.id
              AND pn.path = 'years'
            ORDER BY pn.number DESC, COALESCE(pn."order", 0) ASC
            LIMIT 1
          ) y ON TRUE
          WHERE p.role IS NOT NULL
            AND NOT EXISTS (
              SELECT 1
              FROM "people_role_assignments" pra
              WHERE pra."_parent_id" = p.id
            );
        END IF;
      END
      $$;
    `,
    `ALTER TABLE "people" DROP COLUMN IF EXISTS "role";`,
    `DROP TYPE IF EXISTS "enum_people_role";`,
  ])
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await runStatements(db, [
    `
      DO $$
      BEGIN
        CREATE TYPE "public"."enum_people_role" AS ENUM('executive', 'president');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END
      $$;
    `,
    `ALTER TABLE "people" ADD COLUMN IF NOT EXISTS "role" "enum_people_role";`,
    `
      WITH latest_assignment AS (
        SELECT DISTINCT ON (pra."_parent_id")
          pra."_parent_id",
          pra.role
        FROM "people_role_assignments" pra
        ORDER BY pra."_parent_id", pra.year DESC, pra."_order" ASC
      )
      UPDATE "people" p
      SET "role" = latest_assignment.role::text::"enum_people_role"
      FROM latest_assignment
      WHERE p.id = latest_assignment."_parent_id";
    `,
    `DROP TABLE IF EXISTS "people_role_assignments" CASCADE;`,
    `DROP TYPE IF EXISTS "enum_people_role_assignments_role";`,
  ])
}

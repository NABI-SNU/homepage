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
        CREATE TYPE "public"."enum_people_role" AS ENUM('executive', 'president');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END
      $$;
    `,
    `ALTER TABLE "people" ADD COLUMN IF NOT EXISTS "role" "enum_people_role";`,
  ])
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await runStatements(db, [
    `ALTER TABLE "people" DROP COLUMN IF EXISTS "role";`,
    `DROP TYPE IF EXISTS "enum_people_role";`,
  ])
}

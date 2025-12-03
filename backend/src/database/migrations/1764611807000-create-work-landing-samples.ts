import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkLandingSamples1764611807000 implements MigrationInterface {
  name = 'CreateWorkLandingSamples1764611807000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "work_landing_samples" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "work_id" uuid NOT NULL REFERENCES "works"("id") ON DELETE CASCADE,
        "order_index" int DEFAULT 0,
        "created_at" TIMESTAMPTZ DEFAULT now(),
        "updated_at" TIMESTAMPTZ DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_work_landing_samples_work_id" ON "work_landing_samples" ("work_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_work_landing_samples_work_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "work_landing_samples"`);
  }
}

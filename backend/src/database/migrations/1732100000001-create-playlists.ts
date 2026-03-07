import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePlaylists1732100000001 implements MigrationInterface {
  name = 'CreatePlaylists1732100000001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "playlists" (
        "id" uuid PRIMARY KEY,
        "user_id" uuid NULL,
        "profile_id" uuid NULL,
        "name" varchar NOT NULL,
        "is_default" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "playlist_items" (
        "id" uuid PRIMARY KEY,
        "playlist_id" uuid NOT NULL,
        "track_id" uuid NOT NULL,
        "order_index" int NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uniq_playlist_item" ON "playlist_items" ("playlist_id", "track_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_playlist_items_order" ON "playlist_items" ("playlist_id", "order_index")
    `);

    // Foreign keys
    try {
      await queryRunner.query(`
        ALTER TABLE "playlist_items" ADD CONSTRAINT "fk_playlist_items_playlist" FOREIGN KEY ("playlist_id") REFERENCES "playlists"("id") ON DELETE CASCADE
      `);
    } catch {}
    try {
      await queryRunner.query(`
        ALTER TABLE "playlist_items" ADD CONSTRAINT "fk_playlist_items_track" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE
      `);
    } catch {}
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.query(`ALTER TABLE "playlist_items" DROP CONSTRAINT IF EXISTS "fk_playlist_items_track"`);
    } catch {}
    try {
      await queryRunner.query(`ALTER TABLE "playlist_items" DROP CONSTRAINT IF EXISTS "fk_playlist_items_playlist"`);
    } catch {}
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_playlist_items_order"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "uniq_playlist_item"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "playlist_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "playlists"`);
  }
}
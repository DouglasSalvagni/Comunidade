import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePlayStatsTables1764270799351 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create play_events table if it doesn't exist
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "play_events" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "profile_id" uuid,
                "track_id" uuid NOT NULL,
                "event_type" character varying NOT NULL,
                "position_seconds" integer NOT NULL DEFAULT 0,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_play_events" PRIMARY KEY ("id"),
                CONSTRAINT "FK_play_events_profile" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_play_events_track" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE
            )
        `);

        // Create track_play_user_count table
        await queryRunner.query(`
            CREATE TABLE "track_play_user_count" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "profile_id" uuid NOT NULL,
                "track_id" uuid NOT NULL,
                "count" integer NOT NULL DEFAULT 0,
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_track_play_user_count" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_track_play_user_count" UNIQUE ("profile_id", "track_id"),
                CONSTRAINT "FK_track_play_user_count_profile" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_track_play_user_count_track" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE
            )
        `);

        // Create track_play_global_count table
        await queryRunner.query(`
            CREATE TABLE "track_play_global_count" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "track_id" uuid NOT NULL,
                "count" integer NOT NULL DEFAULT 0,
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_track_play_global_count" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_track_play_global_count_track" UNIQUE ("track_id"),
                CONSTRAINT "FK_track_play_global_count_track" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "track_play_global_count"`);
        await queryRunner.query(`DROP TABLE "track_play_user_count"`);
        // We don't drop play_events as it might have existed before or contains data we want to keep if we revert just the stats part? 
        // But for a clean migration, we should probably drop it if we created it. 
        // However, since we used IF NOT EXISTS, it's ambiguous. 
        // I'll drop it to be consistent with "up" creating it.
        await queryRunner.query(`DROP TABLE "play_events"`);
    }

}

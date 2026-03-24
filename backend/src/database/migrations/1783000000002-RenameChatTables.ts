import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameChatTables1783000000002 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.renameTable('chat_messages', 'course_chat_messages');
        await queryRunner.renameTable('chat_summaries', 'course_chat_summaries');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.renameTable('course_chat_summaries', 'chat_summaries');
        await queryRunner.renameTable('course_chat_messages', 'chat_messages');
    }

}
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateAiTables1783000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable pgvector extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector;`);

    // Create lesson_knowledge table
    await queryRunner.createTable(
      new Table({
        name: 'lesson_knowledge',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'course_id', type: 'uuid', isNullable: false },
          { name: 'lesson_id', type: 'uuid', isNullable: false },
          { name: 'type', type: 'varchar', length: '50', isNullable: false },
          { name: 'content', type: 'text', isNullable: false },
          { name: 'embedding', type: 'vector', length: '1536', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    // Create chat_messages table
    await queryRunner.createTable(
      new Table({
        name: 'chat_messages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'user_id', type: 'uuid', isNullable: false },
          { name: 'course_id', type: 'uuid', isNullable: true },
          { name: 'role', type: 'varchar', length: '50', isNullable: false },
          { name: 'content', type: 'text', isNullable: false },
          { name: 'embedding', type: 'vector', length: '1536', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    // Create chat_summaries table
    await queryRunner.createTable(
      new Table({
        name: 'chat_summaries',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'user_id', type: 'uuid', isNullable: false },
          { name: 'course_id', type: 'uuid', isNullable: true },
          { name: 'summaryText', type: 'text', isNullable: false },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
        uniques: [
          {
            name: 'UQ_chat_summaries_user_course',
            columnNames: ['user_id', 'course_id'],
          },
        ],
      }),
      true,
    );

    // Add Foreign Keys for lesson_knowledge
    await queryRunner.createForeignKey(
      'lesson_knowledge',
      new TableForeignKey({
        columnNames: ['course_id'],
        referencedTableName: 'courses',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'lesson_knowledge',
      new TableForeignKey({
        columnNames: ['lesson_id'],
        referencedTableName: 'lessons',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Add Foreign Keys for chat_messages
    await queryRunner.createForeignKey(
      'chat_messages',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'chat_messages',
      new TableForeignKey({
        columnNames: ['course_id'],
        referencedTableName: 'courses',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Add Foreign Keys for chat_summaries
    await queryRunner.createForeignKey(
      'chat_summaries',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'chat_summaries',
      new TableForeignKey({
        columnNames: ['course_id'],
        referencedTableName: 'courses',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('chat_summaries', true, true, true);
    await queryRunner.dropTable('chat_messages', true, true, true);
    await queryRunner.dropTable('lesson_knowledge', true, true, true);
    await queryRunner.query(`DROP EXTENSION IF EXISTS vector;`);
  }
}

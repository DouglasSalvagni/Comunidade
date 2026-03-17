import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex, TableUnique } from 'typeorm';

export class CreateCommunityTables1778000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'community_spaces',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'name', type: 'varchar', isNullable: false },
          { name: 'slug', type: 'varchar', isNullable: false, isUnique: true },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'visibility', type: 'varchar', default: "'public'" },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'sort_order', type: 'int', default: 0 },
          { name: 'created_by', type: 'uuid', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'community_spaces',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createIndex(
      'community_spaces',
      new TableIndex({ columnNames: ['is_active', 'sort_order'] }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'community_space_plan_access',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'space_id', type: 'uuid', isNullable: false },
          { name: 'plan_id', type: 'uuid', isNullable: false },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'community_space_plan_access',
      new TableForeignKey({
        columnNames: ['space_id'],
        referencedTableName: 'community_spaces',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'community_space_plan_access',
      new TableForeignKey({
        columnNames: ['plan_id'],
        referencedTableName: 'plans',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createUniqueConstraint(
      'community_space_plan_access',
      new TableUnique({ columnNames: ['space_id', 'plan_id'] }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'community_space_course_access',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'space_id', type: 'uuid', isNullable: false },
          { name: 'course_id', type: 'uuid', isNullable: false },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'community_space_course_access',
      new TableForeignKey({
        columnNames: ['space_id'],
        referencedTableName: 'community_spaces',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'community_space_course_access',
      new TableForeignKey({
        columnNames: ['course_id'],
        referencedTableName: 'courses',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createUniqueConstraint(
      'community_space_course_access',
      new TableUnique({ columnNames: ['space_id', 'course_id'] }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'community_posts',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'space_id', type: 'uuid', isNullable: false },
          { name: 'author_id', type: 'uuid', isNullable: false },
          { name: 'title', type: 'varchar', isNullable: true },
          { name: 'content_html', type: 'text', isNullable: false },
          { name: 'is_pinned', type: 'boolean', default: false },
          { name: 'pinned_at', type: 'timestamp', isNullable: true },
          { name: 'status', type: 'varchar', default: "'published'" },
          { name: 'comments_count', type: 'int', default: 0 },
          { name: 'likes_count', type: 'int', default: 0 },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'community_posts',
      new TableForeignKey({
        columnNames: ['space_id'],
        referencedTableName: 'community_spaces',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'community_posts',
      new TableForeignKey({
        columnNames: ['author_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'community_posts',
      new TableIndex({ columnNames: ['space_id', 'is_pinned', 'created_at'] }),
    );

    await queryRunner.createIndex(
      'community_posts',
      new TableIndex({ columnNames: ['author_id', 'created_at'] }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'community_post_attachments',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'post_id', type: 'uuid', isNullable: false },
          { name: 'file_key', type: 'varchar', isNullable: false },
          { name: 'file_name', type: 'varchar', isNullable: false },
          { name: 'content_type', type: 'varchar', isNullable: false },
          { name: 'size_bytes', type: 'int', default: 0 },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'community_post_attachments',
      new TableForeignKey({
        columnNames: ['post_id'],
        referencedTableName: 'community_posts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'community_post_attachments',
      new TableIndex({ columnNames: ['post_id'] }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'community_post_likes',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'post_id', type: 'uuid', isNullable: false },
          { name: 'user_id', type: 'uuid', isNullable: false },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'community_post_likes',
      new TableForeignKey({
        columnNames: ['post_id'],
        referencedTableName: 'community_posts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'community_post_likes',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createUniqueConstraint(
      'community_post_likes',
      new TableUnique({ columnNames: ['post_id', 'user_id'] }),
    );

    await queryRunner.createIndex(
      'community_post_likes',
      new TableIndex({ columnNames: ['post_id'] }),
    );

    await queryRunner.createIndex(
      'community_post_likes',
      new TableIndex({ columnNames: ['user_id'] }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'community_comments',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'post_id', type: 'uuid', isNullable: false },
          { name: 'author_id', type: 'uuid', isNullable: false },
          { name: 'parent_comment_id', type: 'uuid', isNullable: true },
          { name: 'content_html', type: 'text', isNullable: false },
          { name: 'status', type: 'varchar', default: "'published'" },
          { name: 'likes_count', type: 'int', default: 0 },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'community_comments',
      new TableForeignKey({
        columnNames: ['post_id'],
        referencedTableName: 'community_posts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'community_comments',
      new TableForeignKey({
        columnNames: ['author_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'community_comments',
      new TableForeignKey({
        columnNames: ['parent_comment_id'],
        referencedTableName: 'community_comments',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'community_comments',
      new TableIndex({ columnNames: ['post_id', 'created_at'] }),
    );

    await queryRunner.createIndex(
      'community_comments',
      new TableIndex({ columnNames: ['parent_comment_id'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('community_comments', true, true, true);
    await queryRunner.dropTable('community_post_likes', true, true, true);
    await queryRunner.dropTable('community_post_attachments', true, true, true);
    await queryRunner.dropTable('community_posts', true, true, true);
    await queryRunner.dropTable('community_space_course_access', true, true, true);
    await queryRunner.dropTable('community_space_plan_access', true, true, true);
    await queryRunner.dropTable('community_spaces', true, true, true);
  }
}

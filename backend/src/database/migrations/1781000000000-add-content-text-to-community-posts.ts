import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddContentTextToCommunityPosts1781000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'community_posts',
      new TableColumn({
        name: 'content_text',
        type: 'text',
        isNullable: false,
        default: "''",
      }),
    );

    await queryRunner.query(`
      UPDATE community_posts
      SET content_text = trim(regexp_replace(coalesce(content_html, ''), '<[^>]*>', ' ', 'g'))
    `);

    await queryRunner.createIndex(
      'community_posts',
      new TableIndex({
        name: 'IDX_COMMUNITY_POSTS_FEED_CURSOR',
        columnNames: ['space_id', 'status', 'is_pinned', 'pinned_at', 'created_at', 'id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('community_posts', 'IDX_COMMUNITY_POSTS_FEED_CURSOR');
    await queryRunner.dropColumn('community_posts', 'content_text');
  }
}

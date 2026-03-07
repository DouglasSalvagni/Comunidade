import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateAffiliatesAndPartnerships1766500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'affiliates',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'name', type: 'varchar', isNullable: false },
          { name: 'email', type: 'varchar', isNullable: false },
          { name: 'wallet_id', type: 'varchar', isNullable: false },
          { name: 'status', type: 'varchar', isNullable: false, default: `'ACTIVE'` },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'partnerships',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'code', type: 'varchar', isNullable: false, isUnique: true },
          { name: 'status', type: 'varchar', isNullable: false, default: `'ACTIVE'` },
          { name: 'discount_type', type: 'varchar', isNullable: false },
          { name: 'discount_value', type: 'decimal', precision: 10, scale: 2, isNullable: false },
          { name: 'starts_at', type: 'timestamp', isNullable: true },
          { name: 'ends_at', type: 'timestamp', isNullable: true },
          { name: 'max_redemptions', type: 'int', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'partnership_affiliates',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'partnership_id', type: 'uuid', isNullable: false },
          { name: 'affiliate_id', type: 'uuid', isNullable: false },
          { name: 'payout_type', type: 'varchar', isNullable: false },
          { name: 'payout_value', type: 'decimal', precision: 10, scale: 2, isNullable: false },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
        uniques: [
          {
            name: 'UQ_partnership_affiliate',
            columnNames: ['partnership_id', 'affiliate_id'],
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'partnership_affiliates',
      new TableForeignKey({
        columnNames: ['partnership_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'partnerships',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'partnership_affiliates',
      new TableForeignKey({
        columnNames: ['affiliate_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'affiliates',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'user_active_coupons',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'user_id', type: 'uuid', isNullable: false },
          { name: 'partnership_id', type: 'uuid', isNullable: false },
          { name: 'status', type: 'varchar', isNullable: false },
          { name: 'activated_at', type: 'timestamp', isNullable: false },
          { name: 'expires_at', type: 'timestamp', isNullable: true },
          { name: 'used_at', type: 'timestamp', isNullable: true },
          { name: 'last_checkout_id', type: 'varchar', isNullable: true },
          { name: 'snapshot_discount_type', type: 'varchar', isNullable: true },
          { name: 'snapshot_discount_value', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'snapshot_splits_json', type: 'jsonb', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'user_active_coupons',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'user_active_coupons',
      new TableForeignKey({
        columnNames: ['partnership_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'partnerships',
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_user_active_coupons_user_status" ON "user_active_coupons" ("user_id", "status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_active_coupons', true);
    await queryRunner.dropTable('partnership_affiliates', true);
    await queryRunner.dropTable('partnerships', true);
    await queryRunner.dropTable('affiliates', true);
  }
}


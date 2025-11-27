import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateGatewayWebhooks1732550000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'gateway_webhooks',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'gateway',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'event',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'payload',
            type: 'jsonb',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Índices
    await queryRunner.createIndex(
      'gateway_webhooks',
      new TableIndex({
        name: 'IDX_GATEWAY_WEBHOOKS_GATEWAY',
        columnNames: ['gateway'],
      }),
    );

    await queryRunner.createIndex(
      'gateway_webhooks',
      new TableIndex({
        name: 'IDX_GATEWAY_WEBHOOKS_EVENT',
        columnNames: ['event'],
      }),
    );

    await queryRunner.createIndex(
      'gateway_webhooks',
      new TableIndex({
        name: 'IDX_GATEWAY_WEBHOOKS_CREATED',
        columnNames: ['created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('gateway_webhooks');
  }
}

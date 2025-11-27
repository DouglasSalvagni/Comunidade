import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateGatewayMetas1732700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'gateway_metas',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'gateway',
            type: 'varchar',
            length: '50',
            comment: 'Nome do gateway de pagamento (asaas, stripe, etc)',
          },
          {
            name: 'entity_type',
            type: 'varchar',
            length: '50',
            comment: 'Tipo da entidade (plan, user, subscription)',
          },
          {
            name: 'entity_id',
            type: 'uuid',
            comment: 'ID da entidade local',
          },
          {
            name: 'metas',
            type: 'jsonb',
            default: "'{}'",
            comment: 'Metadados específicos do gateway',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Índice único para garantir uma única entrada por gateway/entity_type/entity_id
    await queryRunner.createIndex(
      'gateway_metas',
      new TableIndex({
        name: 'IDX_GATEWAY_METAS_UNIQUE',
        columnNames: ['gateway', 'entity_type', 'entity_id'],
        isUnique: true,
      }),
    );

    // Índice para buscar por entity
    await queryRunner.createIndex(
      'gateway_metas',
      new TableIndex({
        name: 'IDX_GATEWAY_METAS_ENTITY',
        columnNames: ['entity_type', 'entity_id'],
      }),
    );

    // Índice para buscar por gateway
    await queryRunner.createIndex(
      'gateway_metas',
      new TableIndex({
        name: 'IDX_GATEWAY_METAS_GATEWAY',
        columnNames: ['gateway'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('gateway_metas');
  }
}

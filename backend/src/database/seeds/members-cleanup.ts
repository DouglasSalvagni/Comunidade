import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { User } from '../..//modules/users/entities/user.entity'
import { Plan } from '../..//modules/subscriptions/entities/plan.entity'
import { Subscription } from '../..//modules/subscriptions/entities/subscription.entity'
import { SystemSetting } from '../..//modules/settings/entities/system-setting.entity'

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/comunidade'
const isProd = process.env.NODE_ENV === 'production'
const rawSsl = process.env.DB_SSL || process.env.DATABASE_SSL
const useSsl = rawSsl !== undefined
  ? ['true', '1', 'yes', 'on'].includes(String(rawSsl).toLowerCase())
  : isProd

const dataSource = new DataSource({
  type: 'postgres',
  url: dbUrl,
  entities: [
    User,
    Plan,
    Subscription,
    SystemSetting,
  ],
  ssl: useSsl ? { rejectUnauthorized: false } : false,
})

async function run() {
  await dataSource.initialize()
  const userRepo = dataSource.getRepository(User)

  console.log('Cleanup: Removendo membros de teste...')

  const result = await userRepo
    .createQueryBuilder()
    .delete()
    .from(User)
    .where('email LIKE :pattern', { pattern: '%@example-seed.com' })
    .execute()

  console.log(`Cleanup finalizado! ${result.affected || 0} membros removidos.`)
  await dataSource.destroy()
}

run().catch((error) => {
  console.error('Erro ao executar cleanup de membros:', error)
  process.exit(1)
})

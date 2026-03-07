import 'reflect-metadata'
import { DataSource } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { User } from '@/modules/users/entities/user.entity'
import { Subscription } from '@/modules/subscriptions/entities/subscription.entity'
import { Plan } from '@/modules/subscriptions/entities/plan.entity'

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/little_tales'
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
  ],
  ssl: useSsl ? { rejectUnauthorized: false } : false,
})

async function run() {
  await dataSource.initialize()
  const userRepo = dataSource.getRepository(User)
  const planRepo = dataSource.getRepository(Plan)

  // Criar planos se a tabela estiver vazia
  const plansCount = await planRepo.count()

  if (plansCount === 0) {
    const plansData = [
      {
        slug: 'plano-gratuito',
        name: 'Gratuito',
        description: 'Acesso limitado ao conteúdo',
        priceCents: 0,
        billingPeriod: 'monthly' as const,
        features: [
          '10 músicas por mês',
          'Audiobooks limitados',
          'Anúncios',
        ],
        isActive: true,
      },
      {
        slug: 'plano-mensal',
        name: 'Premium Mensal',
        description: 'Acesso completo mensal',
        priceCents: 1990,
        billingPeriod: 'monthly' as const,
        features: [
          'Músicas ilimitadas',
          'Audiobooks ilimitados',
          'Sem anúncios',
          'Downloads offline',
          'Qualidade HD',
        ],
        isActive: true,
      },
    ]

    for (const planData of plansData) {
      await planRepo.save(planRepo.create(planData))
      console.log('Seed: plano criado', planData.name)
    }
  } else {
    console.log('Seed: planos já existem, pulando criação')
  }

  const email = process.env.SEED_USER_EMAIL || 'douglassalvagni@outlook.com'
  const password = process.env.SEED_USER_PASSWORD || 'password123'

  const existing = await userRepo.findOne({ where: { email } })
  if (existing) {
    console.log('Seed: usuário já existe', email)
    await dataSource.destroy()
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = userRepo.create({
    email,
    name: 'Usuário',
    passwordHash,
    role: 'user',
    isActive: true,
    emailVerified: true,
  })
  await userRepo.save(user)
  console.log('Seed: usuário criado', user.email)

  await dataSource.destroy()
}

run().catch(async (err) => {
  console.error('Seed: erro', err)
  try {
    await dataSource.destroy()
  } catch { }
  process.exit(1)
})

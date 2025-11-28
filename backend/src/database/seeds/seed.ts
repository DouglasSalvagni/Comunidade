import 'reflect-metadata'
import { DataSource } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { User } from '@/modules/users/entities/user.entity'
import { Profile } from '@/modules/profiles/entities/profile.entity'
import { Subscription } from '@/modules/subscriptions/entities/subscription.entity'
import { Favorite } from '@/modules/catalog/entities/favorite.entity'
import { Work } from '@/modules/catalog/entities/work.entity'
import { Track } from '@/modules/catalog/entities/track.entity'
import { Chapter } from '@/modules/catalog/entities/chapter.entity'
import { Tag } from '@/modules/catalog/entities/tag.entity'
import { Plan } from '@/modules/subscriptions/entities/plan.entity'
import { PlayEvent } from '@/modules/playback/entities/play-event.entity'
import { Download } from '@/modules/playback/entities/download.entity'
import { WorkTag } from '@/modules/catalog/entities/work-tag.entity'

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
    Profile,
    Work,
    Track,
    Chapter,
    Tag,
    Plan,
    Subscription,
    Favorite,
    PlayEvent,
    Download,
    WorkTag,
  ],
  ssl: useSsl ? { rejectUnauthorized: false } : false,
})

async function run() {
  await dataSource.initialize()
  const userRepo = dataSource.getRepository(User)
  const planRepo = dataSource.getRepository(Plan)
  const tagRepo = dataSource.getRepository(Tag)
  const workRepo = dataSource.getRepository(Work)
  const trackRepo = dataSource.getRepository(Track)

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

  const email = process.env.SEED_USER_EMAIL || 'user@little-tales.com'
  const password = process.env.SEED_USER_PASSWORD || 'password'

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

  const tagA = await tagRepo.save(tagRepo.create({ name: 'Aventura', color: '#ff9900' }))
  const tagB = await tagRepo.save(tagRepo.create({ name: 'Educativo', color: '#33aa55' }))

  const work = workRepo.create({
    title: 'Contos Musicais',
    description: 'Coleção de músicas para crianças',
    type: 'music',
    recommendedMinMonths: 36,
    recommendedMaxMonths: 96,
    recommendedAgeLabel: '3–8 anos',
    isActive: true,
    tags: [tagA, tagB],
  } as Partial<Work>)
  const savedWork = await workRepo.save(work)
  await trackRepo.save(trackRepo.create({ workId: savedWork.id, title: 'Faixa 1', orderIndex: 0 }))
  await dataSource.destroy()
}

run().catch(async (err) => {
  console.error('Seed: erro', err)
  try {
    await dataSource.destroy()
  } catch { }
  process.exit(1)
})

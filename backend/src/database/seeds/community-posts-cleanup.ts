import 'reflect-metadata'
import { DataSource, In } from 'typeorm'
import AppDataSource from '../datasource'
import { CommunityPost } from '../../modules/community/entities/community-post.entity'
import { CommunityComment } from '../../modules/community/entities/community-comment.entity'

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/comunidade'
const isProd = process.env.NODE_ENV === 'production'
const rawSsl = process.env.DB_SSL || process.env.DATABASE_SSL
const useSsl = rawSsl !== undefined
  ? ['true', '1', 'yes', 'on'].includes(String(rawSsl).toLowerCase())
  : isProd

const SEED_AUTHOR_ID = '5bcbe39e-8368-4aa3-9c95-652af1664760'
const SEED_TAG = '[SEED_COMMUNITY_POSTS]'

const dataSource = new DataSource({
  ...(AppDataSource.options as any),
  type: 'postgres',
  url: dbUrl,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
} as any)

async function run() {
  await dataSource.initialize()
  const postRepo = dataSource.getRepository(CommunityPost)
  const commentRepo = dataSource.getRepository(CommunityComment)

  const posts = await postRepo
    .createQueryBuilder('post')
    .select(['post.id'])
    .where('post.authorId = :authorId', { authorId: SEED_AUTHOR_ID })
    .andWhere(
      '(post.title ILIKE :tag OR post.contentText ILIKE :tag)',
      { tag: `%${SEED_TAG}%` },
    )
    .getMany()

  if (posts.length === 0) {
    console.log('Cleanup finalizado! Nenhum post de seed encontrado.')
    await dataSource.destroy()
    return
  }

  const postIds = posts.map((post) => post.id)

  const deletedComments = await commentRepo.delete({ postId: In(postIds) })
  const deletedPosts = await postRepo.delete({ id: In(postIds) })

  console.log(`Cleanup finalizado! ${deletedPosts.affected || 0} posts e ${deletedComments.affected || 0} comentários removidos.`)
  await dataSource.destroy()
}

run().catch(async (error) => {
  console.error('Erro ao executar cleanup de posts/comentários:', error)
  try {
    await dataSource.destroy()
  } catch { }
  process.exit(1)
})

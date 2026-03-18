import 'reflect-metadata'
import { DataSource } from 'typeorm'
import AppDataSource from '../datasource'
import { User } from '../../modules/users/entities/user.entity'
import { CommunitySpace } from '../../modules/community/entities/community-space.entity'
import { CommunityPost } from '../../modules/community/entities/community-post.entity'
import { CommunityComment } from '../../modules/community/entities/community-comment.entity'

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/comunidade'
const isProd = process.env.NODE_ENV === 'production'
const rawSsl = process.env.DB_SSL || process.env.DATABASE_SSL
const useSsl = rawSsl !== undefined
  ? ['true', '1', 'yes', 'on'].includes(String(rawSsl).toLowerCase())
  : isProd

const SEED_AUTHOR_ID = '5bcbe39e-8368-4aa3-9c95-652af1664760'
const SEED_SPACE_ID = 'e50b597d-db67-4714-9df8-f2313ed9af31'
const SEED_TAG = '[SEED_COMMUNITY_POSTS]'

const dataSource = new DataSource({
  ...(AppDataSource.options as any),
  type: 'postgres',
  url: dbUrl,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
} as any)

function toSearchableText(contentHtml: string): string {
  return contentHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function run() {
  await dataSource.initialize()
  const userRepo = dataSource.getRepository(User)
  const spaceRepo = dataSource.getRepository(CommunitySpace)
  const postRepo = dataSource.getRepository(CommunityPost)
  const commentRepo = dataSource.getRepository(CommunityComment)

  const author = await userRepo.findOne({ where: { id: SEED_AUTHOR_ID } })
  if (!author) {
    throw new Error(`Usuário autor não encontrado: ${SEED_AUTHOR_ID}`)
  }

  const targetSpace = await spaceRepo.findOne({
    where: { id: SEED_SPACE_ID, isActive: true },
  })

  if (!targetSpace) {
    throw new Error(`Espaço não encontrado ou inativo: ${SEED_SPACE_ID}`)
  }

  let postsCreated = 0
  let commentsCreated = 0

  for (let i = 1; i <= 4; i++) {
    const title = `${SEED_TAG} Post ${i} em ${targetSpace.slug}`
    const contentHtml = `<p>${SEED_TAG} Conteúdo de teste ${i} no espaço <strong>${targetSpace.name}</strong>.</p><p>Este texto foi criado para validar busca e paginação.</p>`
    const isPinned = i === 1
    const pinnedAt = isPinned ? new Date(Date.now() - i * 60000) : null

    const post = postRepo.create({
      spaceId: targetSpace.id,
      authorId: SEED_AUTHOR_ID,
      title,
      contentHtml,
      contentText: toSearchableText(contentHtml),
      isPinned,
      pinnedAt,
      status: 'published',
      likesCount: 0,
      commentsCount: 0,
    })

    const savedPost = await postRepo.save(post)
    postsCreated++

    const rootCommentA = await commentRepo.save(
      commentRepo.create({
        postId: savedPost.id,
        authorId: SEED_AUTHOR_ID,
        parentCommentId: null,
        contentHtml: `<p>${SEED_TAG} Comentário A no post ${i}.</p>`,
        status: 'published',
        likesCount: 0,
      }),
    )
    commentsCreated++

    await commentRepo.save(
      commentRepo.create({
        postId: savedPost.id,
        authorId: SEED_AUTHOR_ID,
        parentCommentId: rootCommentA.id,
        contentHtml: `<p>${SEED_TAG} Resposta ao comentário A no post ${i}.</p>`,
        status: 'published',
        likesCount: 0,
      }),
    )
    commentsCreated++

    await commentRepo.save(
      commentRepo.create({
        postId: savedPost.id,
        authorId: SEED_AUTHOR_ID,
        parentCommentId: null,
        contentHtml: `<p>${SEED_TAG} Comentário B no post ${i}.</p>`,
        status: 'published',
        likesCount: 0,
      }),
    )
    commentsCreated++

    await postRepo.update({ id: savedPost.id }, { commentsCount: 3 })
  }

  console.log(`Seed finalizado! ${postsCreated} posts e ${commentsCreated} comentários criados.`)
  await dataSource.destroy()
}

run().catch(async (error) => {
  console.error('Erro ao executar seed de posts/comentários:', error)
  try {
    await dataSource.destroy()
  } catch { }
  process.exit(1)
})

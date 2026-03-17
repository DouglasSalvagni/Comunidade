import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { CommunitySpace } from './entities/community-space.entity';
import { CommunitySpacePlanAccess } from './entities/community-space-plan-access.entity';
import { CommunitySpaceCourseAccess } from './entities/community-space-course-access.entity';
import { CommunityPost } from './entities/community-post.entity';
import { CommunityPostAttachment } from './entities/community-post-attachment.entity';
import { CommunityPostLike } from './entities/community-post-like.entity';
import { CommunityComment } from './entities/community-comment.entity';
import { CreateCommunitySpaceDto } from './dto/create-community-space.dto';
import { UpdateCommunitySpaceDto } from './dto/update-community-space.dto';
import { CommunityAccessService } from './community-access.service';
import { CreateCommunityPostDto } from './dto/create-community-post.dto';
import { StorageService } from '@/modules/courses/storage.service';
import { CreateCommunityCommentDto } from './dto/create-community-comment.dto';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(CommunitySpace)
    private readonly spaceRepo: Repository<CommunitySpace>,
    @InjectRepository(CommunitySpacePlanAccess)
    private readonly spacePlanAccessRepo: Repository<CommunitySpacePlanAccess>,
    @InjectRepository(CommunitySpaceCourseAccess)
    private readonly spaceCourseAccessRepo: Repository<CommunitySpaceCourseAccess>,
    @InjectRepository(CommunityPost)
    private readonly postRepo: Repository<CommunityPost>,
    @InjectRepository(CommunityPostAttachment)
    private readonly postAttachmentRepo: Repository<CommunityPostAttachment>,
    @InjectRepository(CommunityPostLike)
    private readonly postLikeRepo: Repository<CommunityPostLike>,
    @InjectRepository(CommunityComment)
    private readonly commentRepo: Repository<CommunityComment>,
    private readonly communityAccessService: CommunityAccessService,
    private readonly storageService: StorageService,
  ) {}

  async adminListSpaces(): Promise<CommunitySpace[]> {
    return this.spaceRepo.find({
      relations: ['planAccess', 'planAccess.plan', 'courseAccess', 'courseAccess.course'],
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async adminGetSpace(spaceId: string): Promise<CommunitySpace> {
    const space = await this.spaceRepo.findOne({
      where: { id: spaceId },
      relations: ['planAccess', 'planAccess.plan', 'courseAccess', 'courseAccess.course'],
    });
    if (!space) {
      throw new NotFoundException('Espaço não encontrado');
    }
    return space;
  }

  async adminCreateSpace(dto: CreateCommunitySpaceDto, creatorId: string): Promise<CommunitySpace> {
    await this.ensureUniqueSlug(dto.slug);

    const space = this.spaceRepo.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description ?? null,
      visibility: dto.visibility ?? 'public',
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
      createdBy: creatorId,
    });
    const saved = await this.spaceRepo.save(space);

    if (dto.planIds && dto.planIds.length > 0) {
      await this.adminUpdatePlanAccess(saved.id, dto.planIds);
    }
    if (dto.courseIds && dto.courseIds.length > 0) {
      await this.adminUpdateCourseAccess(saved.id, dto.courseIds);
    }

    return this.adminGetSpace(saved.id);
  }

  async adminUpdateSpace(spaceId: string, dto: UpdateCommunitySpaceDto): Promise<CommunitySpace> {
    const space = await this.spaceRepo.findOne({ where: { id: spaceId } });
    if (!space) {
      throw new NotFoundException('Espaço não encontrado');
    }

    if (dto.slug !== undefined && dto.slug !== space.slug) {
      await this.ensureUniqueSlug(dto.slug, space.id);
      space.slug = dto.slug;
    }
    if (dto.name !== undefined) space.name = dto.name;
    if (dto.description !== undefined) space.description = dto.description;
    if (dto.visibility !== undefined) space.visibility = dto.visibility;
    if (dto.isActive !== undefined) space.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) space.sortOrder = dto.sortOrder;

    await this.spaceRepo.save(space);
    return this.adminGetSpace(space.id);
  }

  async adminDeleteSpace(spaceId: string): Promise<void> {
    const space = await this.spaceRepo.findOne({ where: { id: spaceId } });
    if (!space) {
      throw new NotFoundException('Espaço não encontrado');
    }
    await this.spaceRepo.remove(space);
  }

  async adminUpdatePlanAccess(spaceId: string, planIds: string[]): Promise<CommunitySpacePlanAccess[]> {
    await this.ensureSpaceExists(spaceId);
    await this.spacePlanAccessRepo.delete({ spaceId });

    if (planIds.length > 0) {
      const entities = planIds.map((planId) => this.spacePlanAccessRepo.create({ spaceId, planId }));
      await this.spacePlanAccessRepo.save(entities);
    }

    return this.spacePlanAccessRepo.find({
      where: { spaceId },
      relations: ['plan'],
      order: { id: 'ASC' },
    });
  }

  async adminUpdateCourseAccess(spaceId: string, courseIds: string[]): Promise<CommunitySpaceCourseAccess[]> {
    await this.ensureSpaceExists(spaceId);
    await this.spaceCourseAccessRepo.delete({ spaceId });

    if (courseIds.length > 0) {
      const entities = courseIds.map((courseId) => this.spaceCourseAccessRepo.create({ spaceId, courseId }));
      await this.spaceCourseAccessRepo.save(entities);
    }

    return this.spaceCourseAccessRepo.find({
      where: { spaceId },
      relations: ['course'],
      order: { id: 'ASC' },
    });
  }

  async listSpacesForUser(userId: string, userRole: 'user' | 'admin'): Promise<CommunitySpace[]> {
    const spaces = await this.spaceRepo.find({
      where: { isActive: true },
      relations: ['planAccess', 'courseAccess'],
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });

    if (userRole === 'admin') {
      return spaces;
    }

    return this.communityAccessService.filterAccessibleSpaces(userId, spaces);
  }

  async listFeedBySpace(
    spaceId: string,
    userId: string,
    userRole: 'user' | 'admin',
    limit = 20,
  ): Promise<CommunityPost[]> {
    await this.assertCanReadSpace(spaceId, userId, userRole);
    return this.postRepo.find({
      where: { spaceId, status: 'published' },
      relations: ['author', 'attachments'],
      order: { isPinned: 'DESC', pinnedAt: 'DESC', createdAt: 'DESC' },
      take: Math.min(Math.max(limit, 1), 50),
    });
  }

  async createPostInSpace(
    spaceId: string,
    userId: string,
    userRole: 'user' | 'admin',
    dto: CreateCommunityPostDto,
  ): Promise<CommunityPost> {
    await this.assertCanReadSpace(spaceId, userId, userRole);

    const post = this.postRepo.create({
      spaceId,
      authorId: userId,
      title: dto.title ?? null,
      contentHtml: dto.contentHtml,
      status: 'published',
    });

    const saved = await this.postRepo.save(post);
    return this.getPostDetail(saved.id);
  }

  async adminPinPost(postId: string): Promise<CommunityPost> {
    const post = await this.getPostOrFail(postId);
    post.isPinned = true;
    post.pinnedAt = new Date();
    await this.postRepo.save(post);
    return this.getPostDetail(post.id);
  }

  async adminUnpinPost(postId: string): Promise<CommunityPost> {
    const post = await this.getPostOrFail(postId);
    post.isPinned = false;
    post.pinnedAt = null;
    await this.postRepo.save(post);
    return this.getPostDetail(post.id);
  }

  async generatePostAttachmentUploadUrl(
    postId: string,
    userId: string,
    userRole: 'user' | 'admin',
    fileName: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; key: string }> {
    this.assertAttachmentMimeTypeAllowed(contentType);
    const post = await this.getPostOrFail(postId);
    if (userRole !== 'admin' && post.authorId !== userId) {
      throw new ForbiddenException('Sem permissão para anexar arquivo neste post');
    }

    const safeName = this.sanitizeFileName(fileName);
    const key = `community/posts/${postId}/${randomUUID()}-${safeName}`;
    return this.storageService.generateAttachmentUploadUrl(key, contentType);
  }

  async addPostAttachment(
    postId: string,
    userId: string,
    userRole: 'user' | 'admin',
    payload: { fileKey: string; fileName: string; contentType: string; sizeBytes?: number },
  ): Promise<CommunityPostAttachment> {
    this.assertAttachmentMimeTypeAllowed(payload.contentType);
    const post = await this.getPostOrFail(postId);
    if (userRole !== 'admin' && post.authorId !== userId) {
      throw new ForbiddenException('Sem permissão para anexar arquivo neste post');
    }

    const attachment = this.postAttachmentRepo.create({
      postId,
      fileKey: payload.fileKey,
      fileName: payload.fileName,
      contentType: payload.contentType,
      sizeBytes: payload.sizeBytes ?? 0,
    });
    return this.postAttachmentRepo.save(attachment);
  }

  async getPostDetail(postId: string): Promise<CommunityPost> {
    const post = await this.postRepo.findOne({
      where: { id: postId },
      relations: ['author', 'attachments', 'space'],
    });
    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }
    return post;
  }

  async getPostForUser(postId: string, userId: string, userRole: 'user' | 'admin'): Promise<CommunityPost> {
    const post = await this.getPostDetail(postId);
    await this.assertCanReadSpace(post.spaceId, userId, userRole);
    return post;
  }

  async togglePostLike(
    postId: string,
    userId: string,
    userRole: 'user' | 'admin',
  ): Promise<{ liked: boolean; likesCount: number }> {
    const post = await this.getPostOrFail(postId);
    await this.assertCanReadSpace(post.spaceId, userId, userRole);

    const existing = await this.postLikeRepo.findOne({ where: { postId, userId } });
    if (existing) {
      await this.postLikeRepo.remove(existing);
      await this.postRepo.decrement({ id: postId }, 'likesCount', 1);
      const updated = await this.getPostOrFail(postId);
      if (updated.likesCount < 0) {
        updated.likesCount = 0;
        await this.postRepo.save(updated);
      }
      return { liked: false, likesCount: Math.max(updated.likesCount, 0) };
    }

    const like = this.postLikeRepo.create({ postId, userId });
    await this.postLikeRepo.save(like);
    await this.postRepo.increment({ id: postId }, 'likesCount', 1);
    const updated = await this.getPostOrFail(postId);
    return { liked: true, likesCount: updated.likesCount };
  }

  async createCommentOnPost(
    postId: string,
    userId: string,
    userRole: 'user' | 'admin',
    dto: CreateCommunityCommentDto,
  ): Promise<CommunityComment> {
    const post = await this.getPostOrFail(postId);
    await this.assertCanReadSpace(post.spaceId, userId, userRole);

    let parentCommentId: string | null = null;
    if (dto.parentCommentId) {
      const parent = await this.commentRepo.findOne({
        where: { id: dto.parentCommentId, postId, status: 'published' },
      });
      if (!parent) {
        throw new NotFoundException('Comentário pai não encontrado');
      }
      if (parent.parentCommentId) {
        throw new BadRequestException('Profundidade máxima de resposta atingida');
      }
      parentCommentId = parent.id;
    }

    const comment = this.commentRepo.create({
      postId,
      authorId: userId,
      parentCommentId,
      contentHtml: dto.contentHtml,
      status: 'published',
    });
    const saved = await this.commentRepo.save(comment);
    await this.postRepo.increment({ id: postId }, 'commentsCount', 1);

    return this.commentRepo.findOneOrFail({
      where: { id: saved.id },
      relations: ['author'],
    });
  }

  async listCommentsByPost(
    postId: string,
    userId: string,
    userRole: 'user' | 'admin',
    limit = 20,
    cursor?: string,
  ): Promise<{
    data: Array<CommunityComment & { replies: CommunityComment[] }>;
    meta: { nextCursor: string | null; hasMore: boolean; limit: number };
  }> {
    const post = await this.getPostOrFail(postId);
    await this.assertCanReadSpace(post.spaceId, userId, userRole);

    const normalizedLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
    const decoded = this.decodeCommentsCursor(cursor);

    const query = this.commentRepo
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .where('comment.postId = :postId', { postId })
      .andWhere('comment.status = :status', { status: 'published' })
      .andWhere('comment.parentCommentId IS NULL');

    if (decoded) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('comment.createdAt < :cursorCreatedAt', { cursorCreatedAt: decoded.createdAt }).orWhere(
            '(comment.createdAt = :cursorCreatedAt AND comment.id < :cursorId)',
            { cursorCreatedAt: decoded.createdAt, cursorId: decoded.id },
          );
        }),
      );
    }

    const rows = await query
      .orderBy('comment.createdAt', 'DESC')
      .addOrderBy('comment.id', 'DESC')
      .take(normalizedLimit + 1)
      .getMany();

    const hasMore = rows.length > normalizedLimit;
    const selected = hasMore ? rows.slice(0, normalizedLimit) : rows;
    const rootIds = selected.map((comment) => comment.id);

    let replies: CommunityComment[] = [];
    if (rootIds.length > 0) {
      replies = await this.commentRepo.find({
        where: { parentCommentId: In(rootIds), status: 'published' },
        relations: ['author'],
        order: { createdAt: 'ASC', id: 'ASC' },
      });
    }

    const repliesByParent = new Map<string, CommunityComment[]>();
    for (const reply of replies) {
      const key = reply.parentCommentId as string;
      if (!repliesByParent.has(key)) repliesByParent.set(key, []);
      repliesByParent.get(key)!.push(reply);
    }

    const data = selected.map((comment) => ({
      ...comment,
      replies: repliesByParent.get(comment.id) || [],
    }));

    const last = selected[selected.length - 1];
    return {
      data,
      meta: {
        nextCursor: hasMore && last ? this.encodeCommentsCursor(last) : null,
        hasMore,
        limit: normalizedLimit,
      },
    };
  }

  private async ensureUniqueSlug(slug: string, ignoreSpaceId?: string): Promise<void> {
    const existing = await this.spaceRepo.findOne({ where: { slug } });
    if (existing && existing.id !== ignoreSpaceId) {
      throw new ConflictException('Slug de espaço já existe');
    }
  }

  private async ensureSpaceExists(spaceId: string): Promise<void> {
    const exists = await this.spaceRepo.findOne({ where: { id: spaceId } });
    if (!exists) {
      throw new NotFoundException('Espaço não encontrado');
    }
  }

  private async assertCanReadSpace(spaceId: string, userId: string, userRole: 'user' | 'admin'): Promise<void> {
    if (userRole === 'admin') {
      const exists = await this.spaceRepo.findOne({ where: { id: spaceId, isActive: true } });
      if (!exists) {
        throw new NotFoundException('Espaço não encontrado');
      }
      return;
    }

    const canRead = await this.communityAccessService.canReadSpace(userId, spaceId);
    if (!canRead) {
      throw new ForbiddenException('Sem acesso a este espaço');
    }
  }

  private async getPostOrFail(postId: string): Promise<CommunityPost> {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }
    return post;
  }

  private assertAttachmentMimeTypeAllowed(contentType: string): void {
    if (contentType.startsWith('image/')) {
      return;
    }
    if (contentType === 'application/pdf') {
      return;
    }
    throw new ForbiddenException('Tipo de arquivo não permitido');
  }

  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  }

  private encodeCommentsCursor(comment: Pick<CommunityComment, 'id' | 'createdAt'>): string {
    const payload = JSON.stringify({ id: comment.id, createdAt: comment.createdAt.toISOString() });
    return Buffer.from(payload).toString('base64url');
  }

  private decodeCommentsCursor(cursor?: string): { id: string; createdAt: Date } | null {
    if (!cursor) return null;
    try {
      const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
      if (!parsed?.id || !parsed?.createdAt) return null;
      const createdAt = new Date(parsed.createdAt);
      if (Number.isNaN(createdAt.getTime())) return null;
      return { id: String(parsed.id), createdAt };
    } catch {
      return null;
    }
  }
}

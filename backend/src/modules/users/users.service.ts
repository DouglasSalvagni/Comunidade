import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Subscription } from '@/modules/subscriptions/entities/subscription.entity';
import { StorageService } from '@/modules/courses/storage.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    private readonly storageService: StorageService,
  ) { }

  private encodeMembersCursor(user: Pick<User, 'id' | 'createdAt'>): string {
    const payload = JSON.stringify({ id: user.id, createdAt: user.createdAt.toISOString() });
    return Buffer.from(payload).toString('base64url');
  }

  private decodeMembersCursor(cursor?: string): { id: string; createdAt: Date } | null {
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

  private async resolveAvatarUrl(avatarKey?: string | null): Promise<string | null> {
    if (!avatarKey) return null;
    try {
      return await this.storageService.generateViewUrl(avatarKey);
    } catch {
      return null;
    }
  }

  async listMembersCursor(
    limit = 20,
    cursor?: string,
    search?: string,
  ): Promise<{
    data: Array<{
      id: string;
      name: string;
      bio: string | null;
      profileLinks: Array<{ label: string; url: string }>;
      avatarUrl: string | null;
      createdAt: Date;
    }>;
    meta: { nextCursor: string | null; hasMore: boolean; limit: number };
  }> {
    const normalizedLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
    const decodedCursor = this.decodeMembersCursor(cursor);
    const normalizedSearch = (search || '').trim();

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.name',
        'user.bio',
        'user.profileLinks',
        'user.avatarKey',
        'user.createdAt',
      ])
      .where('user.isActive = :isActive', { isActive: true })
      .andWhere('user.role = :role', { role: 'user' });

    if (normalizedSearch) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('user.name ILIKE :search', { search: `%${normalizedSearch}%` }).orWhere(
            'user.email ILIKE :search',
            { search: `%${normalizedSearch}%` },
          );
        }),
      );
    }

    if (decodedCursor) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('user.createdAt < :cursorCreatedAt', { cursorCreatedAt: decodedCursor.createdAt }).orWhere(
            '(user.createdAt = :cursorCreatedAt AND user.id < :cursorId)',
            { cursorCreatedAt: decodedCursor.createdAt, cursorId: decodedCursor.id },
          );
        }),
      );
    }

    const rows = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .addOrderBy('user.id', 'DESC')
      .take(normalizedLimit + 1)
      .getMany();

    const hasMore = rows.length > normalizedLimit;
    const selectedRows = hasMore ? rows.slice(0, normalizedLimit) : rows;

    const data = await Promise.all(
      selectedRows.map(async (member) => ({
        id: member.id,
        name: member.name,
        bio: member.bio || null,
        profileLinks: Array.isArray(member.profileLinks) ? member.profileLinks : [],
        avatarUrl: await this.resolveAvatarUrl(member.avatarKey),
        createdAt: member.createdAt,
      })),
    );

    const last = selectedRows[selectedRows.length - 1];
    return {
      data,
      meta: {
        nextCursor: hasMore && last ? this.encodeMembersCursor(last) : null,
        hasMore,
        limit: normalizedLimit,
      },
    };
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async createWithPasswordHash(data: {
    name: string;
    email: string;
    passwordHash: string;
    role?: 'user' | 'admin';
    isActive?: boolean;
    emailVerified?: boolean;
    authProvider?: 'local' | 'google' | 'apple';
    appleUserId?: string;
  }): Promise<User> {
    const user = this.userRepository.create({
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role ?? 'user',
      isActive: data.isActive ?? true,
      emailVerified: data.emailVerified ?? true,
      authProvider: data.authProvider ?? 'local',
      appleUserId: data.appleUserId ?? null,
    } as User);
    return this.userRepository.save(user);
  }

  async findAll(): Promise<Array<User & { currentSubscription?: Subscription | null }>> {
    const users = await this.userRepository.find();
    if (users.length === 0) {
      return users;
    }
    const now = new Date();
    const subscriptions = await this.subscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .where('subscription.status IN (:...statuses)', { statuses: ['active', 'expiring'] })
      .andWhere('subscription.periodStart <= :now OR subscription.periodStart IS NULL', { now })
      .andWhere('(subscription.periodEnd >= :now OR subscription.periodEnd IS NULL)', { now })
      .orderBy('subscription.createdAt', 'DESC')
      .getMany();
    const subscriptionByUser = new Map<string, Subscription>();
    for (const subscription of subscriptions) {
      if (!subscriptionByUser.has(subscription.userId)) {
        subscriptionByUser.set(subscription.userId, subscription);
      }
    }
    return users.map((user) => ({
      ...user,
      currentSubscription: subscriptionByUser.get(user.id) ?? null,
    }));
  }

  async findAllPaginated(
    page = 1,
    limit = 20,
    search?: string,
  ): Promise<{ data: Array<User & { currentSubscription?: Subscription | null }>; meta: any }> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .orderBy('user.createdAt', 'DESC');

    if (search) {
      queryBuilder.andWhere('(user.name ILIKE :search OR user.email ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    if (data.length === 0) {
      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    const userIds = data.map((user) => user.id);
    const now = new Date();
    const subscriptions = await this.subscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .where('subscription.userId IN (:...userIds)', { userIds })
      .andWhere('subscription.status IN (:...statuses)', { statuses: ['active', 'expiring'] })
      .andWhere('subscription.periodStart <= :now OR subscription.periodStart IS NULL', { now })
      .andWhere('(subscription.periodEnd >= :now OR subscription.periodEnd IS NULL)', { now })
      .orderBy('subscription.createdAt', 'DESC')
      .getMany();

    const subscriptionByUser = new Map<string, Subscription>();
    for (const subscription of subscriptions) {
      if (!subscriptionByUser.has(subscription.userId)) {
        subscriptionByUser.set(subscription.userId, subscription);
      }
    }

    const users = data.map((user) => ({
      ...user,
      currentSubscription: subscriptionByUser.get(user.id) ?? null,
    }));

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByAppleUserId(appleUserId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { appleUserId } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<User> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    user.passwordHash = passwordHash;
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.userRepository.remove(user);
  }

  async toggleStatus(id: string): Promise<User> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.isActive = !user.isActive;
    return this.userRepository.save(user);
  }
}

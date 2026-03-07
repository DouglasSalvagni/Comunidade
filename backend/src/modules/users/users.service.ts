import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Subscription } from '@/modules/subscriptions/entities/subscription.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) { }

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

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, MoreThanOrEqual, LessThanOrEqual, Between, IsNull } from 'typeorm';
import { Work } from './entities/work.entity';
import { Track } from './entities/track.entity';
import { Tag } from './entities/tag.entity';
import { DevTheme } from './entities/dev-theme.entity';
import { WorkLandingSample } from './entities/work-landing-sample.entity';
import { Favorite } from './entities/favorite.entity';
import { Profile } from '@/modules/profiles/entities/profile.entity';
import { TrackPlayGlobalCount } from '@/modules/playback/entities/track-play-global-count.entity';
import { TrackPlayUserCount } from '@/modules/playback/entities/track-play-user-count.entity';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';
import { SearchWorksDto } from './dto/search-works.dto';
import { MediaService } from '@/modules/media/media.service';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Work)
    private readonly workRepository: Repository<Work>,
    @InjectRepository(Track)
    private readonly trackRepository: Repository<Track>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(DevTheme)
    private readonly devThemeRepository: Repository<DevTheme>,
    @InjectRepository(WorkLandingSample)
    private readonly workLandingSampleRepository: Repository<WorkLandingSample>,
    @InjectRepository(Favorite)
    private readonly favoriteRepository: Repository<Favorite>,
    private readonly mediaService: MediaService,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(TrackPlayGlobalCount)
    private readonly trackPlayGlobalCountRepository: Repository<TrackPlayGlobalCount>,
    @InjectRepository(TrackPlayUserCount)
    private readonly trackPlayUserCountRepository: Repository<TrackPlayUserCount>,
  ) { }

  async findAll(searchDto: SearchWorksDto, userId?: string, profileId?: string): Promise<{ data: Work[]; meta: any }> {
    const { type, agePointMonths, minMonths, maxMonths, tags, devThemes, search, page = 1, limit = 20, sort } = searchDto as any;

    const queryBuilder = this.workRepository
      .createQueryBuilder('work')
      .leftJoinAndSelect('work.tracks', 'tracks')
      .leftJoinAndSelect('work.tags', 'tags')
      .leftJoinAndSelect('work.devThemes', 'devThemes')
      .where('work.isActive = :isActive', { isActive: true });

    // Apply sorting
    if (sort && typeof sort === 'string') {
      const [field, direction] = sort.split(':');
      if (field === 'createdAt' && (direction === 'asc' || direction === 'desc')) {
        queryBuilder.orderBy('work.createdAt', direction.toUpperCase() as 'ASC' | 'DESC');
      } else if (field === 'title' && (direction === 'asc' || direction === 'desc')) {
        queryBuilder.orderBy('work.title', direction.toUpperCase() as 'ASC' | 'DESC');
      } else {
        queryBuilder.orderBy('work.createdAt', 'DESC');
      }
    } else {
      queryBuilder.orderBy('work.createdAt', 'DESC');
    }

    if (type) {
      queryBuilder.andWhere('work.type = :type', { type });
    }

    if (typeof agePointMonths === 'number') {
      queryBuilder.andWhere('work.recommended_min_months <= :agePointMonths AND work.recommended_max_months >= :agePointMonths', { agePointMonths });
    } else if (typeof minMonths === 'number' && typeof maxMonths === 'number') {
      queryBuilder.andWhere('work.recommended_min_months <= :maxMonths AND work.recommended_max_months >= :minMonths', { minMonths, maxMonths });
    }

    if (tags && tags.length > 0) {
      const tagArray = tags.split(',');
      queryBuilder
        .innerJoin('work.workTags', 'workTags')
        .innerJoin('workTags.tag', 'tag')
        .andWhere('tag.name IN (:...tagNames)', { tagNames: tagArray });
    }

    if (devThemes && devThemes.length > 0) {
      const themeArray = devThemes.split(',');
      queryBuilder
        .innerJoin('work.workDevThemes', 'workDevThemes')
        .innerJoin('workDevThemes.theme', 'theme')
        .andWhere('theme.name IN (:...themeNames)', { themeNames: themeArray });
    }

    if (search) {
      queryBuilder.andWhere(
        '(work.title ILIKE :search OR work.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Catálogo não aplica filtro por idade

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    if (userId) {
      const workIds = data.map(work => work.id);
      const whereClause = profileId
        ? { profileId, userId, workId: In(workIds) }
        : { userId, workId: In(workIds) };

      const favorites = await this.favoriteRepository.find({ where: whereClause });
      const favoriteWorkIds = new Set(favorites.map(f => f.workId));
      data.forEach(work => { (work as any).isFavorite = favoriteWorkIds.has(work.id); });
    }

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

  async findSuggested(userId?: string, profileId?: string, page = 1, limit = 20): Promise<{ data: Work[]; meta: any }> {
    const qb = this.workRepository
      .createQueryBuilder('work')
      .leftJoinAndSelect('work.tags', 'tags')
      .leftJoinAndSelect('work.tracks', 'tracks')
      .where('work.isActive = :isActive', { isActive: true })
      .orderBy('work.updatedAt', 'DESC')
      .addOrderBy('tracks.orderIndex', 'ASC');

    if (profileId) {
      try {
        const profile = await this.profileRepository.findOne({ where: { id: profileId } });
        if (profile && (profile as any).birthDate) {
          const raw = (profile as any).birthDate;
          const by = raw instanceof Date ? raw : new Date(raw);
          if (!isNaN(by.getTime())) {
            const now = new Date();
            let months = (now.getFullYear() - by.getFullYear()) * 12 + (now.getMonth() - by.getMonth());
            if (now.getDate() < by.getDate()) months -= 1;
            const ageMonths = Math.max(0, months);
            qb.andWhere('work.recommended_min_months <= :ageMonths AND work.recommended_max_months >= :ageMonths', { ageMonths });
          }
        }
      } catch { }
    }

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    if (userId) {
      const workIds = data.map(work => work.id);
      const whereClause = profileId ? { profileId, userId, workId: In(workIds) } : { userId, workId: In(workIds) };
      const favorites = await this.favoriteRepository.find({ where: whereClause });
      const favoriteWorkIds = new Set(favorites.map(f => f.workId));
      data.forEach(work => { (work as any).isFavorite = favoriteWorkIds.has(work.id); });
    }

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findAllAdmin(searchDto: SearchWorksDto): Promise<{ data: Work[]; meta: any }> {
    const { type, agePointMonths, minMonths, maxMonths, tags, search, page = 1, limit = 20 } = searchDto as any;

    const queryBuilder = this.workRepository
      .createQueryBuilder('work')
      .leftJoinAndSelect('work.tracks', 'tracks')
      .leftJoinAndSelect('work.tags', 'tags')
      .leftJoinAndSelect('work.devThemes', 'devThemes')
      .orderBy('work.createdAt', 'DESC');

    if (type) {
      queryBuilder.andWhere('work.type = :type', { type });
    }

    if (typeof agePointMonths === 'number') {
      queryBuilder.andWhere('work.recommended_min_months <= :agePointMonths AND work.recommended_max_months >= :agePointMonths', { agePointMonths });
    } else if (typeof minMonths === 'number' && typeof maxMonths === 'number') {
      queryBuilder.andWhere('work.recommended_min_months <= :maxMonths AND work.recommended_max_months >= :minMonths', { minMonths, maxMonths });
    }

    if (tags && tags.length > 0) {
      const tagArray = tags.split(',');
      queryBuilder
        .innerJoin('work.workTags', 'workTags')
        .innerJoin('workTags.tag', 'tag')
        .andWhere('tag.name IN (:...tagNames)', { tagNames: tagArray });
    }

    if (search) {
      queryBuilder.andWhere(
        '(work.title ILIKE :search OR work.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

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

  async findOne(id: string, userId?: string, profileId?: string): Promise<Work> {
    const work = await this.workRepository
      .createQueryBuilder('work')
      .leftJoinAndSelect('work.tracks', 'tracks')
      .leftJoinAndSelect('work.tags', 'tags')
      .leftJoinAndSelect('work.chapters', 'chapters')
      .where('work.id = :id', { id })
      .andWhere('work.isActive = :isActive', { isActive: true })
      .orderBy('tracks.orderIndex', 'ASC')
      .addOrderBy('chapters.orderIndex', 'ASC')
      .getOne();

    if (!work) {
      throw new NotFoundException(`Work with ID ${id} not found`);
    }

    if (userId) {
      const favorite = await this.favoriteRepository.findOne({
        where: profileId ? { profileId, userId, workId: id } : { userId, workId: id },
      });
      (work as any).isFavorite = !!favorite;
    }

    return work;
  }

  async toggleFavorite(workId: string, userId: string, profileId?: string): Promise<{ isFavorite: boolean }> {
    if (profileId) {
      const profile = await this.profileRepository.findOne({ where: { id: profileId } });
      if (!profile) {
        throw new NotFoundException('Profile not found');
      }
      if ((profile as any).userId !== userId) {
        throw new ForbiddenException('Profile does not belong to current user');
      }
      const existingProfileFav = await this.favoriteRepository.findOne({ where: { profileId, userId, workId } });
      if (existingProfileFav) {
        await this.favoriteRepository.remove(existingProfileFav);
        return { isFavorite: false };
      }
      const existingUserFav = await this.favoriteRepository.findOne({ where: { userId, workId, profileId: IsNull() } });
      if (existingUserFav) {
        await this.favoriteRepository.remove(existingUserFav);
      }
      const favorite = this.favoriteRepository.create({ profileId, userId, workId });
      await this.favoriteRepository.save(favorite);
      return { isFavorite: true };
    } else {
      const existingUserFav = await this.favoriteRepository.findOne({ where: { userId, workId, profileId: IsNull() } });
      if (existingUserFav) {
        await this.favoriteRepository.remove(existingUserFav);
        return { isFavorite: false };
      }
      const favorite = this.favoriteRepository.create({ userId, workId });
      await this.favoriteRepository.save(favorite);
      return { isFavorite: true };
    }
  }

  async getFavorites(userId: string, page = 1, limit = 20, profileId?: string): Promise<{ data: Work[]; meta: any }> {
    const [favorites, total] = await this.favoriteRepository
      .createQueryBuilder('favorite')
      .leftJoinAndSelect('favorite.work', 'work')
      .leftJoinAndSelect('work.tracks', 'tracks')
      .leftJoinAndSelect('work.tags', 'tags')
      .where(profileId ? 'favorite.profileId = :profileId AND favorite.userId = :userId' : 'favorite.userId = :userId', profileId ? { profileId, userId } : { userId })
      .andWhere('work.isActive = :isActive', { isActive: true })
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('favorite.createdAt', 'DESC')
      .addOrderBy('tracks.orderIndex', 'ASC')
      .getManyAndCount();

    const works = favorites.map(favorite => {
      (favorite.work as any).isFavorite = true;
      return favorite.work;
    });

    return {
      data: works,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Métodos administrativos
  async create(createWorkDto: CreateWorkDto): Promise<Work> {
    const { tagIds, devThemeIds, ...rest } = createWorkDto as any;
    const work = this.workRepository.create(rest as Partial<Work>);
    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      const tags = await this.tagRepository.find({ where: { id: In(tagIds) } });
      (work as any).tags = tags;
    }
    if (devThemeIds && Array.isArray(devThemeIds) && devThemeIds.length > 0) {
      const themes = await this.devThemeRepository.find({ where: { id: In(devThemeIds) } });
      (work as any).devThemes = themes;
    }
    return this.workRepository.save(work);
  }

  async update(id: string, updateWorkDto: UpdateWorkDto): Promise<Work> {
    const work = await this.workRepository.findOne({ where: { id }, relations: ['tags', 'devThemes'] });
    if (!work) {
      throw new NotFoundException(`Work with ID ${id} not found`);
    }
    const { tagIds, devThemeIds, ...rest } = updateWorkDto as any;
    const prevCoverUrl = work.coverUrl;
    const prevCoverThumbUrl = (work as any).coverThumbUrl;
    Object.assign(work, rest);
    if (Array.isArray(tagIds)) {
      const tags = await this.tagRepository.find({ where: { id: In(tagIds) } });
      (work as any).tags = tags;
    }
    if (Array.isArray(devThemeIds)) {
      const themes = await this.devThemeRepository.find({ where: { id: In(devThemeIds) } });
      (work as any).devThemes = themes;
    }
    const coverChanged = prevCoverUrl && rest.coverUrl && rest.coverUrl !== prevCoverUrl;
    const thumbChanged = prevCoverThumbUrl && rest.coverThumbUrl && rest.coverThumbUrl !== prevCoverThumbUrl;
    const baseForDelete = coverChanged ? prevCoverUrl : (thumbChanged ? prevCoverThumbUrl : null);
    if (baseForDelete) {
      const oldKey = this.mediaService.getStorageKeyFromUrl(baseForDelete);
      if (oldKey) {
        const dir = oldKey.split('/').slice(0, -1).join('/');
        const key600 = `${dir}/cover_600.jpg`;
        const key300 = `${dir}/cover_300.jpg`;
        try { await this.mediaService.deleteMedia(key600); } catch { }
        try { await this.mediaService.deleteMedia(key300); } catch { }
        try { await this.mediaService.deletePrefix(dir); } catch { }
      }
    }
    return this.workRepository.save(work);
  }

  async toggleStatus(id: string): Promise<Work> {
    const work = await this.workRepository.findOne({ where: { id } });
    if (!work) {
      throw new NotFoundException(`Work with ID ${id} not found`);
    }

    work.isActive = !work.isActive;
    return this.workRepository.save(work);
  }

  async createTrack(workId: string, data: { title: string; storageKey: string; durationSeconds?: number; orderIndex?: number }): Promise<Track> {
    const work = await this.workRepository.findOne({ where: { id: workId } });
    if (!work) {
      throw new NotFoundException(`Work with ID ${workId} not found`);
    }
    const track = this.trackRepository.create({
      workId,
      title: data.title,
      storageKey: data.storageKey,
      originalObjectKey: data.storageKey,
      durationSeconds: data.durationSeconds,
      orderIndex: data.orderIndex ?? 0,
    });
    return this.trackRepository.save(track);
  }

  async getAllTags(): Promise<Tag[]> {
    return this.tagRepository.find({ where: { isActive: true } });
  }

  async createTag(name: string, color: string): Promise<Tag> {
    const tag = this.tagRepository.create({ name, color });
    return this.tagRepository.save(tag);
  }

  async updateTag(id: string, name: string, color: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }

    tag.name = name;
    tag.color = color;
    return this.tagRepository.save(tag);
  }

  async deleteTag(id: string): Promise<void> {
    const tag = await this.tagRepository.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }

    await this.tagRepository.remove(tag);
  }

  async getAllDevThemes(): Promise<DevTheme[]> {
    return this.devThemeRepository.find({ where: { isActive: true } });
  }

  async createDevTheme(name: string, description?: string): Promise<DevTheme> {
    const theme = this.devThemeRepository.create({ name, description });
    return this.devThemeRepository.save(theme);
  }

  async updateDevTheme(id: string, name: string, description?: string): Promise<DevTheme> {
    const theme = await this.devThemeRepository.findOne({ where: { id } });
    if (!theme) {
      throw new NotFoundException(`Theme with ID ${id} not found`);
    }
    theme.name = name;
    theme.description = description;
    return this.devThemeRepository.save(theme);
  }

  async deleteDevTheme(id: string): Promise<void> {
    const theme = await this.devThemeRepository.findOne({ where: { id } });
    if (!theme) {
      throw new NotFoundException(`Theme with ID ${id} not found`);
    }
    await this.devThemeRepository.remove(theme);
  }

  async deleteWork(id: string): Promise<void> {
    const work = await this.workRepository.findOne({ where: { id }, relations: ['tracks'] });
    if (!work) {
      throw new NotFoundException(`Work with ID ${id} not found`);
    }
    if (work.coverUrl) {
      const key = this.mediaService.getStorageKeyFromUrl(work.coverUrl);
      if (key) {
        await this.mediaService.deleteMedia(key);
      }
    }
    for (const t of work.tracks || []) {
      if (t.storageKey) {
        await this.mediaService.deleteMedia(t.storageKey);
      }
      if (t.originalObjectKey) {
        await this.mediaService.deleteMedia(t.originalObjectKey);
      }
      if (t.hlsBasePath) {
        await this.mediaService.deletePrefix(t.hlsBasePath);
      }
    }
    await this.workRepository.remove(work);
  }

  async getTopPlayed(page = 1, limit = 20): Promise<{ data: Work[]; meta: any }> {
    // Query to get top played tracks globally
    const [globalCounts, total] = await this.trackPlayGlobalCountRepository
      .createQueryBuilder('tpgc')
      .leftJoinAndSelect('tpgc.track', 'track')
      .leftJoinAndSelect('track.work', 'work')
      .leftJoinAndSelect('work.tracks', 'allTracks')
      .leftJoinAndSelect('work.tags', 'tags')
      .where('work.isActive = :isActive', { isActive: true })
      .orderBy('tpgc.count', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // Extract unique works (avoiding duplicates if work has multiple tracks)
    const seenWorkIds = new Set<string>();
    const works: Work[] = [];

    for (const count of globalCounts) {
      const work = count.track?.work;
      if (work && !seenWorkIds.has(work.id)) {
        seenWorkIds.add(work.id);
        (work as any).playCount = count.count;
        works.push(work);
      }
    }

    return {
      data: works,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMyTopPlayed(userId: string, page = 1, limit = 20, profileId?: string): Promise<{ data: Work[]; meta: any }> {
    // Query to get top played tracks by user/profile
    const queryBuilder = this.trackPlayUserCountRepository
      .createQueryBuilder('tpuc')
      .leftJoinAndSelect('tpuc.track', 'track')
      .leftJoinAndSelect('track.work', 'work')
      .leftJoinAndSelect('work.tracks', 'allTracks')
      .leftJoinAndSelect('work.tags', 'tags')
      .where('work.isActive = :isActive', { isActive: true });

    if (profileId) {
      queryBuilder.andWhere('tpuc.profileId = :profileId', { profileId });
    }

    const [userCounts, total] = await queryBuilder
      .orderBy('tpuc.count', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // Extract unique works
    const seenWorkIds = new Set<string>();
    const works: Work[] = [];

    for (const count of userCounts) {
      const work = count.track?.work;
      if (work && !seenWorkIds.has(work.id)) {
        seenWorkIds.add(work.id);
        (work as any).playCount = count.count;
        works.push(work);
      }
    }

    return {
      data: works,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getLandingSamplesFromTable(limit = 3): Promise<Work[]> {
    const samples = await this.workLandingSampleRepository.find({
      relations: ['work', 'work.tracks', 'work.tags'],
      order: { orderIndex: 'ASC', createdAt: 'DESC' },
      take: limit,
    });
    return samples.map(s => s.work ? s.work : null).filter(w => w && w.isActive) as Work[];
  }

  async addLandingSample(workId: string): Promise<WorkLandingSample> {
    const exists = await this.workLandingSampleRepository.findOne({ where: { workId } });
    if (exists) return exists;

    const count = await this.workLandingSampleRepository.count();
    const sample = this.workLandingSampleRepository.create({ workId, orderIndex: count });
    return this.workLandingSampleRepository.save(sample);
  }

  async removeLandingSample(workId: string): Promise<void> {
    await this.workLandingSampleRepository.delete({ workId });
  }

  async isLandingSample(workId: string): Promise<boolean> {
    const count = await this.workLandingSampleRepository.count({ where: { workId } });
    return count > 0;
  }
}

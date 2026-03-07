import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Playlist } from './entities/playlist.entity';
import { PlaylistItem } from './entities/playlist-item.entity';
import { Track } from '@/modules/catalog/entities/track.entity';

@Injectable()
export class PlaylistsService {
  constructor(
    @InjectRepository(Playlist)
    private readonly playlistRepository: Repository<Playlist>,
    @InjectRepository(PlaylistItem)
    private readonly itemRepository: Repository<PlaylistItem>,
    @InjectRepository(Track)
    private readonly trackRepository: Repository<Track>,
  ) {}

  async list(userId: string, profileId?: string): Promise<Playlist[]> {
    const where = profileId ? { profileId } : { userId };
    return this.playlistRepository.find({ where, order: { createdAt: 'ASC' } });
  }

  async create(name: string, userId: string, profileId?: string): Promise<Playlist> {
    const playlist = this.playlistRepository.create(profileId ? { name, profileId } : { name, userId });
    return this.playlistRepository.save(playlist);
  }

  async addItem(playlistId: string, trackId: string): Promise<PlaylistItem> {
    const playlist = await this.playlistRepository.findOne({ where: { id: playlistId } });
    if (!playlist) throw new NotFoundException('Playlist not found');
    const existing = await this.itemRepository.findOne({ where: { playlistId, trackId } });
    if (existing) return existing;
    const count = await this.itemRepository.count({ where: { playlistId } });
    const item = this.itemRepository.create({ playlistId, trackId, orderIndex: count });
    try {
      return await this.itemRepository.save(item);
    } catch (e) {
      const fallback = await this.itemRepository.findOne({ where: { playlistId, trackId } });
      if (fallback) return fallback;
      throw e;
    }
  }

  async removeItem(playlistId: string, itemId: string): Promise<void> {
    const item = await this.itemRepository.findOne({ where: { id: itemId, playlistId } });
    if (!item) throw new NotFoundException('Playlist item not found');
    await this.itemRepository.remove(item);
  }

  async reorderItems(playlistId: string, itemIdsInOrder: string[]): Promise<void> {
    const items = await this.itemRepository.find({ where: { playlistId } });
    const indexMap = new Map(itemIdsInOrder.map((id, idx) => [id, idx]));
    for (const item of items) {
      const idx = indexMap.get(item.id);
      if (idx !== undefined) {
        item.orderIndex = idx;
        await this.itemRepository.save(item);
      }
    }
  }

  async getItems(playlistId: string): Promise<Array<{ id: string; orderIndex: number; track: Track }>> {
    const items = await this.itemRepository.find({ where: { playlistId }, order: { orderIndex: 'ASC', createdAt: 'ASC' } });
    const withTracks = [] as Array<{ id: string; orderIndex: number; track: Track }>;
    for (const it of items) {
      const track = await this.trackRepository.findOne({ where: { id: it.trackId } });
      if (track) withTracks.push({ id: it.id, orderIndex: it.orderIndex, track });
    }
    return withTracks;
  }
}

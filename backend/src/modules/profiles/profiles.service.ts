import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  async create(userId: string, createProfileDto: CreateProfileDto): Promise<Profile> {
    const profile = this.profileRepository.create({
      ...createProfileDto,
      userId,
    });
    return this.profileRepository.save(profile);
  }

  async findAllByUser(userId: string): Promise<Profile[]> {
    return this.profileRepository.find({
      where: { userId, isActive: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Profile | null> {
    return this.profileRepository.findOne({
      where: { id, userId },
    });
  }

  async update(id: string, userId: string, updateProfileDto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.findOne(id, userId);
    if (!profile) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }
    
    Object.assign(profile, updateProfileDto);
    return this.profileRepository.save(profile);
  }

  async remove(id: string, userId: string): Promise<void> {
    const profile = await this.findOne(id, userId);
    if (!profile) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }
    
    profile.isActive = false;
    await this.profileRepository.save(profile);
  }

  async validateParentalPin(id: string, userId: string, pin: string): Promise<boolean> {
    const profile = await this.findOne(id, userId);
    if (!profile) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }

    if (!profile.parentalPin) {
      return true;
    }

    return profile.parentalPin === pin;
  }
}

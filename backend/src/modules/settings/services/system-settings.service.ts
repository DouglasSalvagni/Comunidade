import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from '../entities/system-setting.entity';

@Injectable()
export class SystemSettingsService {
  constructor(
    @InjectRepository(SystemSetting)
    private readonly systemSettingRepository: Repository<SystemSetting>,
  ) {}

  async getValue(key: string): Promise<string | null> {
    const setting = await this.systemSettingRepository.findOne({ where: { key } });
    return setting?.value ?? null;
  }

  async list(): Promise<SystemSetting[]> {
    return this.systemSettingRepository.find({ order: { key: 'ASC' } });
  }

  async setValue(key: string, value: string | null): Promise<SystemSetting> {
    const existing = await this.systemSettingRepository.findOne({ where: { key } });
    if (existing) {
      existing.value = value;
      return this.systemSettingRepository.save(existing);
    }
    const setting = this.systemSettingRepository.create({ key, value });
    return this.systemSettingRepository.save(setting);
  }
}

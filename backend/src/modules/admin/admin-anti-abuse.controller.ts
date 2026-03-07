import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { AntiAbuseService } from '@/common/anti-abuse/anti-abuse.service';

@Controller('admin/anti-abuse')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminAntiAbuseController {
  constructor(private readonly antiAbuse: AntiAbuseService) { }

  @Get('snapshot')
  getSnapshot() {
    return this.antiAbuse.getSnapshot();
  }
}


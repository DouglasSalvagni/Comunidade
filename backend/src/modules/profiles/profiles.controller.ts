import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@ApiTags('Profiles')
@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly subscriptionsService: SubscriptionsService,
  ) { }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new profile' })
  @ApiResponse({ status: 201, description: 'Profile created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async create(@Request() req, @Body() createProfileDto: CreateProfileDto) {
    if (await this.subscriptionsService.isFreePlan(req.user.userId)) {
      const existing = await this.profilesService.findAllByUser(req.user.userId);
      if (existing.length >= 1) {
        throw new ForbiddenException('Plano gratuito permite apenas 1 perfil.');
      }
    }
    return this.profilesService.create(req.user.userId, createProfileDto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all profiles for current user' })
  @ApiResponse({ status: 200, description: 'Profiles retrieved successfully.' })
  async findAll(@Request() req) {
    return this.profilesService.findAllByUser(req.user.userId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get profile by ID' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Profile not found.' })
  async findOne(@Request() req, @Param('id') id: string) {
    const profile = await this.profilesService.findOne(id, req.user.userId);
    if (!profile) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }
    return profile;
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully.' })
  @ApiResponse({ status: 404, description: 'Profile not found.' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profilesService.update(id, req.user.userId, updateProfileDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete profile' })
  @ApiResponse({ status: 204, description: 'Profile deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Profile not found.' })
  async remove(@Request() req, @Param('id') id: string) {
    await this.profilesService.remove(id, req.user.userId);
  }

  @Post(':id/validate-pin')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate parental PIN' })
  @ApiResponse({ status: 200, description: 'PIN validation result.' })
  @ApiResponse({ status: 404, description: 'Profile not found.' })
  async validatePin(
    @Request() req,
    @Param('id') id: string,
    @Body('pin') pin: string,
  ) {
    const isValid = await this.profilesService.validateParentalPin(id, req.user.userId, pin);
    return { valid: isValid };
  }
}
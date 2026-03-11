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
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully.' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAllPaginated(Number(page) || 1, Number(limit) || 20, search);
  }

  @Get('members')
  @Roles('user', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar membros para gaveta com cursor e busca' })
  @ApiResponse({ status: 200, description: 'Membros listados com sucesso.' })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'search', required: false, type: String })
  async listMembers(
    @Query('cursor') cursor?: string,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    return this.usersService.listMembersCursor(Number(limit) || 20, cursor, search);
  }

  @Get(':id')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get('profile/me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully.' })
  async getProfile(@Request() req) {
    return this.usersService.findOne(req.user.userId);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Patch(':id/toggle-status')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle user status (Admin only)' })
  @ApiResponse({ status: 200, description: 'User status toggled successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async toggleStatus(@Param('id') id: string) {
    return this.usersService.toggleStatus(id);
  }
}

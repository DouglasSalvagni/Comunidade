import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CoursesService } from './courses.service';
import { UpdateProgressDto } from './dto/update-progress.dto';

@ApiTags('Courses')
@Controller('courses')
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar cursos disponíveis para o usuário' })
  async listCourses(@Request() req: any) {
    return this.coursesService.listCoursesForUser(req.user.id);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalhes do curso com módulos, aulas e progresso' })
  async getCourseDetail(@Param('id') id: string, @Request() req: any) {
    return this.coursesService.getCourseDetailForUser(id, req.user.id);
  }

  @Get('lessons/:lessonId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalhes da aula com vídeo URL e navegação' })
  async getLesson(@Param('lessonId') lessonId: string, @Request() req: any) {
    return this.coursesService.getLessonForUser(lessonId, req.user.id);
  }

  @Post('lessons/:lessonId/progress')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar progresso de uma aula' })
  async updateProgress(
    @Param('lessonId') lessonId: string,
    @Body() dto: UpdateProgressDto,
    @Request() req: any,
  ) {
    return this.coursesService.updateProgress(req.user.id, lessonId, dto);
  }
}

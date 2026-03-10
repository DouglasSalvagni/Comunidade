import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';

@ApiTags('Admin - Courses')
@Controller('admin/courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminCoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // ========== CURSOS ==========

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os cursos' })
  async listCourses() {
    return this.coursesService.adminListCourses();
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar curso' })
  @ApiResponse({ status: 201 })
  async createCourse(@Body() dto: CreateCourseDto, @Request() req: any) {
    return this.coursesService.adminCreateCourse(dto, req.user.userId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalhes do curso (com módulos e aulas)' })
  async getCourse(@Param('id') id: string) {
    return this.coursesService.adminGetCourse(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar curso' })
  async updateCourse(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.adminUpdateCourse(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar curso' })
  async deleteCourse(@Param('id') id: string) {
    await this.coursesService.adminDeleteCourse(id);
  }

  // ========== ANEXOS ==========

  @Get(':courseId/modules/:moduleId/lessons/:lessonId/attachments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar anexos de uma aula' })
  async listAttachments(@Param('lessonId') lessonId: string) {
    return this.coursesService.adminListAttachments(lessonId);
  }

  @Post(':courseId/modules/:moduleId/lessons/:lessonId/attachments/upload-url')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gerar URL pré-assinada para upload de anexo' })
  async generateAttachmentUploadUrl(
    @Param('lessonId') lessonId: string,
    @Body() body: { fileName: string; contentType: string },
  ) {
    return this.coursesService.adminGetAttachmentUploadUrl(
      lessonId,
      body.fileName,
      body.contentType,
    );
  }

  @Post(':courseId/modules/:moduleId/lessons/:lessonId/attachments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar anexo após upload' })
  @ApiResponse({ status: 201 })
  async createAttachment(
    @Param('lessonId') lessonId: string,
    @Body()
    body: {
      nome: string;
      fileKey: string;
      fileName: string;
      contentType: string;
      tamanhoBytes: number;
    },
  ) {
    return this.coursesService.adminCreateAttachment(lessonId, body);
  }

  @Delete(':courseId/modules/:moduleId/lessons/:lessonId/attachments/:attachmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Excluir anexo de uma aula' })
  async deleteAttachment(
    @Param('lessonId') lessonId: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    await this.coursesService.adminDeleteAttachment(lessonId, attachmentId);
  }

  // ========== UPLOAD ==========

  @Post(':id/upload-url')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gerar URL pré-assinada para upload de vídeo' })
  async generateUploadUrl(
    @Param('id') courseId: string,
    @Body() body: { fileName: string },
  ) {
    return this.coursesService.adminGenerateUploadUrl(courseId, body.fileName);
  }

  // ========== PLAN ACCESS ==========

  @Get(':id/plan-access')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar planos com acesso ao curso' })
  async getPlanAccess(@Param('id') courseId: string) {
    return this.coursesService.adminGetPlanAccess(courseId);
  }

  @Patch(':id/plan-access')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar planos com acesso ao curso' })
  async updatePlanAccess(
    @Param('id') courseId: string,
    @Body() body: { planIds: string[] },
  ) {
    return this.coursesService.adminUpdatePlanAccess(courseId, body.planIds);
  }

  // ========== MÓDULOS ==========

  @Post(':courseId/modules')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar módulo no curso' })
  @ApiResponse({ status: 201 })
  async createModule(@Param('courseId') courseId: string, @Body() dto: CreateModuleDto) {
    return this.coursesService.adminCreateModule(courseId, dto);
  }

  // IMPORTANTE: rota estática 'reorder' ANTES da rota paramétrica ':moduleId'
  @Patch(':courseId/modules/reorder')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reordenar módulos' })
  async reorderModules(
    @Param('courseId') courseId: string,
    @Body() body: { orderedIds: string[] },
  ) {
    await this.coursesService.adminReorderModules(courseId, body.orderedIds);
    return { ok: true };
  }

  @Patch(':courseId/modules/:moduleId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar módulo' })
  async updateModule(
    @Param('moduleId') moduleId: string,
    @Body() dto: Partial<{ titulo: string; ordem: number }>,
  ) {
    return this.coursesService.adminUpdateModule(moduleId, dto);
  }

  @Delete(':courseId/modules/:moduleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar módulo' })
  async deleteModule(@Param('moduleId') moduleId: string) {
    await this.coursesService.adminDeleteModule(moduleId);
  }

  // ========== AULAS ==========

  @Post(':courseId/modules/:moduleId/lessons')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar aula no módulo' })
  @ApiResponse({ status: 201 })
  async createLesson(@Param('moduleId') moduleId: string, @Body() dto: CreateLessonDto) {
    return this.coursesService.adminCreateLesson(moduleId, dto);
  }

  // IMPORTANTE: rota estática 'reorder' ANTES da rota paramétrica ':lessonId'
  @Patch(':courseId/modules/:moduleId/lessons/reorder')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reordenar aulas no módulo' })
  async reorderLessons(
    @Param('moduleId') moduleId: string,
    @Body() body: { orderedIds: string[] },
  ) {
    await this.coursesService.adminReorderLessons(moduleId, body.orderedIds);
    return { ok: true };
  }

  @Patch(':courseId/modules/:moduleId/lessons/:lessonId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar aula' })
  async updateLesson(
    @Param('lessonId') lessonId: string,
    @Body() dto: Partial<{
      titulo: string;
      conteudoTexto: string;
      videoKey: string;
      duracaoSegundos: number;
      ordem: number;
      status: string;
    }>,
  ) {
    return this.coursesService.adminUpdateLesson(lessonId, dto);
  }

  @Delete(':courseId/modules/:moduleId/lessons/:lessonId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar aula' })
  async deleteLesson(@Param('lessonId') lessonId: string) {
    await this.coursesService.adminDeleteLesson(lessonId);
  }
}

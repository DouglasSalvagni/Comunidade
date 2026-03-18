import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Course } from './entities/course.entity';
import { CourseModule } from './entities/course-module.entity';
import { Lesson } from './entities/lesson.entity';
import { LessonAttachment } from './entities/lesson-attachment.entity';
import { LessonProgress } from './entities/lesson-progress.entity';
import { CoursePlanAccess } from './entities/course-plan-access.entity';
import { Subscription } from '@/modules/subscriptions/entities/subscription.entity';
import { StorageService } from './storage.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(CourseModule)
    private readonly moduleRepo: Repository<CourseModule>,
    @InjectRepository(Lesson)
    private readonly lessonRepo: Repository<Lesson>,
    @InjectRepository(LessonProgress)
    private readonly progressRepo: Repository<LessonProgress>,
    @InjectRepository(LessonAttachment)
    private readonly attachmentRepo: Repository<LessonAttachment>,
    @InjectRepository(CoursePlanAccess)
    private readonly coursePlanRepo: Repository<CoursePlanAccess>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    private readonly storageService: StorageService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // =====================
  // ADMIN — Cursos
  // =====================

  async adminListCourses(): Promise<Course[]> {
    return this.courseRepo.find({
      relations: ['modulos', 'planAccess', 'planAccess.plan'],
      order: { createdAt: 'DESC' },
    });
  }

  async adminGetCourse(id: string): Promise<Course> {
    const course = await this.courseRepo.findOne({
      where: { id },
      relations: ['modulos', 'modulos.aulas', 'planAccess', 'planAccess.plan'],
      order: { modulos: { ordem: 'ASC', aulas: { ordem: 'ASC' } } },
    });
    if (!course) throw new NotFoundException('Curso não encontrado');
    return course;
  }

  async adminCreateCourse(dto: CreateCourseDto, criadorId: string): Promise<Course> {
    const course = this.courseRepo.create({
      ...dto,
      criadorId,
    });
    return this.courseRepo.save(course);
  }

  async adminUpdateCourse(id: string, dto: UpdateCourseDto): Promise<Course> {
    const course = await this.courseRepo.findOne({ where: { id } });
    if (!course) throw new NotFoundException('Curso não encontrado');

    const wasDraft = course.status === 'rascunho';

    if (dto.titulo !== undefined) course.titulo = dto.titulo;
    if (dto.descricao !== undefined) course.descricao = dto.descricao;
    if (dto.thumbnailUrl !== undefined) course.thumbnailUrl = dto.thumbnailUrl;
    if (dto.status !== undefined) course.status = dto.status;

    const saved = await this.courseRepo.save(course);

    // NOTIFICATION: Curso recém publicado
    if (wasDraft && dto.status === 'publicado') {
      this.notifyUsersAboutNewCourse(saved).catch(err => 
        console.error('Falha ao notificar novo curso:', err)
      );
    }

    return saved;
  }

  private async notifyUsersAboutNewCourse(course: Course) {
    const planAccess = await this.coursePlanRepo.find({ where: { cursoId: course.id } });
    
    let eligibleUserIds: string[] = [];

    if (planAccess.length === 0) {
      const activeSubs = await this.subscriptionRepo.find({
        where: { status: In(['active', 'expiring']) },
        select: ['userId']
      });
      eligibleUserIds = activeSubs.map(s => s.userId);
    } else {
      const planIds = planAccess.map(p => p.planId);
      const activeSubs = await this.subscriptionRepo.find({
        where: { status: In(['active', 'expiring']), planId: In(planIds) },
        select: ['userId']
      });
      eligibleUserIds = activeSubs.map(s => s.userId);
    }

    eligibleUserIds = [...new Set(eligibleUserIds)];

    for (const userId of eligibleUserIds) {
      await this.notificationsService.create({
        userId,
        type: 'COURSE_NEW',
        title: 'Novo Curso Disponível!',
        content: `O curso "${course.titulo}" acabou de ser lançado e já está disponível no seu plano.`,
        link: `/dashboard/courses/${course.id}`,
      });
    }
  }

  async adminDeleteCourse(id: string): Promise<void> {
    const course = await this.courseRepo.findOne({ where: { id } });
    if (!course) throw new NotFoundException('Curso não encontrado');
    await this.courseRepo.remove(course);
  }

  // =====================
  // ADMIN — Módulos
  // =====================

  async adminCreateModule(courseId: string, dto: CreateModuleDto): Promise<CourseModule> {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Curso não encontrado');

    // Determina a próxima ordem
    const maxOrdem = await this.moduleRepo
      .createQueryBuilder('m')
      .where('m.curso_id = :courseId', { courseId })
      .select('MAX(m.ordem)', 'max')
      .getRawOne();
    const nextOrdem = dto.ordem ?? ((maxOrdem?.max ?? -1) + 1);

    const mod = this.moduleRepo.create({
      cursoId: courseId,
      titulo: dto.titulo,
      ordem: nextOrdem,
    });
    
    const savedMod = await this.moduleRepo.save(mod);

    // NOTIFICATION: Novo Módulo Criado
    if (course.status === 'publicado') {
      this.notifyUsersAboutNewModule(course, savedMod).catch(err => 
        console.error('Falha ao notificar novo módulo:', err)
      );
    }

    return savedMod;
  }

  private async notifyUsersAboutNewModule(course: Course, module: CourseModule) {
    const planAccess = await this.coursePlanRepo.find({ where: { cursoId: course.id } });
    
    let eligibleUserIds: string[] = [];

    if (planAccess.length === 0) {
      const activeSubs = await this.subscriptionRepo.find({
        where: { status: In(['active', 'expiring']) },
        select: ['userId']
      });
      eligibleUserIds = activeSubs.map(s => s.userId);
    } else {
      const planIds = planAccess.map(p => p.planId);
      const activeSubs = await this.subscriptionRepo.find({
        where: { status: In(['active', 'expiring']), planId: In(planIds) },
        select: ['userId']
      });
      eligibleUserIds = activeSubs.map(s => s.userId);
    }

    eligibleUserIds = [...new Set(eligibleUserIds)];

    for (const userId of eligibleUserIds) {
      await this.notificationsService.create({
        userId,
        type: 'COURSE_NEW_MODULE',
        title: `Novo módulo em ${course.titulo}`,
        content: `O módulo "${module.titulo}" acabou de ser liberado no curso!`,
        link: `/dashboard/courses/${course.id}`,
      });
    }
  }

  async adminUpdateModule(moduleId: string, dto: Partial<{ titulo: string; ordem: number }>): Promise<CourseModule> {
    const mod = await this.moduleRepo.findOne({ where: { id: moduleId } });
    if (!mod) throw new NotFoundException('Módulo não encontrado');

    if (dto.titulo !== undefined) mod.titulo = dto.titulo;
    if (dto.ordem !== undefined) mod.ordem = dto.ordem;

    return this.moduleRepo.save(mod);
  }

  async adminDeleteModule(moduleId: string): Promise<void> {
    const mod = await this.moduleRepo.findOne({ where: { id: moduleId } });
    if (!mod) throw new NotFoundException('Módulo não encontrado');
    await this.moduleRepo.remove(mod);
  }

  async adminReorderModules(courseId: string, orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      await this.moduleRepo.update({ id: orderedIds[i], cursoId: courseId }, { ordem: i });
    }
  }

  // =====================
  // ADMIN — Aulas
  // =====================

  async adminCreateLesson(moduleId: string, dto: CreateLessonDto): Promise<Lesson> {
    const modulo = await this.moduleRepo.findOne({
      where: { id: moduleId },
      relations: ['curso'],
    });
    if (!modulo) throw new NotFoundException('Módulo não encontrado');

    const maxOrdem = await this.lessonRepo
      .createQueryBuilder('lesson')
      .where('lesson.moduloId = :moduleId', { moduleId })
      .select('MAX(lesson.ordem)', 'max')
      .getRawOne();
    const nextOrdem = dto.ordem ?? ((maxOrdem?.max ?? -1) + 1);

    const lesson = this.lessonRepo.create({
      moduloId: moduleId,
      titulo: dto.titulo,
      conteudoTexto: dto.conteudoTexto ?? null,
      videoKey: dto.videoKey ?? null,
      duracaoSegundos: dto.duracaoSegundos ?? 0,
      ordem: nextOrdem,
      status: 'pendente', // O Enum não tem "publicado", então vamos de "pendente" (ou pronto)
    });
    
    const savedLesson = await this.lessonRepo.save(lesson);

    // NOTIFICATION: Nova aula no curso (Apenas se o curso estiver publicado)
    if (modulo.curso?.status === 'publicado') {
      // Idealmente, deveríamos notificar apenas quem tem acesso ao curso.
      // Como não temos um endpoint direto para isso, a notificação de nova aula 
      // precisaria de uma query mais complexa de subscriptions.
      // Por enquanto, podemos deixar o gancho pronto ou notificar com base em query de acesso.
      this.notifyUsersAboutNewLesson(modulo.curso, savedLesson).catch(err => 
        console.error('Falha ao notificar nova aula:', err)
      );
    }

    return savedLesson;
  }

  private async notifyUsersAboutNewLesson(course: Course, lesson: Lesson) {
    // 1. Achar todos os usuários que têm acesso ao curso (com base nos planos)
    const planAccess = await this.coursePlanRepo.find({ where: { cursoId: course.id } });
    
    let eligibleUserIds: string[] = [];

    if (planAccess.length === 0) {
      // Curso é aberto a todos com assinatura ativa
      const activeSubs = await this.subscriptionRepo.find({
        where: { status: In(['active', 'expiring']) },
        select: ['userId']
      });
      eligibleUserIds = activeSubs.map(s => s.userId);
    } else {
      // Curso restrito a certos planos
      const planIds = planAccess.map(p => p.planId);
      const activeSubs = await this.subscriptionRepo.find({
        where: { status: In(['active', 'expiring']), planId: In(planIds) },
        select: ['userId']
      });
      eligibleUserIds = activeSubs.map(s => s.userId);
    }

    // Remover duplicatas
    eligibleUserIds = [...new Set(eligibleUserIds)];

    // 2. Disparar notificação em lote (simulado com loop)
    // Em produção com milhares de usuários, usaríamos uma fila (SQS/RabbitMQ)
    for (const userId of eligibleUserIds) {
      await this.notificationsService.create({
        userId,
        type: 'COURSE_NEW_LESSON',
        title: `Nova aula em ${course.titulo}`,
        content: `A aula "${lesson.titulo}" acabou de ser adicionada.`,
        link: `/dashboard/courses/lessons/${lesson.id}`,
      });
    }
  }

  async adminUpdateLesson(
    lessonId: string,
    dto: Partial<{ titulo: string; conteudoTexto: string; videoKey: string; duracaoSegundos: number; ordem: number; status: string }>,
  ): Promise<Lesson> {
    const lesson = await this.lessonRepo.findOne({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Aula não encontrada');

    // Se estiver atualizando videoKey e a nova for diferente da antiga, remove a antiga do S3
    if (dto.videoKey !== undefined && lesson.videoKey && lesson.videoKey !== dto.videoKey) {
      // Deleta o vídeo antigo
      await this.storageService.deleteFile(lesson.videoKey);
      // Se houver processamento HLS (pasta output/...), também deveria ser removido, 
      // mas como o sistema atual parece usar upload direto de MP4 sem processamento complexo registrado no banco,
      // vamos focar no arquivo principal. Se houver HLS, o storage service poderia ter um deleteFolder.
      // Assumindo vídeo único por enquanto.
    }

    if (dto.titulo !== undefined) lesson.titulo = dto.titulo;
    if (dto.conteudoTexto !== undefined) lesson.conteudoTexto = dto.conteudoTexto;
    if (dto.videoKey !== undefined) lesson.videoKey = dto.videoKey;
    if (dto.duracaoSegundos !== undefined) lesson.duracaoSegundos = dto.duracaoSegundos;
    if (dto.ordem !== undefined) lesson.ordem = dto.ordem;
    if (dto.status !== undefined) lesson.status = dto.status as any;

    return this.lessonRepo.save(lesson);
  }

  async adminDeleteLesson(lessonId: string): Promise<void> {
    const lesson = await this.lessonRepo.findOne({ 
      where: { id: lessonId },
      relations: ['anexos']
    });
    if (!lesson) throw new NotFoundException('Aula não encontrada');

    // 1. Deletar vídeo da aula do S3
    if (lesson.videoKey) {
      await this.storageService.deleteFile(lesson.videoKey);
    }

    // 2. Deletar anexos do S3
    if (lesson.anexos && lesson.anexos.length > 0) {
      for (const anexo of lesson.anexos) {
        if (anexo.fileKey) {
          await this.storageService.deleteFile(anexo.fileKey);
        }
      }
    }

    await this.lessonRepo.remove(lesson);
  }

  async adminReorderLessons(moduleId: string, orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      await this.lessonRepo.update({ id: orderedIds[i], moduloId: moduleId }, { ordem: i });
    }
  }

  // =====================
  // ADMIN — Anexos
  // =====================

  async adminGetAttachmentUploadUrl(
    lessonId: string,
    fileName: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; key: string }> {
    const lesson = await this.lessonRepo.findOne({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Aula não encontrada');
    const key = `${lessonId}/${uuidv4()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    return this.storageService.generateAttachmentUploadUrl(key, contentType);
  }

  async adminCreateAttachment(
    lessonId: string,
    dto: { nome: string; fileKey: string; fileName: string; contentType: string; tamanhoBytes: number },
  ) {
    const lesson = await this.lessonRepo.findOne({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Aula não encontrada');
    const attachment = this.attachmentRepo.create({
      aulaId: lessonId,
      nome: dto.nome,
      fileKey: dto.fileKey,
      fileName: dto.fileName,
      contentType: dto.contentType,
      tamanhoBytes: dto.tamanhoBytes,
    });
    const saved = await this.attachmentRepo.save(attachment);
    const downloadUrl = await this.storageService.generateAttachmentDownloadUrl(saved.fileKey, saved.fileName);
    return { ...saved, downloadUrl };
  }

  async adminDeleteAttachment(lessonId: string, attachmentId: string): Promise<void> {
    const attachment = await this.attachmentRepo.findOne({ where: { id: attachmentId, aulaId: lessonId } });
    if (!attachment) throw new NotFoundException('Anexo não encontrado');

    // Deleta do S3
    if (attachment.fileKey) {
      await this.storageService.deleteFile(attachment.fileKey);
    }

    await this.attachmentRepo.remove(attachment);
  }

  async adminListAttachments(lessonId: string) {
    const attachments = await this.attachmentRepo.find({ where: { aulaId: lessonId }, order: { createdAt: 'ASC' } });
    return Promise.all(
      attachments.map(async (att) => ({
        id: att.id,
        nome: att.nome,
        fileName: att.fileName,
        contentType: att.contentType,
        tamanhoBytes: att.tamanhoBytes,
        downloadUrl: await this.storageService.generateAttachmentDownloadUrl(att.fileKey, att.fileName),
      })),
    );
  }

  // =====================
  // ADMIN — Upload
  // =====================

  async adminGenerateUploadUrl(courseId: string, fileName: string): Promise<{ uploadUrl: string; key: string }> {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Curso não encontrado');

    const ext = fileName.split('.').pop() || 'mp4';
    const key = `courses/${courseId}/${uuidv4()}.${ext}`;
    return this.storageService.generateUploadUrl(key);
  }

  // =====================
  // ADMIN — Plan Access
  // =====================

  async adminGetPlanAccess(courseId: string): Promise<CoursePlanAccess[]> {
    return this.coursePlanRepo.find({
      where: { cursoId: courseId },
      relations: ['plan'],
    });
  }

  async adminUpdatePlanAccess(courseId: string, planIds: string[]): Promise<CoursePlanAccess[]> {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Curso não encontrado');

    // Remove acessos atuais
    await this.coursePlanRepo.delete({ cursoId: courseId });

    // Cria novos
    if (planIds.length > 0) {
      const entities = planIds.map((planId) =>
        this.coursePlanRepo.create({ cursoId: courseId, planId }),
      );
      await this.coursePlanRepo.save(entities);
    }

    return this.adminGetPlanAccess(courseId);
  }

  // =====================
  // USER — Listagem
  // =====================

  async listCoursesForUser(userId: string): Promise<any[]> {
    // Busca a assinatura ativa do user
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId, status: In(['active', 'expiring']) },
      relations: ['plan'],
    });

    // Busca todos os cursos publicados
    const courses = await this.courseRepo.find({
      where: { status: 'publicado' },
      relations: ['modulos', 'modulos.aulas', 'planAccess'],
      order: { createdAt: 'DESC' },
    });

    // Filtra cursos acessíveis
    const accessibleCourses = courses.filter((course) => {
      // Se curso não tem restrição de plano, é acessível a todos
      if (!course.planAccess || course.planAccess.length === 0) return true;
      // Se user não tem assinatura, bloqueia cursos restritos
      if (!subscription) return false;
      // Verifica se o plano do user dá acesso
      return course.planAccess.some((pa) => pa.planId === subscription.planId);
    });

    // Calcula progresso do user para cada curso
    const result = await Promise.all(
      accessibleCourses.map(async (course) => {
        const totalLessons = course.modulos.reduce((sum, m) => sum + (m.aulas?.length || 0), 0);
        let completedLessons = 0;

        if (totalLessons > 0) {
          const lessonIds = course.modulos.flatMap((m) => m.aulas.map((a) => a.id));
          completedLessons = await this.progressRepo.count({
            where: { usuarioId: userId, aulaId: In(lessonIds), concluida: true },
          });
        }

        return {
          id: course.id,
          titulo: course.titulo,
          descricao: course.descricao,
          thumbnailUrl: course.thumbnailUrl,
          totalModulos: course.modulos.length,
          totalAulas: totalLessons,
          aulasCompletas: completedLessons,
          progresso: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
        };
      }),
    );

    return result;
  }

  async getCourseDetailForUser(courseId: string, userId: string): Promise<any> {
    const course = await this.courseRepo.findOne({
      where: { id: courseId, status: 'publicado' },
      relations: ['modulos', 'modulos.aulas', 'planAccess'],
      order: { modulos: { ordem: 'ASC', aulas: { ordem: 'ASC' } } },
    });

    if (!course) throw new NotFoundException('Curso não encontrado');

    // Verifica acesso
    if (course.planAccess && course.planAccess.length > 0) {
      const subscription = await this.subscriptionRepo.findOne({
        where: { userId, status: In(['active', 'expiring']) },
      });
      if (!subscription || !course.planAccess.some((pa) => pa.planId === subscription.planId)) {
        throw new ForbiddenException('Seu plano não inclui este curso');
      }
    }

    // Busca progresso do user
    const allLessonIds = course.modulos.flatMap((m) => m.aulas.map((a) => a.id));
    const userProgress = allLessonIds.length > 0 
      ? await this.progressRepo.find({
          where: { usuarioId: userId, aulaId: In(allLessonIds) },
        })
      : [];

    const progressMap = new Map(userProgress.map((p) => [p.aulaId, p]));

    // Monta resposta com progresso embutido
    const modulos = course.modulos.map((m) => ({
      id: m.id,
      titulo: m.titulo,
      ordem: m.ordem,
      aulas: m.aulas.map((a) => {
        const progress = progressMap.get(a.id);
        return {
          id: a.id,
          titulo: a.titulo,
          duracaoSegundos: a.duracaoSegundos,
          ordem: a.ordem,
          status: a.status,
          concluida: progress?.concluida || false,
          tempoAssistido: progress?.tempoAssistido || 0,
        };
      }),
    }));

    const totalAulas = allLessonIds.length;
    const aulasCompletas = userProgress.filter((p) => p.concluida).length;

    return {
      id: course.id,
      titulo: course.titulo,
      descricao: course.descricao,
      thumbnailUrl: course.thumbnailUrl,
      totalAulas,
      aulasCompletas,
      progresso: totalAulas > 0 ? Math.round((aulasCompletas / totalAulas) * 100) : 0,
      modulos,
    };
  }

  // =====================
  // USER — Aula Detail + Video URL
  // =====================

  async getLessonForUser(lessonId: string, userId: string): Promise<any> {
    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId },
      relations: ['modulo', 'modulo.curso', 'modulo.curso.planAccess'],
    });

    if (!lesson) throw new NotFoundException('Aula não encontrada');

    const course = lesson.modulo.curso;

    // Verifica acesso
    if (course.planAccess && course.planAccess.length > 0) {
      const subscription = await this.subscriptionRepo.findOne({
        where: { userId, status: In(['active', 'expiring']) },
      });
      if (!subscription || !course.planAccess.some((pa) => pa.planId === subscription.planId)) {
        throw new ForbiddenException('Seu plano não inclui este curso');
      }
    }

    // Gera URL do vídeo se disponível
    let videoUrl: string | null = null;
    if (lesson.videoKey) {
      if (lesson.status === 'pronto') {
        videoUrl = await this.storageService.getHlsManifestUrl(lesson.videoKey);
      } else {
        videoUrl = await this.storageService.generateViewUrl(lesson.videoKey);
      }
    }

    // Busca anexos com URLs de download
    const rawAnexos = await this.attachmentRepo.find({
      where: { aulaId: lessonId },
      order: { createdAt: 'ASC' },
    });
    const anexos = await Promise.all(
      rawAnexos.map(async (a) => ({
        id: a.id,
        nome: a.nome,
        fileName: a.fileName,
        contentType: a.contentType,
        tamanhoBytes: a.tamanhoBytes,
        downloadUrl: await this.storageService.generateAttachmentDownloadUrl(a.fileKey, a.fileName),
      })),
    );

    // Busca progresso do user
    const progress = await this.progressRepo.findOne({
      where: { usuarioId: userId, aulaId: lessonId },
    });

    // Busca aulas do mesmo módulo para navegação
    const siblingLessons = await this.lessonRepo.find({
      where: { moduloId: lesson.moduloId },
      order: { ordem: 'ASC' },
      select: ['id', 'titulo', 'ordem'],
    });

    const currentIndex = siblingLessons.findIndex((l) => l.id === lessonId);

    return {
      id: lesson.id,
      titulo: lesson.titulo,
      conteudoTexto: lesson.conteudoTexto,
      duracaoSegundos: lesson.duracaoSegundos,
      videoUrl,
      status: lesson.status,
      concluida: progress?.concluida || false,
      tempoAssistido: progress?.tempoAssistido || 0,
      cursoId: course.id,
      cursoTitulo: course.titulo,
      moduloId: lesson.moduloId,
      moduloTitulo: lesson.modulo.titulo,
      anexos,
      aulaAnterior: currentIndex > 0 ? siblingLessons[currentIndex - 1] : null,
      proximaAula: currentIndex < siblingLessons.length - 1 ? siblingLessons[currentIndex + 1] : null,
    };
  }

  // =====================
  // USER — Progresso
  // =====================

  async updateProgress(userId: string, lessonId: string, dto: UpdateProgressDto): Promise<LessonProgress> {
    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId },
      relations: ['modulo', 'modulo.curso'],
    });
    if (!lesson) throw new NotFoundException('Aula não encontrada');

    let progress = await this.progressRepo.findOne({
      where: { usuarioId: userId, aulaId: lessonId },
    });

    const wasCompleted = progress?.concluida || false;

    if (progress) {
      if (dto.concluida !== undefined) progress.concluida = dto.concluida;
      if (dto.tempoAssistido !== undefined) progress.tempoAssistido = dto.tempoAssistido;
    } else {
      progress = this.progressRepo.create({
        usuarioId: userId,
        aulaId: lessonId,
        concluida: dto.concluida ?? false,
        tempoAssistido: dto.tempoAssistido ?? 0,
      });
    }

    const savedProgress = await this.progressRepo.save(progress);

    // NOTIFICATION: Conclusão de Curso (100%)
    if (dto.concluida === true && !wasCompleted && lesson.modulo?.cursoId) {
      const courseId = lesson.modulo.cursoId;
      const course = await this.courseRepo.findOne({
        where: { id: courseId },
        relations: ['modulos', 'modulos.aulas'],
      });

      if (course) {
        const totalLessons = course.modulos.reduce((sum, m) => sum + (m.aulas?.length || 0), 0);
        if (totalLessons > 0) {
          const lessonIds = course.modulos.flatMap((m) => m.aulas.map((a) => a.id));
          const completedLessons = await this.progressRepo.count({
            where: { usuarioId: userId, aulaId: In(lessonIds), concluida: true },
          });

          // Se acabou de completar a última aula
          if (completedLessons === totalLessons) {
            await this.notificationsService.create({
              userId,
              type: 'COURSE_COMPLETED',
              title: 'Parabéns!',
              content: `Você concluiu 100% do curso "${course.titulo}". Continue assim!`,
              link: `/dashboard/courses/${courseId}`,
            });
          }
        }
      }
    }

    return savedProgress;
  }
}


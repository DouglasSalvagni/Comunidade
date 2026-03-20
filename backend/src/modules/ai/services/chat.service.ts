import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CourseChatMessage } from '../entities/course-chat-message.entity';
import { CourseChatSummary } from '../entities/course-chat-summary.entity';
import { LessonKnowledge } from '../entities/lesson-knowledge.entity';
import { OpenAiService } from './openai.service';
import { OpenAI } from 'openai';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(CourseChatMessage)
    private readonly chatMessageRepo: Repository<CourseChatMessage>,
    @InjectRepository(CourseChatSummary)
    private readonly chatSummaryRepo: Repository<CourseChatSummary>,
    @InjectRepository(LessonKnowledge)
    private readonly knowledgeRepo: Repository<LessonKnowledge>,
    private readonly openAiService: OpenAiService,
  ) {}

  async processChat(userId: string, text: string, courseId?: string, lessonId?: string) {
    this.logger.log(`Processing chat for user ${userId}, course ${courseId}, lesson ${lessonId}`);

    // 1. Gerar Embedding da dúvida do usuário
    const embedding = await this.openAiService.generateEmbedding(text);

    // 2. Busca RAG na base de conhecimento (lesson_knowledge)
    // Procuramos os trechos mais similares usando a distância de cosseno (<=>)
    let knowledgeContext = [];
    if (lessonId) {
      const results = await this.knowledgeRepo.query(
        `SELECT content, 1 - (embedding <=> $1) as similarity 
         FROM lesson_knowledge 
         WHERE lesson_id = $2 
         ORDER BY embedding <=> $1 
         LIMIT 5`,
        [`[${embedding.join(',')}]`, lessonId],
      );
      knowledgeContext = results.map((r: any) => r.content);
    } else if (courseId) {
      const results = await this.knowledgeRepo.query(
        `SELECT content, 1 - (embedding <=> $1) as similarity 
         FROM lesson_knowledge 
         WHERE course_id = $2 
         ORDER BY embedding <=> $1 
         LIMIT 5`,
        [`[${embedding.join(',')}]`, courseId],
      );
      knowledgeContext = results.map((r: any) => r.content);
    } else {
      const results = await this.knowledgeRepo.query(
        `SELECT content, 1 - (embedding <=> $1) as similarity 
         FROM lesson_knowledge 
         ORDER BY embedding <=> $1 
         LIMIT 5`,
        [`[${embedding.join(',')}]`],
      );
      knowledgeContext = results.map((r: any) => r.content);
    }

    // 3. Buscar Histórico Recente de Chat do Usuário (últimas 10 mensagens)
    let whereCondition: any = { userId };
    if (lessonId) {
      whereCondition.lessonId = lessonId;
    } else if (courseId) {
      whereCondition.courseId = courseId;
      whereCondition.lessonId = IsNull();
    } else {
      whereCondition.courseId = IsNull();
      whereCondition.lessonId = IsNull();
    }

    const recentHistory = await this.chatMessageRepo.find({
      where: whereCondition,
      order: { createdAt: 'DESC', role: 'ASC' }, // role: 'ASC' desempata colocando 'assistant' antes de 'user'
      take: 10,
    });
    recentHistory.reverse(); // Ordenar da mais antiga para a mais nova (cronológico)

    // Formatar histórico para a OpenAI
    const historyMessages: OpenAI.Chat.ChatCompletionMessageParam[] = recentHistory.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // 4. Montar o Prompt e chamar a OpenAI
    const systemPrompt = `Você é um assistente educacional da plataforma Wizer. 
Sua missão é responder às dúvidas dos alunos com base EXCLUSIVAMENTE no contexto das aulas fornecido abaixo.
Se a resposta não estiver no contexto, diga gentilmente que não tem essa informação com base nas aulas atuais, mas tente ajudar de forma genérica se aplicável, deixando claro que é um conhecimento externo.
Seja sempre cordial, didático e claro.`;

    const contextMessage = knowledgeContext.length > 0 
      ? `Contexto extraído das aulas:\n\n${knowledgeContext.join('\n\n---\n\n')}`
      : 'Nenhum contexto específico encontrado nas aulas para esta dúvida.';

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      { role: 'system', content: contextMessage },
      ...historyMessages,
      { role: 'user', content: text },
    ];

    const aiResponse = await this.openAiService.generateChatCompletion(messages, 'gpt-4o-mini');
    const answer = aiResponse.content || 'Desculpe, não consegui processar uma resposta no momento.';

    // 5. Salvar a pergunta e a resposta no histórico (assincronamente ou aguardando)
    // Separamos em dois saves para garantir que o 'user' receba um timestamp (createdAt) ligeiramente
    // mais antigo que o 'assistant' caso a resolução do banco não distingua os microsegundos.
    const userMsg = this.chatMessageRepo.create({
      userId,
      courseId: courseId || null,
      lessonId: lessonId || null,
      role: 'user',
      content: text,
      embedding: `[${embedding.join(',')}]`,
    });
    await this.chatMessageRepo.save(userMsg);

    const asstMsg = this.chatMessageRepo.create({
      userId,
      courseId: courseId || null,
      lessonId: lessonId || null,
      role: 'assistant',
      content: answer,
    });
    await this.chatMessageRepo.save(asstMsg);

    return {
      answer,
      contextUsed: knowledgeContext.length > 0,
    };
  }

  async getHistory(userId: string, courseId?: string, lessonId?: string, limit = 20) {
    let whereCondition: any = { userId };
    if (lessonId) {
      whereCondition.lessonId = lessonId;
    } else if (courseId) {
      whereCondition.courseId = courseId;
      whereCondition.lessonId = IsNull();
    } else {
      whereCondition.courseId = IsNull();
      whereCondition.lessonId = IsNull();
    }

    const history = await this.chatMessageRepo.find({
      where: whereCondition,
      order: { createdAt: 'DESC', role: 'ASC' }, // Pegamos as últimas (role ASC desempata colocando assistant antes de user)
      take: limit,
    });
    return history.reverse(); // Retornamos em ordem cronológica (mais antigas primeiro)
  }
}

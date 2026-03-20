import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from '../entities/chat-message.entity';
import { ChatSummary } from '../entities/chat-summary.entity';
import { LessonKnowledge } from '../entities/lesson-knowledge.entity';
import { OpenAiService } from './openai.service';
import { OpenAI } from 'openai';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepo: Repository<ChatMessage>,
    @InjectRepository(ChatSummary)
    private readonly chatSummaryRepo: Repository<ChatSummary>,
    @InjectRepository(LessonKnowledge)
    private readonly knowledgeRepo: Repository<LessonKnowledge>,
    private readonly openAiService: OpenAiService,
  ) {}

  async processChat(userId: string, text: string, courseId?: string) {
    this.logger.log(`Processing chat for user ${userId}, course ${courseId}`);

    // 1. Gerar Embedding da dúvida do usuário
    const embedding = await this.openAiService.generateEmbedding(text);

    // 2. Busca RAG na base de conhecimento (lesson_knowledge)
    // Procuramos os trechos mais similares usando a distância de cosseno (<=>)
    let knowledgeContext = [];
    if (courseId) {
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
    const recentHistory = await this.chatMessageRepo.find({
      where: { userId, courseId: courseId || null },
      order: { createdAt: 'DESC' },
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
    await this.chatMessageRepo.save([
      this.chatMessageRepo.create({
        userId,
        courseId: courseId || null,
        role: 'user',
        content: text,
        embedding: `[${embedding.join(',')}]`,
      }),
      this.chatMessageRepo.create({
        userId,
        courseId: courseId || null,
        role: 'assistant',
        content: answer,
      }),
    ]);

    return {
      answer,
      contextUsed: knowledgeContext.length > 0,
    };
  }

  async getHistory(userId: string, courseId?: string, limit = 20) {
    const history = await this.chatMessageRepo.find({
      where: { userId, courseId: courseId || null },
      order: { createdAt: 'ASC' }, // chronological
      take: limit,
    });
    return history;
  }
}

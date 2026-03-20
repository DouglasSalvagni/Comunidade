import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);
  private openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY is not set. AI features will not work.');
    }

    this.openai = new OpenAI({
      apiKey: apiKey || 'dummy-key',
    });
  }

  /**
   * Generates embeddings for a given text.
   * By default uses text-embedding-3-small which returns 1536 dimensions.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      this.logger.error('Error generating embedding', error);
      throw error;
    }
  }

  /**
   * Generates a chat completion.
   */
  async generateChatCompletion(messages: OpenAI.Chat.ChatCompletionMessageParam[], model = 'gpt-4o-mini') {
    try {
      const response = await this.openai.chat.completions.create({
        model,
        messages,
      });

      return response.choices[0].message;
    } catch (error) {
      this.logger.error('Error generating chat completion', error);
      throw error;
    }
  }
}

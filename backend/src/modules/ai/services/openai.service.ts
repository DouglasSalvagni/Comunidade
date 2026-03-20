import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as fs from 'fs';

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
   * Helper function to split text into chunks roughly matching token limits.
   * OpenAI's text-embedding-3-small has a limit of 8191 tokens.
   * A rough estimation is 1 token ~= 4 characters.
   * Para um RAG eficiente e para garantir que não passamos do limite,
   * vamos usar chunks de ~1000 tokens (4000 caracteres).
   */
  chunkText(text: string, maxChars = 4000): string[] {
    const chunks: string[] = [];
    let currentIndex = 0;

    while (currentIndex < text.length) {
      // Find a natural break point (like a newline or period) near the limit
      let end = currentIndex + maxChars;
      if (end >= text.length) {
        chunks.push(text.slice(currentIndex));
        break;
      }

      // Try to find a paragraph break
      let breakIndex = text.lastIndexOf('\n\n', end);
      
      // Fallback to single newline
      if (breakIndex <= currentIndex) {
        breakIndex = text.lastIndexOf('\n', end);
      }

      // Fallback to period
      if (breakIndex <= currentIndex) {
        breakIndex = text.lastIndexOf('. ', end);
      }

      // Fallback to space
      if (breakIndex <= currentIndex) {
        breakIndex = text.lastIndexOf(' ', end);
      }

      // Absolute fallback if no spaces exist (very rare)
      if (breakIndex <= currentIndex) {
        breakIndex = end;
      }

      chunks.push(text.slice(currentIndex, breakIndex).trim());
      currentIndex = breakIndex + 1; // skip the separator
    }

    return chunks;
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
   * Transcribes audio using Whisper.
   */
  async transcribeAudio(audioFilePath: string): Promise<string> {
    try {
      const response = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(audioFilePath),
        model: 'whisper-1',
      });

      return response.text;
    } catch (error) {
      this.logger.error('Error transcribing audio', error);
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

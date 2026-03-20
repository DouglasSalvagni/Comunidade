import { Controller, Post, Get, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ChatService } from './services/chat.service';

@ApiTags('AI Chat')
@Controller('ai/chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Send a message to the AI agent' })
  async sendMessage(
    @Request() req,
    @Body() body: { message: string; courseId?: string },
  ) {
    const userId = req.user.userId;
    const { message, courseId } = body;
    
    const result = await this.chatService.processChat(userId, message, courseId);
    return result;
  }

  @Get('history')
  @ApiOperation({ summary: 'Get chat history for the current user' })
  async getHistory(
    @Request() req,
    @Query('courseId') courseId?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.userId;
    const l = limit ? parseInt(limit, 10) : 20;
    
    return this.chatService.getHistory(userId, courseId, l);
  }
}

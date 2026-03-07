import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ description: 'E-mail do usuário', example: 'user@example.com' })
  @IsEmail()
  email: string;
}
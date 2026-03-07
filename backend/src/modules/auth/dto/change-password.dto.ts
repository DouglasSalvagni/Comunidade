import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Senha atual', example: 'Senha123' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ description: 'Nova senha (mínimo 6 caracteres)', example: 'NovaSenha123', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
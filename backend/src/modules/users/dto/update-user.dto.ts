import {
  IsEmail,
  IsString,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
  IsArray,
  ValidateNested,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class ProfileLinkDto {
  @ApiProperty({ example: 'LinkedIn' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  label: string;

  @ApiProperty({ example: 'https://linkedin.com/in/exemplo' })
  @IsString()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  url: string;
}

export class UpdateUserDto {
  @ApiProperty({
    description: 'User full name',
    example: 'João Silva',
    required: false,
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    description: 'User email address',
    example: 'joao@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'User password (minimum 6 characters)',
    example: 'Senha123',
    required: false,
    minLength: 6,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({
    description: 'User role',
    example: 'user',
    required: false,
    enum: ['user', 'admin'],
  })
  @IsOptional()
  @IsString()
  role?: 'user' | 'admin';

  @ApiProperty({
    description: 'Whether the user is active',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Biografia do usuário em HTML',
    required: false,
    maxLength: 10000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  bio?: string;

  @ApiProperty({
    description: 'Chave do avatar no storage',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarKey?: string;

  @ApiProperty({
    description: 'Links públicos do perfil',
    required: false,
    type: [ProfileLinkDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProfileLinkDto)
  profileLinks?: ProfileLinkDto[];
}

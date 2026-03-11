import { IsOptional, IsString, MinLength, MaxLength, IsArray, ValidateNested, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class ProfileLinkDto {
  @ApiProperty({ example: 'Website' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  label: string;

  @ApiProperty({ example: 'https://meusite.com' })
  @IsString()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  url: string;
}

export class UpdateProfileDto {
  @ApiProperty({
    description: 'Nome completo do usuário',
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
    description: 'Biografia pública do membro em HTML',
    required: false,
    maxLength: 10000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  bio?: string;

  @ApiProperty({
    description: 'Links públicos do membro',
    required: false,
    type: [ProfileLinkDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProfileLinkDto)
  profileLinks?: ProfileLinkDto[];
}

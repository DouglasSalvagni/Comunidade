import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsEnum(['rascunho', 'publicado'])
  status?: 'rascunho' | 'publicado';
}

import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateLessonDto {
  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  conteudoTexto?: string;

  @IsOptional()
  @IsString()
  videoKey?: string;

  @IsOptional()
  @IsInt()
  duracaoSegundos?: number;

  @IsOptional()
  @IsInt()
  ordem?: number;
}

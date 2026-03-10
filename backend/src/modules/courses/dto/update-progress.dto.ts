import { IsBoolean, IsInt, IsOptional } from 'class-validator';

export class UpdateProgressDto {
  @IsOptional()
  @IsBoolean()
  concluida?: boolean;

  @IsOptional()
  @IsInt()
  tempoAssistido?: number;
}

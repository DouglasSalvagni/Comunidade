import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateModuleDto {
  @IsString()
  titulo: string;

  @IsOptional()
  @IsInt()
  ordem?: number;
}

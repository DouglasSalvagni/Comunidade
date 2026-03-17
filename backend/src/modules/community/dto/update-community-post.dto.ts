import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCommunityPostDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsString()
  contentHtml?: string;
}

import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCommunityPostDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @IsString()
  contentHtml: string;
}

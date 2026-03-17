import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCommunityCommentDto {
  @IsString()
  contentHtml: string;

  @IsOptional()
  @IsUUID('4')
  parentCommentId?: string;
}

import { IsString } from 'class-validator';

export class UpdateCommunityCommentDto {
  @IsString()
  contentHtml: string;
}

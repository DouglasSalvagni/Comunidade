import { IsString, MaxLength } from 'class-validator';

export class GenerateCommunityPostUploadUrlDto {
  @IsString()
  @MaxLength(255)
  fileName: string;

  @IsString()
  @MaxLength(120)
  contentType: string;
}

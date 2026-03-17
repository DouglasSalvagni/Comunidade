import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class AddCommunityPostAttachmentDto {
  @IsString()
  fileKey: string;

  @IsString()
  @MaxLength(255)
  fileName: string;

  @IsString()
  @MaxLength(120)
  contentType: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sizeBytes?: number;
}

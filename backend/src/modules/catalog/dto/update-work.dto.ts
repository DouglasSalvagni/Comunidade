import { IsString, IsOptional, IsIn, IsInt, Min, IsBoolean, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class UpdateWorkDto {
  @ApiProperty({
    description: 'Work title',
    required: false,
    example: 'A Bela e a Fera',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Work description',
    required: false,
    example: 'Um clássico conto de fadas...',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Work type',
    required: false,
    enum: ['music', 'audiobook'],
  })
  @IsOptional()
  @IsIn(['music', 'audiobook'])
  type?: 'music' | 'audiobook';

  @ApiProperty({ description: 'Recommended minimum age in months', required: false, example: 36 })
  @IsOptional()
  @IsInt()
  @Min(0)
  recommendedMinMonths?: number;

  @ApiProperty({ description: 'Recommended maximum age in months', required: false, example: 96 })
  @IsOptional()
  @IsInt()
  @Min(0)
  recommendedMaxMonths?: number;

  @ApiProperty({ description: 'Optional human-readable label for age range', required: false, example: '3–8 anos' })
  @IsOptional()
  @IsString()
  recommendedAgeLabel?: string;

  @ApiProperty({
    description: 'Cover image URL',
    required: false,
    example: 'https://example.com/cover.jpg',
  })
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiProperty({
    description: 'Duration in seconds',
    required: false,
    example: 1800,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;

  @ApiProperty({
    description: 'Whether the work is active',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Tag IDs to set on work', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  tagIds?: string[];

  @ApiProperty({ description: 'Development Theme IDs to set on work', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  devThemeIds?: string[];
}

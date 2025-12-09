import { IsString, IsOptional, IsIn, IsInt, Min, IsBoolean, IsArray, IsUUID, ArrayNotEmpty, ArrayUnique } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkDto {
  @ApiProperty({
    description: 'Work title',
    example: 'A Bela e a Fera',
  })
  @IsString()
  title: string;

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
    enum: ['music', 'audiobook'],
  })
  @IsIn(['music', 'audiobook'])
  type: 'music' | 'audiobook';

  @ApiProperty({
    description: 'Recommended minimum age in months',
    required: true,
    example: 36,
  })
  @IsInt()
  @Min(0)
  recommendedMinMonths: number;

  @ApiProperty({
    description: 'Recommended maximum age in months',
    required: true,
    example: 96,
  })
  @IsInt()
  @Min(0)
  recommendedMaxMonths: number;

  @ApiProperty({
    description: 'Optional human-readable label for age range',
    required: false,
    example: '3–8 anos',
  })
  @IsOptional()
  @IsString()
  recommendedAgeLabel?: string;

  @ApiProperty({
    description: 'Artist name',
    required: false,
    example: 'Toquinho',
  })
  @IsOptional()
  @IsString()
  artistName?: string;

  @ApiProperty({
    description: 'Tag IDs to associate with the work',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @ApiProperty({
    description: 'Development Theme IDs to associate with the work',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  devThemeIds?: string[];

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
  isActive?: boolean = true;
}

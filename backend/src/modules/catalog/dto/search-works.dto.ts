import { IsString, IsOptional, IsIn, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SearchWorksDto {
  @ApiProperty({ description: 'Work type', required: false, enum: ['music', 'audiobook', 'series'] })
  @IsOptional()
  @IsIn(['music', 'audiobook', 'series'])
  type?: string;

  @ApiProperty({ description: 'Filter by a single age point in months', required: false, example: 72 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  agePointMonths?: number;

  @ApiProperty({ description: 'Filter by minimum age in months', required: false, example: 36 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minMonths?: number;

  @ApiProperty({ description: 'Filter by maximum age in months', required: false, example: 96 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxMonths?: number;

  @ApiProperty({
    description: 'Comma-separated tag names',
    required: false,
    example: 'Aventura,Educativo',
  })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiProperty({
    description: 'Comma-separated development theme names',
    required: false,
    example: 'Linguagem,Cognição',
  })
  @IsOptional()
  @IsString()
  devThemes?: string;

  @ApiProperty({
    description: 'Search term',
    required: false,
    example: 'história',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Page number',
    required: false,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Items per page',
    required: false,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({ description: 'Active profile ID to scope favorites', required: false })
  @IsOptional()
  @IsString()
  profileId?: string;

  @ApiProperty({
    description: 'Sort order (field:direction)',
    required: false,
    example: 'createdAt:desc',
    enum: ['createdAt:asc', 'createdAt:desc', 'title:asc', 'title:desc']
  })
  @IsOptional()
  @IsString()
  sort?: string;
}

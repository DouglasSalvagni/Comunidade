import { IsString, IsOptional, Length, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProfileDto {
  @ApiProperty({
    description: 'Profile name',
    example: 'Joãozinho',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({
    description: 'Birth date (YYYY-MM-DD)',
    example: '2018-03-15',
    required: true,
  })
  @IsDateString()
  birthDate: string;

  @ApiProperty({
    description: 'Parental PIN (4 digits)',
    example: '1234',
    required: false,
  })
  @IsOptional()
  @Length(4, 4)
  @IsString()
  parentalPin?: string;

  @ApiProperty({
    description: 'Whether the profile is active',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

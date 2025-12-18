import { IsString, IsIn, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLegalDocumentDto {
  @ApiProperty({ enum: ['PRIVACY_POLICY', 'TERMS_OF_USE'] })
  @IsIn(['PRIVACY_POLICY', 'TERMS_OF_USE'])
  type: 'PRIVACY_POLICY' | 'TERMS_OF_USE';

  @ApiProperty({ description: 'HTML content of the document' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Whether to set this document active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}


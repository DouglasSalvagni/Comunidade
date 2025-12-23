import {
  IsArray,
  ArrayNotEmpty,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SaveAffiliateDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  walletId: string;
}

export class SavePartnershipAffiliateDto {
  @ApiProperty()
  @IsUUID()
  affiliateId: string;

  @ApiProperty({ enum: ['PERCENT', 'FIXED'] })
  @IsEnum(['PERCENT', 'FIXED'] as any)
  payoutType: 'PERCENT' | 'FIXED';

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  payoutValue: number;
}

export class SavePartnershipDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE'], required: false })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'] as any)
  status?: 'ACTIVE' | 'INACTIVE';

  @ApiProperty({ enum: ['PERCENT', 'FIXED'] })
  @IsEnum(['PERCENT', 'FIXED'] as any)
  discountType: 'PERCENT' | 'FIXED';

  @ApiProperty()
  @IsNumber()
  @Min(0)
  discountValue: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  startsAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  endsAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxRedemptions?: number;

  @ApiProperty({ type: [SavePartnershipAffiliateDto], required: false })
  @IsOptional()
  @IsArray()
  affiliates?: SavePartnershipAffiliateDto[];
}


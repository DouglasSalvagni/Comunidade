import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActivateCouponDto {
  @ApiProperty({
    description: 'Código do cupom/parceria',
    example: 'PARCEIRO10',
  })
  @IsString()
  code: string;
}


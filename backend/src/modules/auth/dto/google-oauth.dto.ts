import { IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class GoogleOAuthDto {
  @ApiProperty({ description: 'Google ID Token', minLength: 10 })
  @IsString()
  @MinLength(10)
  idToken: string
}


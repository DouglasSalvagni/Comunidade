import { IsString, MinLength, IsOptional, ValidateNested } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'

class AppleUserName {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    firstName?: string

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    lastName?: string
}

class AppleUserInfo {
    @ApiPropertyOptional({ type: AppleUserName })
    @IsOptional()
    @ValidateNested()
    @Type(() => AppleUserName)
    name?: AppleUserName

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    email?: string
}

export class AppleOAuthDto {
    @ApiProperty({ description: 'Apple Identity Token (JWT)', minLength: 10 })
    @IsString()
    @MinLength(10)
    identityToken: string

    @ApiProperty({ description: 'Apple User ID (credential.user)' })
    @IsString()
    @MinLength(1)
    appleUserId: string

    @ApiPropertyOptional({ description: 'User info (name/email) — only available on first sign-in', type: AppleUserInfo })
    @IsOptional()
    @ValidateNested()
    @Type(() => AppleUserInfo)
    user?: AppleUserInfo
}

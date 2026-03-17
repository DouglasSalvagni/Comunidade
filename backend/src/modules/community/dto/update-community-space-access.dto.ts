import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class UpdateCommunitySpaceAccessDto {
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  ids: string[];
}

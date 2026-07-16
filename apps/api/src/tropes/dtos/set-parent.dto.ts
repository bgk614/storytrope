import { IsString, ValidateIf } from 'class-validator';

export class SetParentDto {
  @ValidateIf((o: SetParentDto) => o.parentId !== null)
  @IsString()
  parentId: string | null;
}

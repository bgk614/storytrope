import { IsNotEmpty, IsString } from 'class-validator';

export class AddTropeToWorkDto {
  @IsNotEmpty()
  @IsString()
  tropeId: string;
}

export class AddWorkToTropeDto {
  @IsNotEmpty()
  @IsString()
  workId: string;
}

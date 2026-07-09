import { IsNotEmpty, IsString } from 'class-validator';

export class AddTropeToBookDto {
  @IsNotEmpty()
  @IsString()
  tropeId: string;
}

export class AddBookToTropeDto {
  @IsNotEmpty()
  @IsString()
  workId: string;
}

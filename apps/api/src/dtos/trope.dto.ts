import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateTropeDto {
  @IsNotEmpty()
  @IsString()
  name: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  parentId?: string
}

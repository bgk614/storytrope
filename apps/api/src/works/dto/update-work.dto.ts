import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateWorkDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  firstPublishDate?: string;

  @IsOptional()
  @IsInt()
  coverId?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  authorNames?: string[];
}

import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination-query.dto';

export class ListWorksQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  query?: string;
}

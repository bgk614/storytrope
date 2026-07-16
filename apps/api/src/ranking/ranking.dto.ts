import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import type { RankingPeriod } from './ranking.service';

export class TopTropesQueryDto {
  @IsOptional()
  @IsIn(['weekly', 'monthly', 'yearly'])
  period?: RankingPeriod;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  take?: number;
}

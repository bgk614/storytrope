import { IsEnum } from 'class-validator';
import { VoteType } from '../../generated/prisma/enums.js';

export class VoteDto {
  @IsEnum(VoteType)
  voteType: VoteType;
}

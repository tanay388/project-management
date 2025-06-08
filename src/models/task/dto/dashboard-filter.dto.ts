import { IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardFilterDto {
  @ApiPropertyOptional({ description: 'Start date for filtering tasks' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fromDate?: Date;

  @ApiPropertyOptional({ description: 'End date for filtering tasks' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  toDate?: Date;
}
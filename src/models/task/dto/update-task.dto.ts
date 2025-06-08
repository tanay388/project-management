import { IsOptional, IsEnum, IsString, IsUUID, IsDate, IsArray } from 'class-validator';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { TaskType, TaskStatus, TaskPriority } from '../entities/task.entity';
import { Type } from 'class-transformer';
import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {

  @ApiPropertyOptional({ enum: TaskStatus, description: 'Task status' })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

}
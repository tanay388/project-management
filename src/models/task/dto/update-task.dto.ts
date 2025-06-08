import { IsOptional, IsEnum, IsString, IsUUID, IsDate, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskType, TaskStatus, TaskPriority } from '../entities/task.entity';
import { Type } from 'class-transformer';

export class UpdateTaskDto {
  @ApiPropertyOptional({ description: 'Task title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ enum: TaskType, description: 'Type of task' })
  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  @ApiPropertyOptional({ enum: TaskPriority, description: 'Task priority level' })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ description: 'Target completion date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  targetCompletionDate?: Date;

  @ApiPropertyOptional({ description: 'Task description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Business justification' })
  @IsOptional()
  @IsString()
  businessJustification?: string;

  @ApiPropertyOptional({ description: 'Technical requirements' })
  @IsOptional()
  @IsString()
  technicalRequirements?: string;

  @ApiPropertyOptional({ description: 'Task dependencies' })
  @IsOptional()
  @IsString()
  dependencies?: string;

  @ApiPropertyOptional({ description: 'Acceptance criteria' })
  @IsOptional()
  @IsString()
  acceptanceCriteria?: string;

  @ApiPropertyOptional({ description: 'User ID to assign the task to' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'Admin panel link' })
  @IsOptional()
  @IsString()
  adminPanelLink?: string;

  @ApiPropertyOptional({ enum: TaskStatus, description: 'Task status' })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ type: [String], description: 'Array of attachment URLs' })
  @IsOptional()
  @IsArray()
  attachments?: string[];
}
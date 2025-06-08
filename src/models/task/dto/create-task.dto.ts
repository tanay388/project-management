import { IsString, IsEnum, IsNotEmpty, IsUUID, IsDate, IsOptional, IsArray, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskType, TaskPriority } from '../entities/task.entity';
import { Type } from 'class-transformer';

export class CreateTaskDto {
  @ApiProperty({ description: 'Task title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ enum: TaskType, description: 'Type of task' })
  @IsEnum(TaskType)
  @IsNotEmpty()
  type: TaskType;

  @ApiProperty({ enum: TaskPriority, description: 'Task priority level' })
  @IsEnum(TaskPriority)
  @IsNotEmpty()
  priority: TaskPriority;

  @ApiProperty({ description: 'Target completion date' })
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  targetCompletionDate: Date;

  @ApiProperty({ description: 'Task description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Business justification for the task' })
  @IsString()
  @IsNotEmpty()
  businessJustification: string;

  @ApiPropertyOptional({ description: 'Technical requirements' })
  @IsString()
  @IsOptional()
  technicalRequirements?: string;

  @ApiPropertyOptional({ description: 'Task dependencies' })
  @IsString()
  @IsOptional()
  dependencies?: string;

  @ApiProperty({ description: 'Acceptance criteria' })
  @IsString()
  @IsNotEmpty()
  acceptanceCriteria: string;

  @ApiProperty({ description: 'User ID to assign the task to' })
  @IsString()
  @IsNotEmpty()
  assignedToId: string;

  @ApiProperty({description: 'story points '})
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  storyPoints: number;

  @ApiPropertyOptional({ description: 'Admin panel link' })
  @IsString()
  @IsOptional()
  adminPanelLink?: string;

  @ApiPropertyOptional({ type: [String], description: 'Array of attachment URLs' })
  @IsArray()
  @IsOptional()
  attachments?: string[];
}
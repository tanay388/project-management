import { ApiProperty } from '@nestjs/swagger';
import { Task } from '../entities/task.entity';

export class UserStats {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  completedTasks: number;

  @ApiProperty()
  totalStoryPoints: number;

  @ApiProperty()
  averageProgress: number;

  @ApiProperty()
  efficiency: number;
}

export class TaskStats {
  @ApiProperty()
  totalTasks: number;

  @ApiProperty()
  completedTasks: number;

  @ApiProperty()
  inProgressTasks: number;

  @ApiProperty()
  newTasks: number;

  @ApiProperty()
  inReviewTasks: number;

  @ApiProperty()
  totalStoryPoints: number;

  @ApiProperty()
  averageProgress: number;

  @ApiProperty()
  overallEfficiency: number;
}

export class DashboardResponseDto {
  @ApiProperty()
  taskStats: TaskStats;

  @ApiProperty({ type: [UserStats] })
  userStats: UserStats[];

  @ApiProperty({ type: [Task] })
  recentTasks: Task[];
}
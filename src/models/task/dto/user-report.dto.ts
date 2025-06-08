import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UserReportFilterDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    userId: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    fromDate?: Date;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    toDate?: Date;
}

export class UserReportResponseDto {
    taskMetrics: {
        totalTasks: number;
        completedTasks: number;
        inProgressTasks: number;
        averageCompletionTime: number;
        onTimeDelivery: number;
    };
    productivityMetrics: {
        totalStoryPoints: number;
        averageStoryPointsPerTask: number;
        storyPointsCompleted: number;
        efficiency: number;
    };
    timelineMetrics: {
        tasksCompletedOnTime: number;
        tasksDelayed: number;
        averageDelay: number;
    };
    qualityMetrics: {
        tasksNeedingRevision: number;
        firstTimeAcceptanceRate: number;
    };
}
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Department, UserRole, UserStatus } from '../entities/user.entity';

export class UpdateUserStatusDto {
  @ApiProperty({ enum: UserStatus })
  @IsEnum(UserStatus)
  status: UserStatus;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ enum: Department })
  @IsEnum(Department)
  @IsOptional()
  department?: Department;

  @ApiProperty()
  @IsString()
  @IsOptional()
  designation?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  employeeId?: string;
}
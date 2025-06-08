import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, UseInterceptors, UploadedFiles, ParseIntPipe, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskFilterDto } from './dto/task-filter.dto';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';
import { DashboardResponseDto } from './dto/dashboard-response.dto';
import { Task, TaskStatus } from './entities/task.entity';
import { FirebaseSecure } from '../user/decorator/firebase.secure.decorator';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { FUser } from '../user/decorator/firebase.user.decorator';
import { FirebaseUser } from 'src/providers/firebase/firebase.service';

@ApiTags('tasks')
@Controller('tasks')
@FirebaseSecure()
@ApiBearerAuth()
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully', type: Task })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'files', maxCount: 10 },
      ],
    ),
  )
  create(@FUser() user: FirebaseUser, @Body() createTaskDto: CreateTaskDto, @Request() req, @UploadedFiles() files: { files?: Express.Multer.File[] }) {
    return this.taskService.create(createTaskDto, user, files);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks with filters' })
  @ApiResponse({ status: 200, description: 'Return all tasks', type: [Task] })
  findAll(@Query() filters: TaskFilterDto) {
    return this.taskService.findAll(filters);
  }

  @Get('my-tasks')
  @ApiOperation({ summary: 'Get tasks requested by current user' })
  @ApiResponse({ status: 200, description: 'Return user\'s tasks', type: [Task] })
  findMyTasks(@Query() filters: TaskFilterDto, @Request() req) {
    return this.taskService.findMyTasks(req.user.id, filters);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Return dashboard statistics', type: DashboardResponseDto })
  getDashboardStats(@Query(new ValidationPipe({ transform: true })) filters: DashboardFilterDto) {
    return this.taskService.getDashboardStats(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by id' })
  @ApiResponse({ status: 200, description: 'Return found task', type: Task })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task' })
  @ApiResponse({ status: 200, description: 'Task updated successfully', type: Task })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'files', maxCount: 10 },
      ],
    ),
  )
  update(@Param('id', ParseIntPipe) id: number, @Body() updateTaskDto: UpdateTaskDto, @UploadedFiles() files: { files?: Express.Multer.File[] }) {
    return this.taskService.update(id, updateTaskDto, files.files);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update task status' })
  @ApiResponse({ status: 200, description: 'Task status updated successfully', type: Task })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: TaskStatus,
  ) {
    return this.taskService.updateStatus(id, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.remove(id);
  }


}
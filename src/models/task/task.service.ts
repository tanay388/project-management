import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, Between } from 'typeorm';
import { Task, TaskStatus, TaskType, TaskPriority } from './entities/task.entity';
import { User } from '../user/entities/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskFilterDto } from './dto/task-filter.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';
import { DashboardResponseDto, TaskStats, UserStats } from './dto/dashboard-response.dto';
import { UploaderService } from 'src/providers/uploader/uploader.service';
import { FirebaseUser } from 'src/providers/firebase/firebase.service';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private uploader: UploaderService,
  ) {}

  async create(createTaskDto: CreateTaskDto, requestedBy: FirebaseUser, files: { files?: Express.Multer.File[]; }): Promise<Task> {
    
    if(files?.files?.length){
    const attachments = await this.uploader.uploadFiles(
      files.files,
      `tasks/${new Date().getFullYear()}/${new Date().getMonth()}/${new Date().getDate()}`,
    );

    createTaskDto.attachments = attachments;
    }
    const task = this.taskRepository.create({
      ...createTaskDto,
      requestedBy: {id: requestedBy.uid},
      assignedTo: {id: createTaskDto.assignedToId},

    });
    await this.taskRepository.save(task);

    return await this.taskRepository.findOne({
      where: { id: task.id },
      relations: ['requestedBy', 'assignedTo'],
    });
  }

  async findAll(filters: TaskFilterDto) {
    const where: FindOptionsWhere<Task> = {};
    const {
      search,
      type,
      status,
      priority,
      requestedById,
      assignedToId,
      fromDate,
      toDate,
      sortBy,
      sortOrder = 'DESC',
    } = filters;

    if (search) {
      where.title = ILike(`%${search}%`);
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (requestedById) {
      where.requestedBy = { id: requestedById };
    }

    if (assignedToId) {
      where.assignedTo = { id: assignedToId };
    }

    if (fromDate && toDate) {
      where.targetCompletionDate = Between(fromDate, toDate);
    }

    const order = {};
    if (sortBy) {
      order[sortBy] = sortOrder;
    } else {
      order['createdAt'] = 'DESC';
    }

    return await this.taskRepository.find({
      where,
      order,
      relations: ['requestedBy', 'assignedTo'],
    });
  }

  async findMyTasks(userId: string, filters: TaskFilterDto) {
    return this.findAll({
      ...filters,
      requestedById: userId,
    });
  }

  async findOne(id: number): Promise<Task> {
    if (!id || isNaN(id)) {
      throw new NotFoundException('Invalid task ID');
    }

    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['requestedBy', 'assignedTo'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async update(id: number, updateTaskDto: UpdateTaskDto, files: Express.Multer.File[]): Promise<Task> {

    
    const task = await this.findOne(id);

    if(files?.length){
      const attachments = await this.uploader.uploadFiles(
        files,
        `tasks/${new Date().getFullYear()}/${new Date().getMonth()}/${new Date().getDate()}`,
      )

      updateTaskDto.attachments = [...task.attachments, ...attachments];
    }
    Object.assign(task, updateTaskDto);
    return await this.taskRepository.save(task);
  }

  async updateStatus(id: number, status: TaskStatus): Promise<Task> {
    const task = await this.findOne(id);
    task.status = status;
    return await this.taskRepository.save(task);
  }

  async remove(id: number): Promise<void> {
    const result = await this.taskRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
  }

  async getDashboardStats(filters: DashboardFilterDto): Promise<DashboardResponseDto> {
    const where: FindOptionsWhere<Task> = {};
    if (filters.fromDate && filters.toDate) {
      where.targetCompletionDate = Between(filters.fromDate, filters.toDate);
    }

    const tasks = await this.taskRepository.find({
      where,
      relations: ['requestedBy', 'assignedTo'],
    });

    const taskStats = this.calculateTaskStats(tasks);
    const userStats = this.calculateUserStats(tasks);
    const recentTasks = await this.getRecentTasks();

    return {
      taskStats,
      userStats,
      recentTasks,
    };
  }

  private calculateTaskStats(tasks: Task[]): TaskStats {
    const stats = {
      totalTasks: tasks.length,
      completedTasks: 0,
      inProgressTasks: 0,
      newTasks: 0,
      inReviewTasks: 0,
      totalStoryPoints: 0,
      averageProgress: 0,
      overallEfficiency: 0,
    };

    let totalProgress = 0;

    tasks.forEach(task => {
      stats.totalStoryPoints += task.storyPoints;
      totalProgress += task.progress || 0;

      switch (task.status) {
        case TaskStatus.completed:
          stats.completedTasks++;
          break;
        case TaskStatus.in_progress:
          stats.inProgressTasks++;
          break;
        case TaskStatus.new:
          stats.newTasks++;
          break;
        case TaskStatus.in_review:
          stats.inReviewTasks++;
          break;
      }
    });

    stats.averageProgress = tasks.length > 0 ? totalProgress / tasks.length : 0;
    stats.overallEfficiency = stats.totalStoryPoints > 0 ? 
      (stats.completedTasks * 100) / stats.totalTasks : 0;

    return stats;
  }

  private calculateUserStats(tasks: Task[]): UserStats[] {
    const userStatsMap = new Map<string, UserStats>();

    tasks.forEach(task => {
      if (!task.assignedTo) return;

      const userId = task.assignedTo.id;
      const stats = userStatsMap.get(userId) || {
        userId,
        completedTasks: 0,
        totalStoryPoints: 0,
        averageProgress: 0,
        efficiency: 0,
      };

      stats.totalStoryPoints += task.storyPoints;
      if (task.status === TaskStatus.completed) {
        stats.completedTasks++;
      }
      stats.averageProgress += task.progress || 0;

      userStatsMap.set(userId, stats);
    });

    return Array.from(userStatsMap.values()).map(stats => {
      const userTasks = tasks.filter(task => task.assignedTo?.id === stats.userId);
      stats.averageProgress = userTasks.length > 0 ? 
        stats.averageProgress / userTasks.length : 0;
      stats.efficiency = stats.totalStoryPoints > 0 ? 
        (stats.completedTasks * 100) / userTasks.length : 0;
      return stats;
    });
  }

  private async getRecentTasks(): Promise<Task[]> {
    return await this.taskRepository.find({
      order: { createdAt: 'DESC' },
      take: 5,
      relations: ['requestedBy', 'assignedTo'],
    });
  }
}
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, Between } from 'typeorm';
import { Task, TaskStatus, TaskType, TaskPriority } from './entities/task.entity';
import { User } from '../user/entities/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskFilterDto } from './dto/task-filter.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
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
    
    if(!files?.files?.length){
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

    if(!files?.length){
      const attachments = await this.uploader.uploadFiles(
        files,
        `tasks/${new Date().getFullYear()}/${new Date().getMonth()}/${new Date().getDate()}`,
      )

      task.attachments = [...task.attachments, ...attachments];
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
}
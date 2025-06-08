import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  BeforeUpdate
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { BaseClassEntity } from 'src/common/entities/base.extend-entity';

export enum TaskType {
  task = 'task',
  engineering_request = 'engineering_request',
  business_onboarding = 'business_onboarding',
  functionality_review = 'functionality_review'
}

export enum TaskStatus {
  new = 'new',
  in_progress = 'in_progress',
  in_review = 'in_review',
  completed = 'completed',
  inProgress = "inProgress"
}

export enum TaskPriority {
  low = 'low',
  medium = 'medium',
  high = 'high',
  urgent = 'urgent'
}

@Entity()
export class Task extends BaseClassEntity {

  @Column()
  title: string;

  @Column({
    type: 'enum',
    enum: TaskType,
    default: TaskType.task
  })
  type: TaskType;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn()
  requestedBy: User;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.medium
  })
  priority: TaskPriority;

  @Column({ type: 'date' })
  targetCompletionDate: Date;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  businessJustification: string;

  @Column({ type: 'text', nullable: true })
  technicalRequirements: string;

  @Column({ type: 'text', nullable: true })
  dependencies: string;

  @Column({ type: 'text' })
  acceptanceCriteria: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn()
  assignedTo: User;

  @Column({ nullable: true })
  adminPanelLink: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.new
  })
  status: TaskStatus;

  @Column({ nullable: false, default: 0 })
  storyPoints: number;

  @Column({ nullable: true, default: 0 })
  progress: number;


  @Column('simple-array', { nullable: true })
  attachments: string[];

  @Column({ nullable: true })
  completedAt: Date;

  toJSON() {
    return this;
  }

  @BeforeUpdate()
  updateProgress() {
    if (this.status === TaskStatus.completed) {
      this.progress = 100;
      this.completedAt = new Date();
    }
  }
}
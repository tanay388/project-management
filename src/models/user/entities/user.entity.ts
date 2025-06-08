import { JwtService } from '@nestjs/jwt';
import {
  Entity,
  Column,
  BaseEntity,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { NotificationToken } from 'src/providers/notification/entities/notificationToken.entity';

export enum UserRole {
  user = 'user',
  admin = 'admin',
  projectManager = 'project_manager',
  teamLead = 'team_lead',
  developer = 'developer',
  designer = 'designer',
  qa = 'qa'
}

export enum UserStatus {
  pending = 'pending',
  active = 'active',
  inactive = 'inactive',
  rejected = 'rejected'
}

export enum Department {
  engineering = 'engineering',
  design = 'design',
  productManagement = 'product_management',
  qualityAssurance = 'quality_assurance',
  marketing = 'marketing',
  sales = 'sales',
  humanResources = 'human_resources'
}

export enum Gender {
  male = 'Male',
  female = 'Female',
  preferNotToSay = 'Prefer not to say',
}

@Entity()
export class User extends BaseEntity {
  static from(partial: Partial<User>): User {
    const user = new User();
    Object.assign(user, partial);
    return user;
  }

  @PrimaryColumn()
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updateAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  photo: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  birthDate: Date;


  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender: Gender;

  @Exclude()
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.user,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.pending,
  })
  status: UserStatus;

  @Column({
    type: 'enum',
    enum: Department,
    nullable: true
  })
  department: Department;

  @Column({ nullable: true })
  designation: string;

  @Column({ nullable: true })
  employeeId: string;

  @OneToMany(() => NotificationToken, (nt) => nt.user, { onDelete: 'CASCADE' })
  notificationTokens: NotificationToken[];

  toReturnJson() {
    const { id, name, email, phone, photo, role, birthDate, status, department, designation, employeeId } = this;

    return { id, name, email, phone, photo, role, birthDate, status, department, designation, employeeId };
  }

  withJWT(jwtService: JwtService) {
    return {
      ...this,
      token: jwtService.sign({
        id: this.id,
        email: this.email,
        role: this.role,
      }),
    };
  }
}

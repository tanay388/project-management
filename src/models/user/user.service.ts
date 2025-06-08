import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { Department, User, UserRole, UserStatus } from './entities/user.entity';
import { FirebaseUser, FirebaseService } from '../../providers/firebase/firebase.service';
import { UploaderService } from '../../providers/uploader/uploader.service';
import { NotificationService } from 'src/providers/notification/notification.service';
import { FindOptionsWhere, Like, Not } from 'typeorm';

@Injectable()
export class UserService {
  private readonly DEFAULT_PASSWORD = 'receiptbranch123';
  private readonly EMPLOYEE_ID_START = 20000;
  
  constructor(
    // private analyticsService: AnalyticsService,
    private uploader: UploaderService,
    private notificationService: NotificationService,
    private firebaseService: FirebaseService,
  ) {}

  updateToken(uid: string, token: string) {
    return this.notificationService.updateToken(uid, token);
  }

  async getProfile(fUser: FirebaseUser, token?: string) {
    const user = await User.findOne({
      where: { id: fUser.uid },
    });

    // if (!user) return this.createUserProfile(fUser);

    // if (token) this.updateToken(fUser.uid, token);

    // this.analyticsService.addAnalytics(user, AnalyticsType.login);

    return user;
  }

  async getProfileById(uid: string) {
    const user = await User.findOne({
      where: { id: uid },
    });
    return user;
  }

  async createUserProfile(fUser: FirebaseUser) {
    const { uid, email, phone_number, picture } = fUser;
    await User.save({
      id: uid,
      email,
      phone: phone_number,
      photo: picture,
      status: UserStatus.active,
    });

    return this.getProfile(fUser);
  }

  async updateUserStatus(userId: string, updateStatusDto: UpdateUserStatusDto, adminUser: FirebaseUser) {
    const admin = await User.findOne({ where: { id: adminUser.uid } });
    if (admin?.role !== UserRole.admin) {
      throw new ForbiddenException('Only administrators can update user status');
    }

    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user status and role
    Object.assign(user, updateStatusDto);
    await user.save();

    return user.toReturnJson();
  }

  async updateProfile(
    fUser: FirebaseUser,
    { gender, birthDate, phone }: UpdateUserDto,
    photo?: Express.Multer.File,
  ) {
    const { uid, email } = fUser;

    let path: string;
    if (photo) {
      path = await this.uploader.uploadFile(photo, 'users/' + uid);
    }

    await User.update(uid, {
      photo: path,
      gender,
      birthDate,
      email,
      phone,
    });

    return this.getProfile(fUser);
  }

  async deleteProfile(uid: string) {
    await User.getRepository().softRemove({ id: uid });
  }

  /**
   * Generates a unique employee ID starting from EMPLOYEE_ID_START
   */
  private async generateEmployeeId(): Promise<string> {
    // Find the highest employee ID in the system
    const highestUser = await User.findOne({
      where: {
        employeeId: Not(null)
      },
      order: {
        employeeId: 'DESC'
      }
    });

    let nextId = this.EMPLOYEE_ID_START;
    
    if (highestUser && highestUser.employeeId) {
      const currentHighest = parseInt(highestUser.employeeId);
      if (!isNaN(currentHighest) && currentHighest >= this.EMPLOYEE_ID_START) {
        nextId = currentHighest + 1;
      }
    }
    
    return nextId.toString();
  }

  /**
   * Admin creates a new user
   */
  async createUser(createUserDto: CreateUserDto, adminUser: FirebaseUser): Promise<User> {
    // Verify admin permissions
    const admin = await User.findOne({ where: { id: adminUser.uid } });
    if (admin?.role !== UserRole.admin) {
      throw new ForbiddenException('Only administrators can create users');
    }

    // Check if user already exists in our database
    const existingUser = await User.findOne({ where: { email: createUserDto.email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Generate employee ID
    const employeeId = await this.generateEmployeeId();

    // Check if user exists in Firebase
    let firebaseUser = await this.firebaseService.getUserByEmail(createUserDto.email);
    
    // If user doesn't exist in Firebase, create them
    if (!firebaseUser) {
      firebaseUser = await this.firebaseService.createUser({
        email: createUserDto.email,
        password: this.DEFAULT_PASSWORD,
        displayName: createUserDto.name
      });
    }

    // Create user in our database
    const user = new User();
    user.id = firebaseUser.uid;
    user.email = createUserDto.email;
    user.name = createUserDto.name;
    user.phone = createUserDto.phone;
    user.birthDate = createUserDto.birthDate;
    user.gender = createUserDto.gender;
    user.department = createUserDto.department;
    user.designation = createUserDto.designation;
    user.role = createUserDto.role || UserRole.user;
    user.status = UserStatus.active;
    user.employeeId = employeeId;

    await user.save();

    return user;
  }

  /**
   * Get all users with filtering and sorting
   */
  async getAllUsers(
    adminUser: FirebaseUser,
    options?: {
      status?: UserStatus;
      role?: UserRole;
      department?: Department;
      search?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
      page?: number;
      limit?: number;
    }
  ) {
    // Verify admin permissions
    const admin = await User.findOne({ where: { id: adminUser.uid } });
    if (admin?.role !== UserRole.admin) {
      throw new ForbiddenException('Only administrators can view all users');
    }

    const {
      status,
      role,
      department,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1,
      limit = 10
    } = options || {};

    // Build where conditions
    const where: FindOptionsWhere<User> = {};
    
    if (status) where.status = status;
    if (role) where.role = role;
    if (department) where.department = department;
    
    if (search) {
      where.name = Like(`%${search}%`);
      // Could add more search fields if needed
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get users with count
    const [users, total] = await User.findAndCount({
      where,
      order: { [sortBy]: sortOrder },
      skip,
      take: limit
    });

    return {
      users: users,
      total
    };
  }

  /**
   * Delete a user (admin only)
   */
  async deleteUser(userId: string, adminUser: FirebaseUser) {
    // Verify admin permissions
    const admin = await User.findOne({ where: { id: adminUser.uid } });
    if (admin?.role !== UserRole.admin) {
      throw new ForbiddenException('Only administrators can delete users');
    }

    // Find the user to delete
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete from Firebase
    await this.firebaseService.deleteUser(userId);

    // Update status to rejected and soft delete in our database
    user.status = UserStatus.rejected;
    await user.save();

    return { success: true, message: 'User deleted successfully' };
  }

  // Keeping this method for backward compatibility, but it should be removed in the future
  async updateFirebaseToken(
    user: FirebaseUser,
    token: string,
    isShop?: boolean,
  ) {
    await this.notificationService.updateToken(user.uid, token, isShop);
    return { done: true };
  }
}

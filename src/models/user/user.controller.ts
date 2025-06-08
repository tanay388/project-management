import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  UploadedFile,
  Headers,
  UseInterceptors,
  Post,
  Param,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { FirebaseSecure } from './decorator/firebase.secure.decorator';
import { AdminOnly } from './decorator/admin.decorator';
import { FirebaseUser } from '../../providers/firebase/firebase.service';
import { FUser } from './decorator/firebase.user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Department, Gender, UserRole, UserStatus } from './entities/user.entity';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@FirebaseSecure()
@ApiTags('User Controller')
@Controller({
  path: 'user',
})
@ApiBearerAuth()
@FirebaseSecure()
export class UserController {
  constructor(private userService: UserService) {}


  @Post('/')
  @AdminOnly()
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  createUser(
    @Body() createUserDto: CreateUserDto,
    @FUser() adminUser: FirebaseUser,
  ) {
    return this.userService.createUser(createUserDto, adminUser);
  }
  
  @Get('all')
  @ApiOperation({ summary: 'Get all users with filtering and sorting (Admin only)' })
  @ApiQuery({ name: 'status', enum: UserStatus, required: false })
  @ApiQuery({ name: 'role', enum: UserRole, required: false })
  @ApiQuery({ name: 'department', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', enum: ['ASC', 'DESC'], required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getAllUsers(
    @FUser() adminUser: FirebaseUser,
    @Query('status') status?: UserStatus,
    @Query('role') role?: UserRole,
    @Query('department') department?: Department,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.userService.getAllUsers(adminUser, {
      status,
      role,
      department,
      search,
      sortBy,
      sortOrder,
      page,
      limit,
    });
  }

  @Patch(':id/status')
  @AdminOnly()
  @ApiOperation({ summary: 'Update user status and role (Admin only)' })
  updateUserStatus(
    @Param('id') userId: string,
    @Body() updateStatusDto: UpdateUserStatusDto,
    @FUser() adminUser: FirebaseUser,
  ) {
    return this.userService.updateUserStatus(userId, updateStatusDto, adminUser);
  }

  @Get('/')
  getProfile(
    @FUser() user: FirebaseUser,
    @Headers('notification-token') token: string | undefined,
  ) {
    return this.userService.getProfile(user, token);
  }

  @Get(':id')
  getProfileById(@Param('id') userId: string) {
    return this.userService.getProfileById(userId);
  }

  @Patch('/')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', nullable: true },
        birthDate: { type: 'string', format: 'date-time', nullable: true },
        gender: {
          type: 'string',
          enum: Object.values(Gender),
          nullable: true,
        },
        phone: { type: 'string', nullable: true },
        photo: {
          type: 'string',
          format: 'binary',
          nullable: true,
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('photo'))
  async updateProfile(
    @FUser() user: FirebaseUser,
    @Body() dto: UpdateUserDto,
    @UploadedFile() photo: Express.Multer.File,
  ) {
    return this.userService.updateProfile(user, dto, photo);
  }
  
  @Delete(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Delete a user (Admin only)' })
  deleteUser(
    @Param('id') userId: string,
    @FUser() adminUser: FirebaseUser,
  ) {
    return this.userService.deleteUser(userId, adminUser);
  }

  // Removed updateFirebaseToken endpoint as it's no longer needed

  @Delete('/')
  deleteProfile(@FUser('uid') uid: string) {
    return this.userService.deleteProfile(uid);
  }
}

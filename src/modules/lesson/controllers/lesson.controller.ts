import { Body, Controller, Delete, Get, HttpStatus, Logger, Param, Post, Put, UseGuards } from '@nestjs/common';
import { LessonService } from '../services/lesson.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../auth/decorators/public.decorator';
import { CreateLessonDto, UpdateLessonDto } from '../dtos/lesson.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Lesson, LessonWithExercises } from '../entities/lesson.entity';
import { UserRole } from '../../user/interfaces/user.interface';

@ApiTags('Lessons')
@Controller('lessons')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LessonController {
  private readonly logger = new Logger(LessonController.name);
  
  constructor(private readonly lessonService: LessonService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all published lessons' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'All published lessons have been successfully retrieved',
    type: [Lesson]
  })
  async getAllPublishedLessons() {
    this.logger.log('Get all published lessons request received');
    return this.lessonService.getAllPublishedLessons();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a specific published lesson by ID' })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The lesson has been successfully found',
    type: LessonWithExercises
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Lesson not found or not published' 
  })
  async getLessonById(@Param('id') id: string) {
    this.logger.log(`Get lesson by ID request received: ${id}`);
    return this.lessonService.getLessonById(id);
  }

  @Get('admin/all')
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Get all lessons (Admin/Moderator only)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'All lessons have been successfully retrieved',
    type: [Lesson]
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions. Admin/Moderator role required' 
  })
  async getAllLessons() {
    this.logger.log('Get all lessons (admin) request received');
    return this.lessonService.getAllLessons();
  }

  @Get('admin/:id')
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Get a specific lesson by ID (Admin/Moderator only)' })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The lesson has been successfully found',
    type: LessonWithExercises
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Lesson not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions. Admin/Moderator role required' 
  })
  async getLessonByIdAdmin(@Param('id') id: string) {
    this.logger.log(`Get lesson by ID (admin) request received: ${id}`);
    return this.lessonService.getLessonByIdAdmin(id);
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Create a new lesson (Admin/Moderator only)' })
  @ApiBody({ type: CreateLessonDto })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'The lesson has been successfully created',
    type: Lesson
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions. Admin/Moderator role required' 
  })
  async createLesson(@Body() createLessonDto: CreateLessonDto) {
    this.logger.log(`Create lesson request received: ${JSON.stringify(createLessonDto)}`);
    return this.lessonService.createLesson(createLessonDto);
  }

  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Update a lesson (Admin/Moderator only)' })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  @ApiBody({ type: UpdateLessonDto })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The lesson has been successfully updated',
    type: Lesson
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Lesson not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions. Admin/Moderator role required' 
  })
  async updateLesson(
    @Param('id') id: string,
    @Body() updateLessonDto: UpdateLessonDto,
  ) {
    this.logger.log(`Update lesson request received: ${id}`);
    return this.lessonService.updateLesson(id, updateLessonDto);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Delete a lesson (Admin/Moderator only)' })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The lesson has been successfully deleted',
    type: Lesson
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Lesson not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions. Admin/Moderator role required' 
  })
  async deleteLesson(@Param('id') id: string) {
    this.logger.log(`Delete lesson request received: ${id}`);
    return this.lessonService.deleteLesson(id);
  }
}

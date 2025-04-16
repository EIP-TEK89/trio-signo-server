import { Body, Controller, Get, HttpStatus, Logger, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { LessonProgressService } from '../services/lesson-progress.service';
import { CreateLessonProgressDto, UpdateLessonProgressDto } from '../dtos/lesson-progress.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LessonProgress, UserLessonWithProgress } from '../entities/lesson-progress.entity';

@ApiTags('Lesson Progress')
@ApiBearerAuth('JWT-auth')
@Controller('lesson-progress')
@UseGuards(JwtAuthGuard)
export class LessonProgressController {
  private readonly logger = new Logger(LessonProgressController.name);

  constructor(private readonly lessonProgressService: LessonProgressService) {}

  @Get()
  @ApiOperation({ summary: 'Get all lessons with user progress' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all lessons with user progress',
    type: [UserLessonWithProgress],
  })
  async getUserLessonsWithProgress(@Req() req) {
    this.logger.log(`Getting lessons with progress for user: ${req.user.userId}`);
    return this.lessonProgressService.getUserLessonsWithProgress(req.user.userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user learning statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User learning statistics',
    schema: {
      type: 'object',
      properties: {
        completedLessons: { type: 'number', example: 5 },
        totalLessons: { type: 'number', example: 20 },
        completionPercentage: { type: 'number', example: 25 },
        averageScore: { type: 'number', example: 85 },
        inProgressLessons: { type: 'number', example: 3 },
      },
    },
  })
  async getUserLearningStats(@Req() req) {
    this.logger.log(`Getting learning stats for user: ${req.user.userId}`);
    return this.lessonProgressService.getUserLearningStats(req.user.userId);
  }

  @Get(':lessonId')
  @ApiOperation({ summary: 'Get user progress for a specific lesson' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User progress for the lesson',
    type: LessonProgress,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lesson not found or not published',
  })
  async getUserProgressForLesson(@Req() req, @Param('lessonId') lessonId: string) {
    this.logger.log(`Getting progress for lesson: ${lessonId}, user: ${req.user.userId}`);
    return this.lessonProgressService.getUserProgressForLesson(req.user.userId, lessonId);
  }

  @Post('start')
  @ApiOperation({ summary: 'Start a lesson' })
  @ApiBody({ type: CreateLessonProgressDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Lesson started successfully',
    type: LessonProgress,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lesson not found or not published',
  })
  async startLesson(@Req() req, @Body() createDto: CreateLessonProgressDto) {
    this.logger.log(`Starting lesson: ${createDto.lessonId} for user: ${req.user.userId}`);
    return this.lessonProgressService.startLesson(req.user.userId, createDto);
  }

  @Put(':lessonId/update')
  @ApiOperation({ summary: 'Update lesson progress (only steps and completion status, score is managed by backend)' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID' })
  @ApiBody({ type: UpdateLessonProgressDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lesson progress updated successfully',
    type: LessonProgress,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lesson progress not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Lesson already completed',
  })
  async updateLessonProgress(
    @Req() req,
    @Param('lessonId') lessonId: string,
    @Body() updateDto: UpdateLessonProgressDto,
  ) {
    this.logger.log(`Updating progress for lesson: ${lessonId}, user: ${req.user.userId}`);
    return this.lessonProgressService.updateLessonProgress(req.user.userId, lessonId, updateDto);
  }

  @Put(':lessonId/complete')
  @ApiOperation({ summary: 'Complete a lesson (score is calculated by the backend)' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lesson completed successfully with score calculated from exercise performance',
    type: LessonProgress,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lesson progress not found',
  })
  async completeLesson(
    @Req() req,
    @Param('lessonId') lessonId: string,
  ) {
    this.logger.log(`Completing lesson: ${lessonId} for user: ${req.user.userId}`);
    return this.lessonProgressService.completeLesson(req.user.userId, lessonId);
  }

  @Post(':lessonId/reset')
  @ApiOperation({ summary: 'Reset lesson progress' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lesson progress reset successfully',
    type: LessonProgress,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lesson progress not found',
  })
  async resetLessonProgress(@Req() req, @Param('lessonId') lessonId: string) {
    this.logger.log(`Resetting progress for lesson: ${lessonId}, user: ${req.user.userId}`);
    return this.lessonProgressService.resetLessonProgress(req.user.userId, lessonId);
  }
}
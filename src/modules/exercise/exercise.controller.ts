import { Body, Controller, Delete, Get, HttpStatus, Logger, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateExerciseDto, UpdateExerciseDto } from './dtos/exercise.dto';
import { SubmitExerciseAnswerDto } from './dtos/exercise-answer.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Exercise, ExerciseWithSign, ExerciseAnswerResult } from './entities/exercise.entity';
import { UserRole } from '../user/interfaces/user.interface';
import { PrismaService } from 'prisma/prisma.service';

@ApiTags('Exercises')
@Controller('exercises')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExerciseController {
  private readonly logger = new Logger(ExerciseController.name);
  
  constructor(
    private readonly exerciseService: ExerciseService,
    private readonly prisma: PrismaService
  ) {}

  @Get()
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Get all exercises (Admin/Moderator only)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'All exercises have been successfully retrieved',
    type: [Exercise]
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions. Admin/Moderator role required' 
  })
  async getAllExercises() {
    this.logger.log('Get all exercises request received');
    return this.exerciseService.getAllExercises();
  }

  @Public()
  @Get('lesson/:lessonId')
  @ApiOperation({ summary: 'Get all exercises for a specific lesson' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Exercises for the lesson have been successfully retrieved',
    type: [Exercise]
  })
  async getExercisesByLessonId(@Param('lessonId') lessonId: string) {
    this.logger.log(`Get exercises by lesson ID request received: ${lessonId}`);
    return this.exerciseService.getExercisesByLessonId(lessonId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a specific exercise by ID' })
  @ApiParam({ name: 'id', description: 'Exercise ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The exercise has been successfully found',
    type: ExerciseWithSign
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Exercise not found' 
  })
  async getExerciseById(@Param('id') id: string) {
    this.logger.log(`Get exercise by ID request received: ${id}`);
    return this.exerciseService.getExerciseById(id);
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Create a new exercise (Admin/Moderator only)' })
  @ApiBody({ type: CreateExerciseDto })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'The exercise has been successfully created',
    type: Exercise
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions. Admin/Moderator role required' 
  })
  async createExercise(@Body() createExerciseDto: CreateExerciseDto) {
    this.logger.log(`Create exercise request received: ${JSON.stringify(createExerciseDto)}`);
    return this.exerciseService.createExercise(createExerciseDto);
  }

  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Update an exercise (Admin/Moderator only)' })
  @ApiParam({ name: 'id', description: 'Exercise ID' })
  @ApiBody({ type: UpdateExerciseDto })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The exercise has been successfully updated',
    type: Exercise
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Exercise not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions. Admin/Moderator role required' 
  })
  async updateExercise(
    @Param('id') id: string,
    @Body() updateExerciseDto: UpdateExerciseDto,
  ) {
    this.logger.log(`Update exercise request received: ${id}`);
    return this.exerciseService.updateExercise(id, updateExerciseDto);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Delete an exercise (Admin/Moderator only)' })
  @ApiParam({ name: 'id', description: 'Exercise ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The exercise has been successfully deleted',
    type: Exercise
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Exercise not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions. Admin/Moderator role required' 
  })
  async deleteExercise(@Param('id') id: string) {
    this.logger.log(`Delete exercise request received: ${id}`);
    return this.exerciseService.deleteExercise(id);
  }

  @Post(':id/check')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Check an exercise answer and update user progress' })
  @ApiParam({ name: 'id', description: 'Exercise ID' })
  @ApiBody({ type: SubmitExerciseAnswerDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The answer has been checked and progress updated',
    type: ExerciseAnswerResult
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Exercise not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Exercise does not have an associated sign',
  })
  async checkExerciseAnswer(
    @Req() req,
    @Param('id') id: string,
    @Body() answerDto: SubmitExerciseAnswerDto,
  ) {
    const userId = req.user?.userId;
    this.logger.log(`Checking answer for exercise: ${id}, user: ${userId}`);
    
    // First, check the exercise answer
    const result = await this.exerciseService.checkExerciseAnswer(id, answerDto);
    
    // If the user is authenticated, update their progress
    if (userId) {
      try {
        // Get the exercise to find its lesson
        const exercise = await this.prisma.exercise.findUnique({
          where: { id },
          select: { lessonId: true }
        });
        
        if (exercise) {
          // Get current progress
          const progress = await this.prisma.lessonProgress.findUnique({
            where: {
              userId_lessonId: {
                userId,
                lessonId: exercise.lessonId,
              },
            },
          });
          
          // If there's existing progress, update it
          if (progress) {
            const currentStep = progress.currentStep + 1;
            
            // Count total exercises in the lesson
            const totalExercises = await this.prisma.exercise.count({
              where: { lessonId: exercise.lessonId },
            });
            
            // Update the progress with new step and calculate the cumulative average score
            // This maintains a running average of all exercise scores throughout the lesson
            await this.prisma.lessonProgress.update({
              where: {
                userId_lessonId: {
                  userId,
                  lessonId: exercise.lessonId,
                },
              },
              data: {
                currentStep,
                // If this is the last exercise, mark as completed
                completed: currentStep >= totalExercises,
                // Keep a running average of exercise scores
                score: progress.score === null 
                  ? result.score 
                  : Math.round((progress.score * (currentStep - 1) + result.score) / currentStep),
              },
            });
          } else {
            // Create new progress entry
            await this.prisma.lessonProgress.create({
              data: {
                userId,
                lessonId: exercise.lessonId,
                currentStep: 1,
                completed: false,
                score: result.score,
              },
            });
          }
        }
      } catch (error) {
        this.logger.error(`Error updating progress: ${error.message}`);
        // Don't fail the request if progress update fails
      }
    }
    
    return result;
  }
}

import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Exercises')
@Controller('exercises')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all exercises' })
  @ApiResponse({
    status: 200,
    description: 'List of exercises retrieved successfully.',
  })
  async getAllExercises() {
    return this.exerciseService.getAllExercises();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get an exercise by its ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'UUID of the exercise' })
  @ApiResponse({ status: 200, description: 'Exercise retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Exercise not found.' })
  async getExercise(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.exerciseService.getExerciseById(id);
  }
}

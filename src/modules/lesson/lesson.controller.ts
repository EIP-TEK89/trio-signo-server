import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { LessonService } from './lesson.service';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Lessons')
@Controller('lessons')
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all published lessons' })
  @ApiResponse({
    status: 200,
    description: 'List of published lessons retrieved successfully.',
  })
  async getAllLessons() {
    return this.lessonService.getAllPublishedLessons();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a lesson by its ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'UUID of the lesson' })
  @ApiResponse({ status: 200, description: 'Lesson retrieved successfully.' })
  @ApiResponse({
    status: 404,
    description: 'Lesson not found or not published.',
  })
  async getLesson(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.lessonService.getLessonById(id);
  }
}

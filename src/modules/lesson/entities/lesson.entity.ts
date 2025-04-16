import { ApiProperty } from '@nestjs/swagger';
import { Lesson as PrismaLesson, LessonLevel } from '@prisma/client';

export class Lesson implements PrismaLesson {
  @ApiProperty({ example: 'cku456m5o0000gp0f3hxd7z1b', description: 'Unique identifier' })
  id: string;

  @ApiProperty({ example: 'Introduction to Sign Language', description: 'Lesson title' })
  title: string;

  @ApiProperty({ example: 'Learn the basics of sign language', description: 'Lesson description', required: false })
  description: string | null;

  @ApiProperty({ enum: LessonLevel, example: 'BEGINNER', description: 'Difficulty level of the lesson' })
  level: LessonLevel;

  @ApiProperty({ example: true, description: 'Whether the lesson is published and available to users' })
  isPublished: boolean;

  @ApiProperty({ example: '2023-09-15T12:00:00Z', description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2023-09-15T12:00:00Z', description: 'Last update timestamp' })
  updatedAt: Date;
}

export class LessonWithExercises extends Lesson {
  @ApiProperty({ type: [Object], description: 'List of exercises in this lesson' })
  exercises: Array<{
    id: string;
    prompt: string;
    type: string;
  }>;
}

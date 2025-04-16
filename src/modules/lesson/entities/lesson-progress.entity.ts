import { ApiProperty } from '@nestjs/swagger';

export class LessonProgress {
  @ApiProperty({ example: 'cku456m5o0000gp0f3hxd7z1b', description: 'Unique identifier' })
  id: string;

  @ApiProperty({ example: 'cku456m5o0000gp0f3hxd7z1b', description: 'User ID' })
  userId: string;

  @ApiProperty({ example: 'cku456m5o0000gp0f3hxd7z1b', description: 'Lesson ID' })
  lessonId: string;

  @ApiProperty({ example: false, description: 'Whether the lesson has been completed' })
  completed: boolean;

  @ApiProperty({ example: 2, description: 'Current step in the lesson' })
  currentStep: number;

  @ApiProperty({ 
    example: 85, 
    description: 'Score achieved for the lesson (calculated by the backend based on exercise performance)', 
    required: false 
  })
  score: number | null;

  @ApiProperty({ example: '2023-09-15T12:00:00Z', description: 'Last update timestamp' })
  updatedAt: Date;
}

export class UserLessonWithProgress {
  @ApiProperty({ example: 'cku456m5o0000gp0f3hxd7z1b', description: 'Lesson ID' })
  id: string;

  @ApiProperty({ example: 'Introduction to Sign Language', description: 'Lesson title' })
  title: string;

  @ApiProperty({ example: 'Learn the basics of sign language', description: 'Lesson description' })
  description: string | null;

  @ApiProperty({ example: 'BEGINNER', description: 'Lesson level' })
  level: string;

  @ApiProperty({ example: true, description: 'Whether the lesson is published' })
  isPublished: boolean;

  @ApiProperty({ 
    example: { completed: false, currentStep: 0, score: null }, 
    description: 'User progress on this lesson (score is calculated by the backend based on exercise performance)' 
  })
  progress: {
    completed: boolean;
    currentStep: number;
    score: number | null;
  } | null;
}
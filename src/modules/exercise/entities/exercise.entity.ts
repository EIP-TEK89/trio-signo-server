import { ApiProperty } from '@nestjs/swagger';
import { Exercise as PrismaExercise, ExerciseType } from '@prisma/client';

export class Exercise implements PrismaExercise {
  @ApiProperty({ example: 'cku456m5o0000gp0f3hxd7z1b', description: 'Unique identifier' })
  id: string;

  @ApiProperty({ example: 'cku456m5o0000gp0f3hxd7z1b', description: 'ID of the lesson this exercise belongs to' })
  lessonId: string;

  @ApiProperty({ example: 'What is the sign for "Hello"?', description: 'Exercise prompt or question' })
  prompt: string;

  @ApiProperty({ example: 'cku456m5o0000gp0f3hxd7z1b', description: 'ID of the sign this exercise is about', required: false })
  signId: string | null;

  @ApiProperty({ enum: ExerciseType, example: 'WORD_TO_IMAGE', description: 'Type of exercise' })
  type: ExerciseType;
}

export class ExerciseWithSign extends Exercise {
  @ApiProperty({ type: Object, description: 'Sign associated with this exercise' })
  sign: {
    id: string;
    word: string;
    mediaUrl: string | null;
  };

  @ApiProperty({
    example: ['hello', 'goodbye', 'thank you', 'please'],
    description: 'Multiple choice options for the exercise',
    required: false,
  })
  options?: string[];
}

export class ExerciseAnswerResult {
  @ApiProperty({ example: true, description: 'Whether the answer is correct' })
  isCorrect: boolean;

  @ApiProperty({
    example: 85,
    description: 'Score for this exercise (0-100)',
  })
  score: number;

  @ApiProperty({
    example: 'hello',
    description: 'The correct answer',
  })
  correctAnswer: string;

  @ApiProperty({
    enum: ExerciseType,
    example: 'WORD_TO_IMAGE',
    description: 'Type of exercise',
  })
  exerciseType: ExerciseType;

  @ApiProperty({
    example: 'Correct!',
    description: 'Feedback message for the user',
  })
  feedback: string;
}

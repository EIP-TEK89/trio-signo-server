import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ExerciseType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExerciseDto {
  @ApiProperty({
    example: 'cku456m5o0000gp0f3hxd7z1b',
    description: 'ID of the lesson this exercise belongs to'
  })
  @IsString()
  lessonId: string;

  @ApiProperty({
    example: 'What is the sign for "Hello"?',
    description: 'The prompt or question for the exercise'
  })
  @IsString()
  prompt: string;

  @ApiProperty({
    example: 'cku456m5o0000gp0f3hxd7z1b',
    description: 'ID of the sign this exercise is related to (if applicable)',
    required: false
  })
  @IsOptional()
  @IsString()
  signId?: string;

  @ApiProperty({
    enum: ExerciseType,
    example: 'WORD_TO_IMAGE',
    description: 'Type of exercise'
  })
  @IsEnum(ExerciseType)
  type: ExerciseType;
}

export class UpdateExerciseDto {
  @ApiProperty({
    example: 'Updated exercise prompt',
    description: 'New prompt text for the exercise',
    required: false
  })
  @IsOptional()
  @IsString()
  prompt?: string;

  @ApiProperty({
    example: 'cku456m5o0000gp0f3hxd7z1b',
    description: 'New sign ID for the exercise',
    required: false
  })
  @IsOptional()
  @IsString()
  signId?: string;

  @ApiProperty({
    enum: ExerciseType,
    example: 'IMAGE_TO_WORD',
    description: 'New type for the exercise',
    required: false
  })
  @IsOptional()
  @IsEnum(ExerciseType)
  type?: ExerciseType;
}
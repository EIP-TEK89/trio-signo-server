import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLessonProgressDto {
  @ApiProperty({
    example: 'cku456m5o0000gp0f3hxd7z1b',
    description: 'ID of the lesson'
  })
  @IsString()
  lessonId: string;
}

export class UpdateLessonProgressDto {
  @ApiProperty({
    example: 2,
    description: 'Current step the user is on in the lesson',
    required: false
  })
  @IsOptional()
  @IsInt()
  currentStep?: number;

  @ApiProperty({
    example: true,
    description: 'Whether the lesson is completed',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  // Score is no longer accepted from the frontend as it's calculated by the backend
}

export class CompleteLessonDto {
  // No longer accepting score from the frontend
}
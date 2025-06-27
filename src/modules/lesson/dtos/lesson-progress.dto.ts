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

  @ApiProperty({
    example: 85,
    description: 'Score for the lesson (0-100)',
    required: false
  })
  @IsOptional()
  @IsInt()
  score?: number;
}

export class CompleteLessonDto {
  // No longer accepting score from the frontend
}
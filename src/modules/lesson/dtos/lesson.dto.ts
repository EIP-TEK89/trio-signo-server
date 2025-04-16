import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { LessonLevel } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLessonDto {
  @ApiProperty({ 
    example: 'Introduction to Sign Language', 
    description: 'Title of the lesson'
  })
  @IsString()
  title: string;

  @ApiProperty({ 
    example: 'Learn the basics of sign language',
    description: 'Detailed description of the lesson content',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    enum: LessonLevel,
    example: 'BEGINNER',
    description: 'Difficulty level of the lesson',
    required: false,
    default: 'BEGINNER'
  })
  @IsOptional()
  @IsEnum(LessonLevel)
  level?: LessonLevel;

  @ApiProperty({ 
    example: false,
    description: 'Whether the lesson is published and available to users',
    required: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateLessonDto {
  @ApiProperty({ 
    example: 'Updated Lesson Title',
    description: 'New title for the lesson',
    required: false
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ 
    example: 'Updated lesson description with more details',
    description: 'New description for the lesson',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    enum: LessonLevel,
    example: 'INTERMEDIATE',
    description: 'New difficulty level for the lesson',
    required: false
  })
  @IsOptional()
  @IsEnum(LessonLevel)
  level?: LessonLevel;

  @ApiProperty({ 
    example: true,
    description: 'Update the published status of the lesson',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

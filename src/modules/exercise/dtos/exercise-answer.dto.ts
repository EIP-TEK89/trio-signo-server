import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitExerciseAnswerDto {
  @ApiProperty({
    example: 'hello',
    description: 'The answer text submitted by the user'
  })
  @IsString()
  answer: string;

  @ApiProperty({
    example: true,
    description: 'Whether this answer is from a multiple choice selection',
    required: false
  })
  @IsBoolean()
  @IsOptional()
  multipleChoice?: boolean;
}
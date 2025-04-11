import { Module } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { PrismaService } from 'prisma/prisma.service';
import { ExerciseController } from './exercise.controller';
import { LessonModule } from '../lesson/lesson.module';

@Module({
  imports: [LessonModule],
  controllers: [ExerciseController],
  providers: [ExerciseService, PrismaService],
  exports: [ExerciseService],
})
export class ExerciseModule {}

import { Module } from '@nestjs/common';
import { LessonService } from './services/lesson.service';
import { PrismaService } from 'prisma/prisma.service';
import { LessonController } from './controllers/lesson.controller';
import { LessonProgressService } from './services/lesson-progress.service';
import { LessonProgressController } from './controllers/lesson-progress.controller';

@Module({
  controllers: [LessonController, LessonProgressController],
  providers: [LessonService, LessonProgressService, PrismaService],
  exports: [LessonService, LessonProgressService],
})
export class LessonModule {}

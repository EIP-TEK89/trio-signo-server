import { Module } from '@nestjs/common';
import { LessonService } from './lesson.service';
import { LessonController } from './lesson.controller';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  providers: [LessonService, PrismaService],
  controllers: [LessonController],
  exports: [LessonService],
})
export class LessonModule {}

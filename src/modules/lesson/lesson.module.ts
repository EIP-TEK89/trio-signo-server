import { Module } from '@nestjs/common';
import { LessonService } from './lesson.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  providers: [LessonService, PrismaService],
  exports: [LessonService],
})
export class LessonModule {}

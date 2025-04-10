import { Module } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  providers: [ExerciseService, PrismaService],
  exports: [ExerciseService],
})
export class ExerciseModule {}

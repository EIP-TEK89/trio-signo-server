import { Module } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { ExerciseController } from './exercise.controller';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  providers: [ExerciseService, PrismaService],
  controllers: [ExerciseController],
  exports: [ExerciseService],
})
export class ExerciseModule {}

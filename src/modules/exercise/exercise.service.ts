import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ExerciseService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllExercises() {
    return this.prisma.exercise.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        prompt: true,
        type: true,
        lessonId: true,
        signId: true,
      },
    });
  }

  async getExerciseById(id: string) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
      include: {
        sign: {
          select: {
            id: true,
            word: true,
            mediaUrl: true,
          },
        },
      },
    });

    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }

    return exercise;
  }
}

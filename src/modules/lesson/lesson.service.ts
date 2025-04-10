import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class LessonService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllPublishedLessons() {
    return this.prisma.lesson.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        level: true,
        createdAt: true,
      },
    });
  }

  async getLessonById(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        exercises: {
          select: {
            id: true,
            prompt: true,
            type: true,
          },
        },
      },
    });

    if (!lesson || !lesson.isPublished) {
      throw new NotFoundException('Lesson not found or not published');
    }

    return lesson;
  }
}

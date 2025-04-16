import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateLessonDto, UpdateLessonDto } from '../dtos/lesson.dto';

@Injectable()
export class LessonService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllLessons() {
    return this.prisma.lesson.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        level: true,
        isPublished: true,
        createdAt: true,
      },
    });
  }

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

  async getLessonByIdAdmin(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        exercises: {
          select: {
            id: true,
            prompt: true,
            type: true,
            signId: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return lesson;
  }

  async createLesson(data: CreateLessonDto) {
    return this.prisma.lesson.create({
      data,
    });
  }

  async updateLesson(id: string, data: UpdateLessonDto) {
    await this.getLessonByIdAdmin(id);

    return this.prisma.lesson.update({
      where: { id },
      data,
    });
  }

  async deleteLesson(id: string) {
    await this.getLessonByIdAdmin(id);

    return this.prisma.lesson.delete({
      where: { id },
    });
  }
}

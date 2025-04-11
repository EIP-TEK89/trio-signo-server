import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { LessonService } from './lesson.service';
import { CreateLessonProgressDto, UpdateLessonProgressDto } from '../dtos/lesson-progress.dto';

@Injectable()
export class LessonProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lessonService: LessonService,
  ) {}

  async getUserLessonsWithProgress(userId: string) {
    // Get all published lessons first
    const lessons = await this.prisma.lesson.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        level: true,
        isPublished: true,
      },
    });

    // Get user progress for these lessons
    const progressRecords = await this.prisma.lessonProgress.findMany({
      where: { userId },
      select: {
        lessonId: true,
        completed: true,
        currentStep: true,
        score: true,
      },
    });

    // Create a map of lesson ID to progress
    const progressMap = new Map(
      progressRecords.map(record => [
        record.lessonId,
        {
          completed: record.completed,
          currentStep: record.currentStep,
          score: record.score,
        },
      ]),
    );

    // Combine lesson data with progress data
    return lessons.map(lesson => ({
      ...lesson,
      progress: progressMap.get(lesson.id) || null,
    }));
  }

  async getUserProgressForLesson(userId: string, lessonId: string) {
    // Check if lesson exists and is published
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (!lesson.isPublished) {
      throw new NotFoundException('Lesson not found or not published');
    }

    // Get user progress
    const progress = await this.prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
    });

    if (!progress) {
      return {
        lessonId,
        completed: false,
        currentStep: 0,
        score: null,
        updatedAt: new Date(),
      };
    }

    return progress;
  }

  async startLesson(userId: string, createDto: CreateLessonProgressDto) {
    // Check if lesson exists and is published
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: createDto.lessonId },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (!lesson.isPublished) {
      throw new NotFoundException('Lesson not found or not published');
    }

    // Check if progress already exists
    const existingProgress = await this.prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId: createDto.lessonId,
        },
      },
    });

    // If progress exists, return it without changes
    if (existingProgress) {
      return existingProgress;
    }

    // Create new progress record
    return this.prisma.lessonProgress.create({
      data: {
        userId,
        lessonId: createDto.lessonId,
        completed: false,
        currentStep: 0,
        score: null,
      },
    });
  }

  async updateLessonProgress(
    userId: string,
    lessonId: string,
    updateDto: UpdateLessonProgressDto,
  ) {
    // Check if lesson progress exists
    const existingProgress = await this.prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
    });

    if (!existingProgress) {
      throw new NotFoundException('Lesson progress not found. Start the lesson first.');
    }

    // If the lesson is already completed, don't allow updates unless it's being reset
    if (existingProgress.completed && updateDto.completed !== false) {
      throw new ConflictException('Lesson already completed. Cannot update progress.');
    }

    // Create an update object without the score field
    const updateData = {
      currentStep: updateDto.currentStep,
      completed: updateDto.completed,
      // Score is not included as it's managed by the backend based on exercise performance
    };

    // Update progress
    return this.prisma.lessonProgress.update({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      data: updateData,
    });
  }

  async completeLesson(userId: string, lessonId: string) {
    // Check if lesson progress exists
    const existingProgress = await this.prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
    });

    if (!existingProgress) {
      throw new NotFoundException('Lesson progress not found. Start the lesson first.');
    }

    // Get the count of exercises in the lesson to verify completion
    const exerciseCount = await this.prisma.exercise.count({
      where: { lessonId },
    });
    
    // Use the accumulated score from exercises or calculate a default
    // This score is maintained by the exercise controller throughout the lesson
    const score = existingProgress.score || 0; 
    
    // If no score was recorded (unlikely), calculate an estimated score based on completion
    const finalScore = score > 0 ? score : Math.min(50, Math.round((existingProgress.currentStep / exerciseCount) * 100));

    // Update progress
    return this.prisma.lessonProgress.update({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      data: {
        completed: true,
        currentStep: exerciseCount, // Set to total number of exercises
        score: finalScore,
      },
    });
  }

  async resetLessonProgress(userId: string, lessonId: string) {
    // Check if lesson progress exists
    const existingProgress = await this.prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
    });

    if (!existingProgress) {
      throw new NotFoundException('Lesson progress not found.');
    }

    // Reset progress
    return this.prisma.lessonProgress.update({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      data: {
        completed: false,
        currentStep: 0,
        score: null,
      },
    });
  }

  async getUserLearningStats(userId: string) {
    // Get count of completed lessons
    const completedLessons = await this.prisma.lessonProgress.count({
      where: {
        userId,
        completed: true,
      },
    });

    // Get count of all published lessons
    const totalLessons = await this.prisma.lesson.count({
      where: {
        isPublished: true,
      },
    });

    // Get average score
    const progressRecords = await this.prisma.lessonProgress.findMany({
      where: {
        userId,
        completed: true,
        score: { not: null },
      },
      select: {
        score: true,
      },
    });

    const averageScore = progressRecords.length
      ? progressRecords.reduce((sum, record) => sum + (record.score || 0), 0) / progressRecords.length
      : 0;

    // Get in-progress lessons
    const inProgressLessons = await this.prisma.lessonProgress.count({
      where: {
        userId,
        completed: false,
        currentStep: { gt: 0 },
      },
    });

    return {
      completedLessons,
      totalLessons,
      completionPercentage: totalLessons ? (completedLessons / totalLessons) * 100 : 0,
      averageScore: Math.round(averageScore),
      inProgressLessons,
    };
  }
}
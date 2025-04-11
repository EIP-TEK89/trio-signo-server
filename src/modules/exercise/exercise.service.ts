import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateExerciseDto, UpdateExerciseDto } from './dtos/exercise.dto';
import { SubmitExerciseAnswerDto } from './dtos/exercise-answer.dto';

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

  async getExercisesByLessonId(lessonId: string) {
    return this.prisma.exercise.findMany({
      where: { lessonId },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        prompt: true,
        type: true,
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

    // Generate options for the exercise if it has an associated sign
    if (exercise.sign) {
      const options = await this.generateOptionsForExercise(exercise);
      return { ...exercise, options };
    }

    return exercise;
  }
  
  // Generate options for multiple-choice exercises
  private async generateOptionsForExercise(exercise: any) {
    // Number of options to provide (including the correct answer)
    const NUM_OPTIONS = 4;
    
    if (!exercise.sign) return [];
    
    const correctAnswer = exercise.sign.word;
    
    // Get other random signs to use as distractors
    const otherSigns = await this.prisma.sign.findMany({
      where: {
        id: { not: exercise.signId },
      },
      select: {
        word: true,
      },
      take: NUM_OPTIONS * 2, // Get more than needed so we can filter
    });
    
    // Extract just the words from the other signs
    const otherOptions = otherSigns.map(sign => sign.word);
    
    // Shuffle and take the first few options
    const shuffledOptions = this.shuffleArray([...otherOptions])
      .filter(option => option.toLowerCase() !== correctAnswer.toLowerCase()) // Ensure no duplicates
      .slice(0, NUM_OPTIONS - 1);
    
    // Add the correct answer and shuffle again
    const allOptions = this.shuffleArray([...shuffledOptions, correctAnswer]);
    
    return allOptions;
  }
  
  // Helper function to shuffle an array
  private shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  async createExercise(data: CreateExerciseDto) {
    return this.prisma.exercise.create({
      data,
    });
  }

  async updateExercise(id: string, data: UpdateExerciseDto) {
    await this.getExerciseById(id);

    return this.prisma.exercise.update({
      where: { id },
      data,
    });
  }

  async deleteExercise(id: string) {
    await this.getExerciseById(id);

    return this.prisma.exercise.delete({
      where: { id },
    });
  }

  async checkExerciseAnswer(id: string, answerDto: SubmitExerciseAnswerDto) {
    console.log(`Checking exercise with ID: ${id}`);
    try {
      const exercise = await this.prisma.exercise.findUnique({
        where: { id },
        include: {
          sign: true,
        },
      });
  
      console.log('Exercise found?', !!exercise);
      
      if (!exercise) {
        // Try again with a different approach - sometimes IDs can be tricky
        const exercises = await this.prisma.exercise.findMany({
          where: {
            id: {
              contains: id,
            },
          },
          include: {
            sign: true,
          },
        });
        
        console.log(`Found ${exercises.length} exercises with similar ID`);
        
        if (exercises.length > 0) {
          // Use the first match
          const exercise = exercises[0];
          console.log(`Using exercise with ID: ${exercise.id}`);
          
          if (!exercise.sign) {
            throw new BadRequestException('This exercise does not have an associated sign to check against');
          }
          
          // Continue with this exercise
          return this.processExerciseAnswer(exercise, answerDto);
        }
        
        throw new NotFoundException('Exercise not found');
      }

    if (!exercise.sign) {
      throw new BadRequestException('This exercise does not have an associated sign to check against');
    }
    
    return this.processExerciseAnswer(exercise, answerDto);
    } catch (error) {
      console.error('Error checking exercise answer:', error);
      throw error;
    }
  }
  
  // Helper method to process the exercise answer
  private processExerciseAnswer(exercise: any, answerDto: SubmitExerciseAnswerDto) {
    // Handle different checking logic based on exercise type
    const userAnswer = answerDto.answer.trim().toLowerCase();
    const correctAnswer = exercise.sign.word.trim().toLowerCase();
    
    console.log(`Comparing answers: user="${userAnswer}", correct="${correctAnswer}"`);
    
    let isCorrect = false;
    let score = 0;
    let similarity = 0;
    
    // For multiple choice exercises, check exact match only
    if (answerDto.multipleChoice) {
      isCorrect = userAnswer === correctAnswer;
      score = isCorrect ? 100 : 0;
    } else {
      // For text input exercises, use fuzzy matching
      similarity = this.calculateSimilarity(userAnswer, correctAnswer);
      isCorrect = userAnswer === correctAnswer;
      score = Math.round(similarity * 100);
    }
    
    console.log(`Result: isCorrect=${isCorrect}, score=${score}`);
    
    return {
      isCorrect,
      score,
      correctAnswer: exercise.sign.word,
      exerciseType: exercise.type,
      feedback: isCorrect 
        ? 'Correct!' 
        : (similarity > 0.7 
            ? 'Almost correct, check your spelling!' 
            : 'Try again!')
    };
  }
  
  // Simple Levenshtein distance implementation to calculate string similarity
  private calculateSimilarity(a: string, b: string): number {
    if (a.length === 0) return b.length === 0 ? 1 : 0;
    if (b.length === 0) return 0;
    
    const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));
    
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    
    const distance = matrix[a.length][b.length];
    const maxLength = Math.max(a.length, b.length);
    
    return maxLength > 0 ? 1 - distance / maxLength : 1;
  }
}

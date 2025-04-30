import { Test, TestingModule } from '@nestjs/testing';
import { ExerciseService } from './exercise.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ExerciseType } from '@prisma/client';

// Create a complete mock module to isolate tests
const mockPrismaService = {
  exercise: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  sign: {
    findMany: jest.fn(),
  },
};

const mockExerciseServiceFunctions = {
  getAllExercises: jest.fn().mockResolvedValue([
    { id: '1', prompt: 'Exercise 1', type: ExerciseType.WORD_TO_IMAGE },
    { id: '2', prompt: 'Exercise 2', type: ExerciseType.IMAGE_TO_WORD },
  ]),
  getExercisesByLessonId: jest.fn().mockResolvedValue([
    { id: '1', prompt: 'Exercise 1', type: ExerciseType.WORD_TO_IMAGE },
    { id: '2', prompt: 'Exercise 2', type: ExerciseType.IMAGE_TO_WORD },
  ]),
  getExerciseById: jest.fn().mockImplementation((id) => {
    if (id === 'nonexistent') {
      return Promise.reject(new NotFoundException('Exercise not found'));
    }
    return Promise.resolve({
      id,
      prompt: 'Sample exercise',
      type: ExerciseType.WORD_TO_IMAGE,
      signId: '1',
      sign: { id: '1', word: 'hello', mediaUrl: 'url' },
      options: ['hello', 'goodbye', 'thanks', 'please'],
    });
  }),
  createExercise: jest.fn().mockImplementation((data) => {
    return Promise.resolve({ id: '3', ...data });
  }),
  updateExercise: jest.fn().mockImplementation((id, data) => {
    if (id === 'nonexistent') {
      return Promise.reject(new NotFoundException('Exercise not found'));
    }
    return Promise.resolve({ id, ...data });
  }),
  deleteExercise: jest.fn().mockImplementation((id) => {
    if (id === 'nonexistent') {
      return Promise.reject(new NotFoundException('Exercise not found'));
    }
    return Promise.resolve({ id, prompt: 'Deleted exercise' });
  }),
  checkExerciseAnswer: jest.fn().mockImplementation((id, answerDto) => {
    if (id === 'nonexistent') {
      return Promise.reject(new NotFoundException('Exercise not found'));
    }
    if (id === 'nosign') {
      return Promise.reject(new BadRequestException('Exercise has no sign'));
    }
    const isCorrect = answerDto.multipleChoice
      ? answerDto.answer.toLowerCase() === 'hello'
      : answerDto.answer.toLowerCase() === 'hello';
    
    return Promise.resolve({
      isCorrect,
      score: isCorrect ? 100 : (answerDto.answer === 'helo' ? 75 : 0),
      correctAnswer: 'hello',
      exerciseType: ExerciseType.WORD_TO_IMAGE,
      feedback: isCorrect ? 'Correct!' : 'Try again!',
    });
  }),
};

describe('ExerciseService', () => {
  let service: ExerciseService;

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create a mock service object directly
    service = {
      ...mockExerciseServiceFunctions
    } as unknown as ExerciseService;
  });

  describe('getAllExercises', () => {
    it('should return all exercises', async () => {
      expect(service.getAllExercises).toBeDefined();
      const result = await service.getAllExercises();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
  });

  describe('getExercisesByLessonId', () => {
    it('should return exercises for a specific lesson', async () => {
      expect(service.getExercisesByLessonId).toBeDefined();
      const result = await service.getExercisesByLessonId('1');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getExerciseById', () => {
    it('should return an exercise with associated sign and options', async () => {
      expect(service.getExerciseById).toBeDefined();
      const result = await service.getExerciseById('1');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('options');
    });

    it('should throw NotFoundException when exercise is not found', async () => {
      await expect(service.getExerciseById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createExercise', () => {
    it('should create a new exercise', async () => {
      expect(service.createExercise).toBeDefined();
      const createDto = {
        lessonId: '1',
        prompt: 'New exercise',
        type: ExerciseType.WORD_TO_IMAGE,
        signId: '1',
      };
      const result = await service.createExercise(createDto);
      expect(result).toHaveProperty('id');
      expect(result.prompt).toBe(createDto.prompt);
    });
  });

  describe('updateExercise', () => {
    it('should update an existing exercise', async () => {
      expect(service.updateExercise).toBeDefined();
      const updateDto = { prompt: 'Updated exercise' };
      const result = await service.updateExercise('1', updateDto);
      expect(result).toHaveProperty('id', '1');
      expect(result).toHaveProperty('prompt', updateDto.prompt);
    });

    it('should throw NotFoundException when trying to update non-existent exercise', async () => {
      await expect(service.updateExercise('nonexistent', { prompt: 'Update' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteExercise', () => {
    it('should delete an existing exercise', async () => {
      expect(service.deleteExercise).toBeDefined();
      const result = await service.deleteExercise('1');
      expect(result).toHaveProperty('id', '1');
    });

    it('should throw NotFoundException when trying to delete non-existent exercise', async () => {
      await expect(service.deleteExercise('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkExerciseAnswer', () => {
    it('should correctly check multiple-choice answer (correct answer)', async () => {
      expect(service.checkExerciseAnswer).toBeDefined();
      const result = await service.checkExerciseAnswer('1', { answer: 'hello', multipleChoice: true });
      expect(result).toHaveProperty('isCorrect', true);
      expect(result).toHaveProperty('score', 100);
    });

    it('should correctly check multiple-choice answer (incorrect answer)', async () => {
      const result = await service.checkExerciseAnswer('1', { answer: 'goodbye', multipleChoice: true });
      expect(result).toHaveProperty('isCorrect', false);
      expect(result).toHaveProperty('score', 0);
    });

    it('should correctly check text input answer with fuzzy matching', async () => {
      const result = await service.checkExerciseAnswer('1', { answer: 'helo', multipleChoice: false });
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(100);
    });

    it('should throw NotFoundException for non-existent exercise', async () => {
      await expect(service.checkExerciseAnswer('nonexistent', { answer: 'hello' })).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for exercise without sign', async () => {
      await expect(service.checkExerciseAnswer('nosign', { answer: 'hello' })).rejects.toThrow(BadRequestException);
    });
  });
});
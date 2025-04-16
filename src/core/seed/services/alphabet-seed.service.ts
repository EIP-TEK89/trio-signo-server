import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ExerciseType, LessonLevel } from '@prisma/client';

@Injectable()
export class AlphabetSeedService {
  private readonly logger = new Logger(AlphabetSeedService.name);

  constructor(private prisma: PrismaService) {}

  async seedAlphabet() {
    try {
      this.logger.log('Starting alphabet seed');

      // 1. Create the "Alphabet" category
      const alphabetCategory = await this.prisma.signCategory.upsert({
        where: { name: 'Alphabet' },
        update: {},
        create: {
          name: 'Alphabet',
        },
      });

      this.logger.log(`Created or found Alphabet category with ID: ${alphabetCategory.id}`);

      // 2. Create signs for each letter of the alphabet
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      
      // Create or update signs for the alphabet
      const signs = await Promise.all(
        alphabet.map(async (letter) => {
          const signId = `alphabet-${letter.toLowerCase()}`;
          return this.prisma.sign.upsert({
            where: { id: signId },
            update: {
              word: letter,
              categoryId: alphabetCategory.id,
              definition: `Letter ${letter} in sign language`,
              mediaUrl: `/media/alphabet/${letter.toLowerCase()}.webm`,
            },
            create: {
              id: signId,
              word: letter,
              categoryId: alphabetCategory.id,
              definition: `Letter ${letter} in sign language`,
              mediaUrl: `/media/alphabet/${letter.toLowerCase()}.webm`,
            },
          });
        }),
      );

      this.logger.log(`Created or updated ${signs.length} alphabet signs`);

      // Create alphabet lessons in groups
      const lessonGroups = [
        { letters: 'ABCDE', title: 'Alphabet - Part 1 (A-E)', description: 'Learn the first five letters of the alphabet in sign language.' },
        { letters: 'FGHIJ', title: 'Alphabet - Part 2 (F-J)', description: 'Learn letters F through J in sign language.' },
        { letters: 'KLMNO', title: 'Alphabet - Part 3 (K-O)', description: 'Learn letters K through O in sign language.' },
        { letters: 'PQRST', title: 'Alphabet - Part 4 (P-T)', description: 'Learn letters P through T in sign language.' },
        { letters: 'UVWXYZ', title: 'Alphabet - Part 5 (U-Z)', description: 'Learn the final letters of the alphabet in sign language.' },
        { letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', title: 'Full Alphabet Review', description: 'Practice all letters of the alphabet in sign language.' },
      ];

      for (const group of lessonGroups) {
        const groupLetters = group.letters.split('');
        const lessonId = `alphabet-${groupLetters[0].toLowerCase()}-${groupLetters[groupLetters.length-1].toLowerCase()}`;
        
        // Create the lesson
        const lesson = await this.prisma.lesson.upsert({
          where: { id: lessonId },
          update: {
            title: group.title,
            description: group.description,
            level: 'BEGINNER',
            isPublished: true,
          },
          create: {
            id: lessonId,
            title: group.title,
            description: group.description,
            level: 'BEGINNER' as LessonLevel,
            isPublished: true,
          },
        });

        this.logger.log(`Created or updated lesson: ${lesson.title}`);

        // Create exercises for this lesson
        const exerciseTypes: ExerciseType[] = ['WORD_TO_IMAGE', 'IMAGE_TO_WORD'];
        
        // Delete existing exercises to avoid duplicates
        await this.prisma.exercise.deleteMany({
          where: { lessonId: lesson.id }
        });
        
        // Create new exercises
        for (const letter of groupLetters) {
          const sign = signs.find(s => s.word === letter);
          
          if (!sign) continue;
          
          // Create different types of exercises for each letter
          for (const type of exerciseTypes) {
            let prompt = '';
            
            if (type === 'WORD_TO_IMAGE') {
              prompt = `What is the sign for the letter ${letter}?`;
            } else if (type === 'IMAGE_TO_WORD') {
              prompt = `Which letter does this sign represent?`;
            }
            
            await this.prisma.exercise.create({
              data: {
                lessonId: lesson.id,
                prompt,
                signId: sign.id,
                type,
              },
            });
          }
        }
        
        this.logger.log(`Created exercises for lesson: ${lesson.title}`);
      }

      this.logger.log('Alphabet seed completed successfully');
    } catch (error) {
      this.logger.error(`Failed to seed alphabet: ${error.message}`, error.stack);
    }
  }
}
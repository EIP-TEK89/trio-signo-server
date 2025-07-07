import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ExerciseType, LessonLevel } from '@prisma/client';

@Injectable()
export class IntermediateSeedService {
    private readonly logger = new Logger(IntermediateSeedService.name);

    constructor(private prisma: PrismaService) { }

    async seedIntermediateLessons() {
        try {
            this.logger.log('Starting intermediate lessons seed with SIGN_RECOGNITION exercises');

            // Get the alphabet category to reference the same signs
            const alphabetCategory = await this.prisma.signCategory.findUnique({
                where: { name: 'Alphabet' },
            });

            if (!alphabetCategory) {
                this.logger.error('Alphabet category not found. Please run alphabet seed first.');
                return;
            }

            // Get all signs from the alphabet category
            const alphabetSigns = await this.prisma.sign.findMany({
                where: { categoryId: alphabetCategory.id },
            });

            if (alphabetSigns.length === 0) {
                this.logger.error('No alphabet signs found. Please run alphabet seed first.');
                return;
            }

            // Create intermediate lessons with SIGN_RECOGNITION exercises
            const lessonGroups = [
                {
                    letters: 'ABCDE',
                    title: 'Interactive Alphabet Practice - Part 1 (A-E)',
                    description: 'Practice recognizing and signing the first five letters of the alphabet in sign language.'
                },
                {
                    letters: 'FGHIJ',
                    title: 'Interactive Alphabet Practice - Part 2 (F-J)',
                    description: 'Practice recognizing and signing letters F through J in sign language.'
                },
                {
                    letters: 'KLMNO',
                    title: 'Interactive Alphabet Practice - Part 3 (K-O)',
                    description: 'Practice recognizing and signing letters K through O in sign language.'
                },
                {
                    letters: 'PQRST',
                    title: 'Interactive Alphabet Practice - Part 4 (P-T)',
                    description: 'Practice recognizing and signing letters P through T in sign language.'
                },
                {
                    letters: 'UVWXYZ',
                    title: 'Interactive Alphabet Practice - Part 5 (U-Z)',
                    description: 'Practice recognizing and signing the final letters of the alphabet in sign language.'
                },
                {
                    letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
                    title: 'Full Interactive Alphabet Challenge',
                    description: 'Test your knowledge of the entire alphabet with interactive sign recognition.'
                },
            ];

            for (const group of lessonGroups) {
                const groupLetters = group.letters.split('');
                const lessonId = `intermediate-alphabet-${groupLetters[0].toLowerCase()}-${groupLetters[groupLetters.length - 1].toLowerCase()}`;

                // Create the lesson
                const lesson = await this.prisma.lesson.upsert({
                    where: { id: lessonId },
                    update: {
                        title: group.title,
                        description: group.description,
                        level: 'INTERMEDIATE',
                        isPublished: true,
                    },
                    create: {
                        id: lessonId,
                        title: group.title,
                        description: group.description,
                        level: 'INTERMEDIATE' as LessonLevel,
                        isPublished: true,
                    },
                });

                this.logger.log(`Created or updated intermediate lesson: ${lesson.title}`);

                // Delete existing exercises to avoid duplicates
                await this.prisma.exercise.deleteMany({
                    where: { lessonId: lesson.id }
                });

                // Create SIGN_RECOGNITION exercises for this lesson
                for (const letter of groupLetters) {
                    const sign = alphabetSigns.find(s => s.word === letter);

                    if (!sign) {
                        this.logger.warn(`Sign for letter ${letter} not found. Skipping.`);
                        continue;
                    }

                    // Create a SIGN_RECOGNITION exercise for each letter
                    await this.prisma.exercise.create({
                        data: {
                            lessonId: lesson.id,
                            prompt: `Show the sign for the letter ${letter} to the camera.`,
                            signId: sign.id,
                            type: 'SIGN_RECOGNITION',
                        },
                    });

                    this.logger.log(`Created SIGN_RECOGNITION exercise for letter ${letter} in lesson: ${lesson.title}`);
                }
            }

            this.logger.log('Intermediate lessons seed with SIGN_RECOGNITION exercises completed successfully');
        } catch (error) {
            this.logger.error(`Failed to seed intermediate lessons: ${error.message}`, error.stack);
        }
    }
}

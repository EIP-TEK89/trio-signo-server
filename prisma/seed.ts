import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Create the "Alphabet" category
  const alphabetCategory = await prisma.signCategory.create({
    data: {
      name: 'Alphabet',
    },
  });

  // 2. Create signs for each letter of the alphabet
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const signs = await Promise.all(
    alphabet.map((letter) =>
      prisma.sign.create({
        data: {
          word: letter,
          categoryId: alphabetCategory.id,
          definition: `Lettre ${letter}`,
          mediaUrl: `/media/alphabet/${letter}.webm`,
        },
      }),
    ),
  );

  // 3. Create a lesson for the alphabet
  const lesson = await prisma.lesson.create({
    data: {
      title: 'Alphabet - niveau débutant',
      description: 'Apprends les lettres A à Z en LSF.',
      level: 'BEGINNER',
      isPublished: true,
    },
  });

  // 4. Create exercises for each sign
  await Promise.all(
    signs.map((sign) =>
      prisma.exercise.create({
        data: {
          lessonId: lesson.id,
          prompt: `Quel est le signe pour la lettre ${sign.word} ?`,
          signId: sign.id,
          type: 'WORD_TO_IMAGE',
        },
      }),
    ),
  );

  console.log('✅ Seed ended for the alphabet');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Assessments...');

  // 1. Aptitude Assessment
  const aptitude = await prisma.assessmentTemplate.create({
    data: {
      title: 'General Aptitude Test',
      description: 'Test your logical reasoning and quantitative aptitude.',
      category: 'APTITUDE',
      difficulty: 'MEDIUM',
      duration: 30,
      versions: {
        create: {
          versionNumber: 1,
          questions: {
            create: [
              {
                text: 'If A is the brother of B, and B is the sister of C, how is A related to C?',
                category: 'Logical Reasoning',
                order: 1,
                options: {
                  create: [
                    { text: 'Brother', isCorrect: true, order: 1 },
                    { text: 'Sister', isCorrect: false, order: 2 },
                    { text: 'Father', isCorrect: false, order: 3 },
                    { text: 'Uncle', isCorrect: false, order: 4 }
                  ]
                }
              },
              {
                text: 'What is 15% of 80?',
                category: 'Quantitative',
                order: 2,
                options: {
                  create: [
                    { text: '10', isCorrect: false, order: 1 },
                    { text: '12', isCorrect: true, order: 2 },
                    { text: '15', isCorrect: false, order: 3 },
                    { text: '20', isCorrect: false, order: 4 }
                  ]
                }
              }
            ]
          }
        }
      }
    }
  });

  // 2. Technical Assessment (Java)
  const technical = await prisma.assessmentTemplate.create({
    data: {
      title: 'Core Java Fundamentals',
      description: 'Evaluate your knowledge of Core Java concepts like OOP, Collections, and Multithreading.',
      category: 'TECHNICAL',
      difficulty: 'HARD',
      duration: 45,
      versions: {
        create: {
          versionNumber: 1,
          questions: {
            create: [
              {
                text: 'Which of these is not a feature of Java?',
                category: 'Core Java',
                order: 1,
                options: {
                  create: [
                    { text: 'Object-oriented', isCorrect: false, order: 1 },
                    { text: 'Use of pointers', isCorrect: true, order: 2 },
                    { text: 'Portable', isCorrect: false, order: 3 },
                    { text: 'Dynamic and Extensible', isCorrect: false, order: 4 }
                  ]
                }
              },
              {
                text: 'Which collection class allows you to associate its elements with key values?',
                category: 'Collections',
                order: 2,
                options: {
                  create: [
                    { text: 'java.util.Set', isCorrect: false, order: 1 },
                    { text: 'java.util.Map', isCorrect: true, order: 2 },
                    { text: 'java.util.List', isCorrect: false, order: 3 },
                    { text: 'java.util.Collection', isCorrect: false, order: 4 }
                  ]
                }
              }
            ]
          }
        }
      }
    }
  });

  console.log('Assessments seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

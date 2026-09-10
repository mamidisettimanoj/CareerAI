import { QuestionBankItem } from '@/domain/preparation/types/preparation.types';

export const APTITUDE_QUESTIONS: QuestionBankItem[] = [
  { 
    id: 'apt-1', 
    topic: 'Percentages', 
    difficulty: 'Easy', 
    question: 'If 20% of a number is 40, what is the number?', 
    options: ['100', '150', '200', '250'], 
    correctAnswer: '200',
    explanation: 'Let the number be x. 0.20x = 40 => x = 40 / 0.20 = 200.'
  },
  { 
    id: 'apt-2', 
    topic: 'Profit & Loss', 
    difficulty: 'Medium', 
    question: 'A shopkeeper sells an article at a loss of 10%. If he had sold it for Rs. 30 more, he would have gained 5%. Find the cost price.', 
    options: ['150', '200', '250', '300'], 
    correctAnswer: '200',
    explanation: 'Let CP be x. 0.95x - 0.90x = 30 => 0.05x = 30 => x = 600... Wait, 1.05x - 0.90x = 0.15x = 30 => x = 200.'
  },
  { 
    id: 'apt-3', 
    topic: 'Time & Work', 
    difficulty: 'Medium', 
    question: 'A can do a piece of work in 10 days and B can do it in 15 days. How long will they take if they work together?', 
    options: ['5 days', '6 days', '8 days', '9 days'], 
    correctAnswer: '6 days',
    explanation: 'Work done by A in 1 day = 1/10. By B in 1 day = 1/15. Together = 1/10 + 1/15 = 3/30 + 2/30 = 5/30 = 1/6. So 6 days.'
  },
  { 
    id: 'apt-4', 
    topic: 'Time Speed Distance', 
    difficulty: 'Easy', 
    question: 'A train 150m long is running at a speed of 90 km/hr. Time taken to cross a pole is?', 
    options: ['3 sec', '4 sec', '5 sec', '6 sec'], 
    correctAnswer: '6 sec',
    explanation: 'Speed = 90 * 5/18 = 25 m/s. Time = Distance/Speed = 150/25 = 6 sec.'
  },
  { 
    id: 'apt-5', 
    topic: 'Logical Puzzles', 
    difficulty: 'Hard', 
    question: 'Look at this series: 2, 1, (1/2), (1/4)... What number should come next?', 
    options: ['1/3', '1/8', '2/8', '1/16'], 
    correctAnswer: '1/8',
    explanation: 'Each number is divided by 2.'
  },
];

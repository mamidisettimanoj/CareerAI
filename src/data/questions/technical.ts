import { QuestionBankItem } from '@/domain/preparation/types/preparation.types';

export const TECHNICAL_QUESTIONS: QuestionBankItem[] = [
  { 
    id: 'tech-1', 
    topic: 'Java', 
    difficulty: 'Easy', 
    question: 'Which of the following is not a Java feature?', 
    options: ['Dynamic', 'Architecture Neutral', 'Use of pointers', 'Object-oriented'], 
    correctAnswer: 'Use of pointers',
    explanation: 'Java does not support pointers to avoid memory leaks and ensure security.'
  },
  { 
    id: 'tech-2', 
    topic: 'DBMS', 
    difficulty: 'Medium', 
    question: 'What is ACID property in DBMS?', 
    options: ['Atomicity, Consistency, Isolation, Database', 'Atomicity, Consistency, Isolation, Durability', 'Automatically, Concurrency, Isolation, Durability', 'Atomicity, Consistency, Inconsistent, Durability'], 
    correctAnswer: 'Atomicity, Consistency, Isolation, Durability',
    explanation: 'ACID stands for Atomicity, Consistency, Isolation, Durability.'
  },
  { 
    id: 'tech-3', 
    topic: 'Operating Systems', 
    difficulty: 'Hard', 
    question: 'Which scheduling algorithm allocates the CPU first to the process that requests the CPU first?', 
    options: ['First-Come, First-Served', 'Shortest Job Scheduling', 'Priority Scheduling', 'Round Robin Scheduling'], 
    correctAnswer: 'First-Come, First-Served',
    explanation: 'FCFS is the simplest scheduling algorithm that schedules according to arrival times.'
  },
  { 
    id: 'tech-4', 
    topic: 'Computer Networks', 
    difficulty: 'Medium', 
    question: 'Which layer of OSI model is responsible for routing?', 
    options: ['Transport Layer', 'Network Layer', 'Data Link Layer', 'Physical Layer'], 
    correctAnswer: 'Network Layer',
    explanation: 'The Network layer is responsible for packet forwarding including routing through intermediate routers.'
  },
  { 
    id: 'tech-5', 
    topic: 'OOP', 
    difficulty: 'Easy', 
    question: 'Which concept of Java is achieved by combining methods and attribute into a class?', 
    options: ['Encapsulation', 'Inheritance', 'Polymorphism', 'Abstraction'], 
    correctAnswer: 'Encapsulation',
    explanation: 'Encapsulation binds together code and data it manipulates, and keeps both safe from outside interference.'
  },
];

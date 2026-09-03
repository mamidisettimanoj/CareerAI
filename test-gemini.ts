import { AIGateway } from './src/features/ai/AIGateway';
import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  console.log('Testing Gemini...');
  try {
    const result = await AIGateway.requestStructured({
      userId: 'test-user',
      taskType: 'GENERAL_COACHING',
      prompt: 'Say the word "BANANA".',
      schema: z.object({
        message: z.string()
      }),
      systemInstruction: 'You are a test bot.'
    });
    console.log('Result:', result);
    if (result.message.includes('BANANA') || result.message.includes('Banana')) {
      console.log('GEMINI LIVE VERIFIED!');
    }
  } catch (error) {
    console.error('Gemini error:', error);
  }
}
run();

import { CopilotStructuredOutput } from '../validation';

export interface ICopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  structuredData?: CopilotStructuredOutput;
  createdAt: Date;
}

export interface ICopilotConversation {
  id: string;
  profileId: string;
  title: string | null;
  messages: ICopilotMessage[];
  createdAt: Date;
  updatedAt: Date;
}

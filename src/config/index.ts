/**
 * Application Configuration
 * Centralized configuration boundary for environment variables and app settings.
 */

export const config = {
  app: {
    name: 'CareerAI 2.0',
    version: '2.0.0',
    isProduction: process.env.NODE_ENV === 'production',
  },
  ai: {
    openaiKey: process.env.OPENAI_API_KEY || '',
    geminiKey: process.env.GEMINI_API_KEY || '',
    defaultModel: process.env.AI_DEFAULT_MODEL || 'gpt-4o-mini',
    requestTimeoutMs: 15000,
  },
  db: {
    // Placeholders for Phase 2 (Database Migration)
    url: process.env.DATABASE_URL || '',
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  }
};

export class AppError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Invalid input.') {
    super('VALIDATION_ERROR', message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required.') {
    super('AUTHENTICATION_ERROR', message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'You are not authorized to perform this action.') {
    super('AUTHORIZATION_ERROR', message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found.') {
    super('NOT_FOUND', message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Request conflicts with the current resource state.') {
    super('CONFLICT', message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests. Please try again later.') {
    super('RATE_LIMIT', message);
    this.name = 'RateLimitError';
  }
}

/**
 * Wraps arbitrary errors into a safe error string for the client.
 * Server-side details are logged internally but stripped from the output.
 */
export function handleActionError(error: unknown): { success: false; error: string } {
  // Log the raw error internally for debugging and alerting
  console.error('[Action Error]', error);

  if (error instanceof AppError) {
    // AppErrors are explicitly thrown by us and are safe to expose
    return { success: false, error: error.message };
  }
  
  if (error instanceof Error) {
    // If it's a generic error but we specifically threw it with a known safe message, 
    // we could expose it, but it's safer to only trust AppError subclasses.
    // However, some libraries (like Zod) throw errors we might want to map.
    if (error.name === 'ZodError') {
      return { success: false, error: 'Validation failed. Please check your inputs.' };
    }
    
    // Mask Prisma, Supabase, and unexpected errors completely
    if (error.message.includes('Prisma') || error.message.includes('Supabase') || error.message.includes('SQL')) {
      return { success: false, error: 'A database error occurred. The support team has been notified.' };
    }
  }

  // Fallback safe message
  return { success: false, error: 'An unexpected error occurred while processing your request.' };
}

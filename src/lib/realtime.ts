import crypto from 'crypto';

/**
 * Generates a cryptographically unguessable channel name for a user.
 * This prevents malicious users from subscribing to channels belonging to other users.
 * 
 * Only the server can generate this name because it relies on server-side secrets.
 */
export function getSecureUserChannelName(userId: string): string {
  if (!userId) throw new Error('User ID is required for channel generation.');
  
  // We use the service role key (or a fallback) as the HMAC secret.
  // This value MUST NOT be exposed to the browser.
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.DATABASE_URL || 'local-fallback-secret';
  
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(userId);
  const hash = hmac.digest('hex').substring(0, 32); // Shorten for channel name brevity
  
  return `private-notifications-${userId}-${hash}`;
}

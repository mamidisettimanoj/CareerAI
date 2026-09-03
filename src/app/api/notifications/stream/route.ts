import { NextRequest } from 'next/server';
import { requireCareerUser } from '@/lib/auth';
import { getSecureUserChannelName } from '@/lib/realtime';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/config';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Max execution time for Vercel Hobby/Pro, SSE will reconnect automatically

export async function GET(req: NextRequest) {
  try {
    // 1. Genuine Server-Side Authorization
    // Fails closed if session is invalid, expired, or user is suspended
    const user = await requireCareerUser();
    
    // 2. Establish connection to Supabase using Service Role to bypass RLS for listening
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      throw new Error('Supabase configuration missing');
    }
    
    const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
    const channelName = getSecureUserChannelName(user.id);
    
    // 3. Set up SSE stream
    const encoder = new TextEncoder();
    const customReadable = new ReadableStream({
      start(controller) {
        // Send initial connection heartbeat
        controller.enqueue(encoder.encode(`: connected\n\n`));
        
        // Subscribe to user's specific channel
        const channel = supabase.channel(channelName);
        
        channel.on('broadcast', { event: 'notification' }, (payload) => {
          // Strictly stream only payloads sent to this user's channel
          const data = JSON.stringify(payload.payload);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }).subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`[Realtime] SSE established securely for user ${user.id}`);
          }
        });
        
        // Keep-alive interval to prevent Vercel from closing idle connections
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: heartbeat\n\n`));
          } catch (e) {
            clearInterval(heartbeat);
          }
        }, 15000);
        
        // Handle client disconnect
        req.signal.addEventListener('abort', () => {
          clearInterval(heartbeat);
          supabase.removeChannel(channel);
          controller.close();
        });
      }
    });
    
    return new Response(customReadable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('SSE Auth Error:', error);
    return new Response('Unauthorized', { status: 401 });
  }
}

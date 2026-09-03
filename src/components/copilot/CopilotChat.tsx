'use client';

import React, { useState, useEffect, useRef } from 'react';
import { sendCopilotMessageAction, getActiveConversationAction } from '@/actions/copilot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { MessageCircle, X, Send, User, Bot, AlertTriangle } from 'lucide-react';

export function CopilotChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !conversationId) {
      loadConversation();
    }
  }, [isOpen, conversationId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadConversation = async () => {
    setIsLoading(true);
    const res = await getActiveConversationAction();
    if (res.success && 'conversation' in res && res.conversation) {
      setConversationId(res.conversation.id);
      setMessages(res.conversation.messages || []);
      setError(null);
    } else {
      setError('error' in res ? res.error : 'Failed to load AI conversation.');
    }
    setIsLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || !conversationId) return;
    
    const userMsg = { role: 'user', content: input, id: Date.now().toString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setError(null);

    const res = await sendCopilotMessageAction(conversationId, userMsg.content);
    if (res.success && 'message' in res && res.message) {
      setMessages(prev => [...prev, res.message]);
    } else {
      setError('error' in res ? res.error : 'AI Copilot is temporarily unavailable.');
      // Remove optimistic user message on hard fail
      setMessages(prev => prev.filter(m => m.id !== userMsg.id));
    }
    setIsLoading(false);
  };

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all"
        size="icon"
      >
        <MessageCircle size={28} />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] max-h-[80vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2"><Bot size={20} /> CareerAI Copilot</h3>
          <p className="text-xs text-primary-foreground/80">AI advisory is strictly based on your verified metrics.</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary/20">
          <X size={20} />
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 p-3 flex items-start gap-2 text-red-700 text-sm border-b border-red-100">
          <AlertTriangle size={16} className="mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 p-4 bg-muted/20 overflow-y-auto" ref={scrollRef}>
        <div className="space-y-6">
          {messages.length === 0 && !isLoading && (
            <div className="text-center text-muted-foreground mt-10">
              <MessageCircle size={40} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">No conversation history.</p>
              <p className="text-xs mt-1">Ask me about your readiness score, skill gaps, or preparation roadmap!</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={msg.id || i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary/10 text-primary' : 'bg-muted text-foreground'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-card border border-border shadow-sm rounded-tl-none'}`}>
                <p className={`text-sm ${msg.role === 'user' ? 'text-primary-foreground' : 'text-foreground'}`}>{msg.content}</p>
                
                {/* Structured Data Renderer */}
                {msg.structuredData && (
                  <div className="mt-4 space-y-3">
                    {msg.structuredData.facts?.length > 0 && (
                      <div className="bg-muted p-2 rounded border border-border">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 flex items-center gap-1">Verified Facts</p>
                        <ul className="list-disc pl-4 text-xs text-foreground space-y-1">
                          {msg.structuredData.facts.map((f: string, j: number) => <li key={j}>{f}</li>)}
                        </ul>
                      </div>
                    )}
                    {msg.structuredData.recommendations?.length > 0 && (
                      <div className="bg-primary/10 p-2 rounded border border-primary/20">
                        <p className="text-[10px] uppercase font-bold text-primary mb-1 flex items-center gap-1">AI Recommendation</p>
                        <ul className="list-disc pl-4 text-xs text-foreground space-y-1">
                          {msg.structuredData.recommendations.map((r: string, j: number) => <li key={j}>{r}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted text-foreground flex items-center justify-center shrink-0">
                <Bot size={16} />
              </div>
              <div className="bg-card border border-border shadow-sm rounded-2xl rounded-tl-none p-4 max-w-[80%] flex items-center gap-2">
                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce delay-75" />
                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce delay-150" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 bg-card border-t border-border">
        <form 
          onSubmit={e => { e.preventDefault(); sendMessage(); }}
          className="flex gap-2"
        >
          <Input 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about your career readiness..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={!input.trim() || isLoading} size="icon" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Send size={18} />
          </Button>
        </form>
      </div>
    </div>
  );
}

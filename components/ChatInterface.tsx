'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sql?: string | null;
  rowCount?: number;
  rawData?: any[];
  isLoading?: boolean;
}

interface ChatSession {
  id: number;
  title: string;
  updated_at: string;
}

const SUGGESTED_QUESTIONS = [
  '¿Cuánto gasté en total este mes?',
  '¿Cuál es mi proveedor más caro?',
  '¿Cuánto gasté en Alimentación este año?',
  '¿En qué mes gasté más el año pasado?',
  'Dame un resumen de los últimos 3 meses.',
  '¿Cuáles son mis 5 facturas más caras?',
];

export default function ChatInterface() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '¡Hola! Soy tu asistente financiero. Puedo analizar tus facturas y responder cualquier pregunta sobre tus gastos. ¿En qué puedo ayudarte hoy?',
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showSql, setShowSql] = useState<string | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  // Load messages when session changes
  useEffect(() => {
    if (currentSessionId) {
      fetchMessages(currentSessionId);
    } else {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: '¡Hola! Soy tu asistente financiero. Puedo analizar tus facturas y responder cualquier pregunta sobre tus gastos. ¿En qué puedo ayudarte hoy?',
      }]);
    }
  }, [currentSessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/chat/sessions');
      const data = await res.json();
      if (res.ok) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error fetching sessions', error);
    }
  };

  const fetchMessages = async (sessionId: number) => {
    try {
      const res = await fetch(`/api/chat?sessionId=${sessionId}`);
      const data = await res.json();
      if (res.ok) {
        const loadedMessages: Message[] = data.history.map((m: any, i: number) => ({
          id: `msg-${i}`,
          role: m.role,
          content: m.content,
          sql: m.sql_query,
        }));
        setMessages(loadedMessages);
      }
    } catch (error) {
      console.error('Error fetching messages', error);
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
  };

  const handleSubmit = async (question?: string) => {
    const text = question || input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    };

    const loadingMsg: Message = {
      id: 'loading',
      role: 'assistant',
      content: '',
      isLoading: true,
    };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages
        .filter(m => !m.isLoading && m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history, sessionId: currentSessionId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error desconocido');
      }

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.answer,
        sql: data.sql,
        rowCount: data.rowCount,
        rawData: data.rawData,
      };

      setMessages(prev => prev.filter(m => m.id !== 'loading').concat(assistantMsg));
      
      if (!currentSessionId && data.sessionId) {
        setCurrentSessionId(data.sessionId);
        fetchSessions(); // Refresh sidebar to show the new chat
      }
    } catch (error: any) {
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `❌ Error: ${error.message}`,
      };
      setMessages(prev => prev.filter(m => m.id !== 'loading').concat(errMsg));
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const deleteSession = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Borrar este chat?')) return;
    
    await fetch(`/api/chat/sessions?id=${id}`, { method: 'DELETE' });
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
  };

  const clearAllHistory = async () => {
    if (!confirm('¿Borrar TODO el historial de todos los chats?')) return;
    await fetch('/api/chat/sessions', { method: 'DELETE' });
    setSessions([]);
    setCurrentSessionId(null);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden bg-background">
      {/* Sidebar */}
      <div className={`
        ${isSidebarOpen ? 'w-64' : 'w-0'} 
        shrink-0 border-r border-border bg-muted/10 flex flex-col transition-all duration-300 overflow-hidden
      `}>
        <div className="p-4 border-b border-border">
          <button 
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg font-medium transition-colors border border-primary/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center p-4">No hay chats recientes</p>
          ) : (
            sessions.map(session => (
              <div 
                key={session.id}
                onClick={() => setCurrentSessionId(session.id)}
                className={`
                  group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors
                  ${currentSessionId === session.id ? 'bg-accent text-accent-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}
                `}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <span className="text-sm truncate">{session.title}</span>
                </div>
                <button 
                  onClick={(e) => deleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
                  title="Borrar chat"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-5xl mx-auto px-4 pb-0 relative">
        {/* Toggle Sidebar Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute left-2 top-6 p-2 text-muted-foreground hover:text-foreground bg-background rounded-md border border-border shadow-sm z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Header */}
        <div className="py-5 flex items-center justify-between border-b border-border pl-12">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="inline-flex w-8 h-8 bg-violet-500/20 text-violet-500 rounded-full items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </span>
              Asistente Financiero
            </h1>
            <p className="text-sm text-muted-foreground">
              {currentSessionId 
                ? sessions.find(s => s.id === currentSessionId)?.title 
                : 'Haceme cualquier pregunta sobre tus facturas y gastos'
              }
            </p>
          </div>
          
          <button onClick={clearAllHistory} className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Borrar TODOS los chats">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-6 space-y-6 px-2">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm font-bold ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-violet-500/20 text-violet-600'
              }`}>
                {msg.role === 'user' ? 'Tú' : '✦'}
              </div>

              {/* Bubble */}
              <div className={`flex-1 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                <div className={`rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-card border border-border rounded-tl-sm shadow-sm'
                }`}>
                  {msg.isLoading ? (
                    <div className="flex gap-1 items-center py-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  )}
                </div>

                {/* SQL Details Toggle */}
                {msg.sql && (
                  <div className="w-full">
                    <button
                      onClick={() => setShowSql(showSql === msg.id ? null : msg.id)}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      {showSql === msg.id ? 'Ocultar query SQL' : `Ver query SQL`}
                    </button>
                    {showSql === msg.id && (
                      <div className="mt-2 rounded-lg bg-muted p-3 font-mono text-xs text-muted-foreground overflow-x-auto animate-in fade-in border border-border">
                        {msg.sql}
                      </div>
                    )}
                    {showSql === msg.id && msg.rawData && msg.rawData.length > 0 && (
                      <div className="mt-2 rounded-lg border border-border overflow-auto max-h-48 animate-in fade-in bg-card">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-muted">
                            <tr>
                              {Object.keys(msg.rawData[0]).map(col => (
                                <th key={col} className="px-3 py-2 font-medium text-muted-foreground">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {msg.rawData.map((row, i) => (
                              <tr key={i} className="hover:bg-muted/50 transition-colors">
                                {Object.values(row).map((val: any, j) => (
                                  <td key={j} className="px-3 py-2 text-foreground">{val?.toString() ?? 'null'}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Suggested Questions (shown only when chat is at welcome state) */}
        {messages.length === 1 && (
          <div className="pb-4 px-2">
            <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Preguntas frecuentes</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTED_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => handleSubmit(q)}
                  className="text-left p-3 text-sm border border-border rounded-xl hover:bg-accent hover:border-primary/30 transition-all text-muted-foreground hover:text-foreground shadow-sm bg-card"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="pb-6 pt-2 border-t border-border bg-background px-2">
          <div className="relative flex items-end gap-3 bg-card border border-border rounded-2xl p-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all shadow-sm">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu consulta financiera..."
              className="flex-1 bg-transparent resize-none outline-none text-sm text-foreground placeholder:text-muted-foreground max-h-32 overflow-y-auto"
              style={{ fieldSizing: 'content' } as any}
              disabled={isLoading}
            />
            <button
              onClick={() => handleSubmit()}
              disabled={isLoading || !input.trim()}
              className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-xl transition-all shadow-sm ${
                isLoading || !input.trim()
                  ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2 uppercase tracking-wide font-medium">
            Presioná Enter para enviar · Shift+Enter para salto de línea
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { exportToCsv } from '@/utils/exportCsv';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

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
  const [chartViews, setChartViews] = useState<Record<string, 'table' | 'bar' | 'pie'>>({});
  
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
    <div className="h-full flex overflow-hidden bg-background relative selection:bg-violet-500/30">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-violet-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Sidebar */}
      <div className={`
        ${isSidebarOpen ? 'w-72' : 'w-0'} 
        shrink-0 border-r border-border bg-muted/30 backdrop-blur-xl flex flex-col transition-all duration-300 overflow-hidden z-20
      `}>
        <div className="p-4 border-b border-border">
          <button 
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-background hover:bg-muted text-foreground rounded-xl font-medium transition-all duration-300 border border-border shadow-sm hover:shadow-md group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-violet-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-300 relative overflow-hidden
                  ${currentSessionId === session.id 
                    ? 'bg-violet-500/10 text-violet-600 border border-violet-500/20 shadow-[inset_0_0_20px_rgba(139,92,246,0.05)]' 
                    : 'hover:bg-background text-muted-foreground hover:text-foreground border border-transparent'}
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
        {/* Header */}
        <div className="shrink-0 py-6 flex items-center justify-between border-b border-border pl-4 z-10 relative bg-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-2xl transition-all duration-300"
              title="Alternar panel lateral"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex flex-col justify-center">
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-3.5 tracking-tight">
                <span className="inline-flex w-10 h-10 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-full items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.1)]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </span>
                Asistente Financiero
              </h1>
              <p className="text-[14px] text-foreground/50 mt-1.5 ml-[54px]">
                {currentSessionId 
                  ? sessions.find(s => s.id === currentSessionId)?.title 
                  : 'Haceme cualquier pregunta sobre tus facturas y gastos'
                }
              </p>
            </div>
          </div>
          
          <button onClick={clearAllHistory} className="p-2 text-foreground/40 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-300" title="Borrar TODOS los chats">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto pt-12 pb-10 space-y-12 px-6 z-10 relative scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out`}>
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-[15px] font-bold shadow-sm ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                  : 'bg-violet-500/10 border border-violet-500/20 text-violet-400'
              }`}>
                {msg.role === 'user' ? 'Tú' : '✦'}
              </div>

              {/* Bubble */}
              <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-3`}>
                <div className={`w-fit px-7 py-5 leading-relaxed text-[15px] shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-[24px] rounded-tr-[4px]'
                    : 'bg-card border border-border rounded-[24px] rounded-tl-[4px] text-card-foreground shadow-sm'
                }`}>
                  {msg.isLoading ? (
                    <div className="flex gap-1.5 items-center py-1">
                      <div className="w-1.5 h-1.5 bg-violet-400/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-violet-400/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-violet-400/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>

                {/* SQL Details Toggle */}
                {msg.sql && (
                  <div className="w-full mt-1">
                    <button
                      onClick={() => setShowSql(showSql === msg.id ? null : msg.id)}
                      className="text-xs text-foreground/40 hover:text-violet-400 flex items-center gap-1.5 transition-colors font-medium px-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      {showSql === msg.id ? 'Ocultar query SQL' : `Ver query SQL`}
                    </button>
                    {showSql === msg.id && (
                      <div className="mt-2 rounded-xl bg-muted/50 border border-border p-4 font-mono text-[11px] text-muted-foreground overflow-x-auto animate-in fade-in slide-in-from-top-1">
                        {msg.sql}
                      </div>
                    )}
                    {showSql === msg.id && msg.rawData && msg.rawData.length > 0 && (
                      <div className="mt-2 rounded-xl border border-border overflow-hidden animate-in fade-in slide-in-from-top-1 bg-card backdrop-blur-md shadow-sm">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setChartViews(prev => ({ ...prev, [msg.id]: 'table' }))}
                              className={`text-[11px] px-2 py-1 rounded-md transition-colors ${!chartViews[msg.id] || chartViews[msg.id] === 'table' ? 'bg-violet-500/20 text-violet-300' : 'text-foreground/50 hover:bg-white/5'}`}
                            >
                              Tabla
                            </button>
                            <button
                              onClick={() => setChartViews(prev => ({ ...prev, [msg.id]: 'bar' }))}
                              className={`text-[11px] px-2 py-1 rounded-md transition-colors ${chartViews[msg.id] === 'bar' ? 'bg-violet-500/20 text-violet-300' : 'text-foreground/50 hover:bg-white/5'}`}
                            >
                              Gráfico Barras
                            </button>
                            <button
                              onClick={() => setChartViews(prev => ({ ...prev, [msg.id]: 'pie' }))}
                              className={`text-[11px] px-2 py-1 rounded-md transition-colors ${chartViews[msg.id] === 'pie' ? 'bg-violet-500/20 text-violet-600' : 'text-muted-foreground hover:bg-muted'}`}
                            >
                              Gráfico Torta
                            </button>
                          </div>
                          <button
                            onClick={() => exportToCsv(`exportacion_${msg.id}`, msg.rawData!)}
                            className="text-[11px] flex items-center gap-1.5 text-muted-foreground hover:text-green-600 transition-colors bg-muted/50 hover:bg-green-500/10 px-2 py-1 rounded-md border border-border"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Exportar CSV
                          </button>
                        </div>

                        {(!chartViews[msg.id] || chartViews[msg.id] === 'table') && (
                          <div className="overflow-auto max-h-64">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-muted/50 backdrop-blur-md sticky top-0">
                                <tr>
                                  {Object.keys(msg.rawData[0]).map(col => (
                                    <th key={col} className="px-4 py-2.5 font-medium text-muted-foreground">{col}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {msg.rawData.map((row, i) => (
                                  <tr key={i} className="hover:bg-muted/50 transition-colors">
                                    {Object.values(row).map((val: any, j) => (
                                      <td key={j} className="px-4 py-2.5 text-foreground">{val?.toString() ?? 'null'}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {chartViews[msg.id] === 'bar' && (
                          <div className="h-64 p-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={msg.rawData}>
                                <XAxis 
                                  dataKey={Object.keys(msg.rawData[0])[0]} 
                                  stroke="#888888" 
                                  fontSize={12} 
                                  tickLine={false} 
                                  axisLine={false} 
                                />
                                <YAxis 
                                  stroke="#888888" 
                                  fontSize={12} 
                                  tickLine={false} 
                                  axisLine={false} 
                                  tickFormatter={(value) => `$${value}`} 
                                />
                                <RechartsTooltip 
                                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} 
                                />
                                <Bar 
                                  dataKey={Object.keys(msg.rawData[0])[1]} 
                                  fill="#8b5cf6" 
                                  radius={[4, 4, 0, 0]} 
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        {chartViews[msg.id] === 'pie' && (
                          <div className="h-64 p-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={msg.rawData}
                                  dataKey={Object.keys(msg.rawData[0])[1]}
                                  nameKey={Object.keys(msg.rawData[0])[0]}
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={80}
                                  fill="#8b5cf6"
                                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                  {msg.rawData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#6366f1'][index % 6]} />
                                  ))}
                                </Pie>
                                <RechartsTooltip 
                                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} 
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        )}
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
          <div className="shrink-0 pb-8 px-4 z-10 relative">
            <p className="text-[11px] text-muted-foreground mb-4 font-bold uppercase tracking-widest pl-2">Preguntas sugeridas</p>
            <div className="grid grid-cols-1 gap-4">
              {SUGGESTED_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => handleSubmit(q)}
                  className="text-left px-6 py-4 text-[15px] border border-border rounded-[20px] hover:bg-accent transition-all duration-300 text-foreground shadow-sm bg-card backdrop-blur-md hover:-translate-y-0.5 hover:shadow-lg hover:border-violet-500/40"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="shrink-0 pb-10 pt-4 z-10 relative px-4 bg-gradient-to-t from-background via-background to-transparent">
          <div className="relative flex items-center gap-4 bg-card backdrop-blur-xl border border-border rounded-full p-2 pl-6 focus-within:border-violet-500/50 focus-within:ring-4 focus-within:ring-violet-500/10 transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu consulta financiera..."
              className="flex-1 bg-transparent resize-none outline-none text-[15px] text-foreground placeholder:text-muted-foreground max-h-32 overflow-y-auto py-3 scrollbar-thin scrollbar-thumb-muted-foreground/20"
              style={{ fieldSizing: 'content' } as any}
              disabled={isLoading}
            />
            <button
              onClick={() => handleSubmit()}
              disabled={isLoading || !input.trim()}
              className={`shrink-0 w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 ${
                isLoading || !input.trim()
                  ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
                  : 'bg-violet-600 text-white hover:bg-violet-500 hover:scale-105 shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:shadow-[0_0_25px_rgba(139,92,246,0.3)]'
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
          <p className="text-[10px] text-muted-foreground text-center mt-3 uppercase tracking-widest font-bold">
            Presioná Enter para enviar · Shift+Enter para salto de línea
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
  attachedInvoices?: AttachedInvoice[];
}

interface ChatSession {
  id: number;
  title: string;
  updated_at: string;
}

interface AttachedInvoice {
  id: number;
  supplier: string;
  invoice_date: string | null;
  filename: string;
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
      content: '¡Hola! Soy tu asistente financiero. Puedo analizar tus facturas y responder cualquier pregunta sobre tus gastos. También podés adjuntar facturas específicas con el botón 📎 para preguntarme sobre ellas en detalle.',
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Invoice attachment state
  const [attachedInvoices, setAttachedInvoices] = useState<AttachedInvoice[]>([]);
  const [showInvoicePicker, setShowInvoicePicker] = useState(false);
  const [availableInvoices, setAvailableInvoices] = useState<AttachedInvoice[]>([]);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

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
        content: '¡Hola! Soy tu asistente financiero. Puedo analizar tus facturas y responder cualquier pregunta sobre tus gastos. También podés adjuntar facturas específicas con el botón 📎 para preguntarme sobre ellas en detalle.',
      }]);
    }
  }, [currentSessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close picker on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowInvoicePicker(false);
      }
    };
    if (showInvoicePicker) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showInvoicePicker]);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/chat/sessions');
      const data = await res.json();
      if (res.ok) setSessions(data.sessions);
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
        }));
        setMessages(loadedMessages);
      }
    } catch (error) {
      console.error('Error fetching messages', error);
    }
  };

  const fetchAvailableInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const res = await fetch('/api/invoices/list');
      if (res.ok) {
        const data = await res.json();
        setAvailableInvoices(data.invoices || []);
      }
    } catch (e) {
      console.error('Error fetching invoices list', e);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setAttachedInvoices([]);
  };

  const toggleInvoicePicker = () => {
    if (!showInvoicePicker && availableInvoices.length === 0) {
      fetchAvailableInvoices();
    }
    setShowInvoicePicker(v => !v);
    setInvoiceSearch('');
  };

  const toggleAttachInvoice = (inv: AttachedInvoice) => {
    setAttachedInvoices(prev => {
      const exists = prev.some(a => a.id === inv.id);
      if (exists) return prev.filter(a => a.id !== inv.id);
      if (prev.length >= 3) return prev; // Max 3
      return [...prev, inv];
    });
  };

  const removeAttached = (id: number) => {
    setAttachedInvoices(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = async (question?: string) => {
    const text = question || input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      attachedInvoices: attachedInvoices.length > 0 ? [...attachedInvoices] : undefined,
    };

    const loadingMsg: Message = {
      id: 'loading',
      role: 'assistant',
      content: '',
      isLoading: true,
    };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setInput('');
    const sentAttached = [...attachedInvoices];
    setAttachedInvoices([]);
    setIsLoading(true);

    try {
      const history = messages
        .filter(m => !m.isLoading && m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history,
          sessionId: currentSessionId,
          attachedInvoiceIds: sentAttached.map(a => a.id),
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error desconocido');

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.answer,
      };

      setMessages(prev => prev.filter(m => m.id !== 'loading').concat(assistantMsg));

      if (!currentSessionId && data.sessionId) {
        setCurrentSessionId(data.sessionId);
        fetchSessions();
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
    if (currentSessionId === id) setCurrentSessionId(null);
  };

  const clearAllHistory = async () => {
    if (!confirm('¿Borrar TODO el historial de todos los chats?')) return;
    await fetch('/api/chat/sessions', { method: 'DELETE' });
    setSessions([]);
    setCurrentSessionId(null);
  };

  const filteredInvoices = availableInvoices.filter(inv =>
    inv.supplier?.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
    inv.filename?.toLowerCase().includes(invoiceSearch.toLowerCase())
  );

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
                  : 'Haceme cualquier pregunta sobre tus facturas y gastos'}
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
                {/* Attached invoice chips on user messages */}
                {msg.attachedInvoices && msg.attachedInvoices.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {msg.attachedInvoices.map(inv => (
                      <Link
                        key={inv.id}
                        href={`/invoices/${inv.id}`}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 border border-white/20 rounded-full text-[11px] text-white/80 hover:bg-white/20 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        {inv.supplier || inv.filename}
                      </Link>
                    ))}
                  </div>
                )}

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
                  ) : msg.role === 'assistant' ? (
                    <ReactMarkdown
                      components={{
                        a: ({ href, children }) => {
                          const isInternal = href?.startsWith('/');
                          if (isInternal) {
                            return (
                              <Link
                                href={href!}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-500/10 border border-violet-500/30 text-violet-600 dark:text-violet-400 rounded-lg text-sm font-medium hover:bg-violet-500/20 transition-colors no-underline"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {children}
                              </Link>
                            );
                          }
                          return <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-violet-500">{children}</a>;
                        },
                        p: ({ children }) => <p className="mb-2 last:mb-0 whitespace-pre-wrap">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Suggested questions (shown only on new chats) */}
          {messages.length <= 1 && (
            <div className="grid grid-cols-2 gap-3 px-4 mt-4">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSubmit(q)}
                  className="text-left px-4 py-3 text-sm rounded-xl border border-border bg-card hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="shrink-0 pb-10 pt-4 z-10 relative px-4 bg-gradient-to-t from-background via-background to-transparent">
          {/* Attached invoice chips */}
          {attachedInvoices.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 px-2">
              {attachedInvoices.map(inv => (
                <div key={inv.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 border border-violet-500/30 rounded-full text-xs text-violet-600 dark:text-violet-400 font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="max-w-[160px] truncate">{inv.supplier || inv.filename}</span>
                  <button
                    onClick={() => removeAttached(inv.id)}
                    className="ml-1 hover:text-red-500 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <span className="text-xs text-muted-foreground self-center">{3 - attachedInvoices.length} restantes</span>
            </div>
          )}

          {/* Invoice Picker Dropdown */}
          {showInvoicePicker && (
            <div
              ref={pickerRef}
              className="absolute bottom-full mb-3 left-4 right-4 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden"
            >
              <div className="p-3 border-b border-border">
                <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    autoFocus
                    type="text"
                    value={invoiceSearch}
                    onChange={e => setInvoiceSearch(e.target.value)}
                    placeholder="Buscar factura por proveedor..."
                    className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {loadingInvoices ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">Cargando facturas...</div>
                ) : filteredInvoices.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">No se encontraron facturas.</div>
                ) : (
                  filteredInvoices.map(inv => {
                    const isSelected = attachedInvoices.some(a => a.id === inv.id);
                    const isDisabled = !isSelected && attachedInvoices.length >= 3;
                    return (
                      <button
                        key={inv.id}
                        onClick={() => !isDisabled && toggleAttachInvoice(inv)}
                        disabled={isDisabled}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors border-b border-border/50 last:border-0
                          ${isSelected ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400' : isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-muted text-foreground'}`}
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${isSelected ? 'bg-violet-500 border-violet-500' : 'border-border'}`}>
                          {isSelected && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{inv.supplier || 'Desconocido'}</p>
                          <p className="text-xs text-muted-foreground truncate">{inv.filename} {inv.invoice_date ? `· ${new Date(inv.invoice_date).toLocaleDateString('es-ES')}` : ''}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <div className="relative flex items-center gap-4 bg-card backdrop-blur-xl border border-border rounded-full p-2 pl-4 focus-within:border-violet-500/50 focus-within:ring-4 focus-within:ring-violet-500/10 transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
            {/* Attach button */}
            <button
              onClick={toggleInvoicePicker}
              title="Adjuntar factura"
              className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200
                ${showInvoicePicker || attachedInvoices.length > 0
                  ? 'bg-violet-500/15 text-violet-500 border border-violet-500/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              {attachedInvoices.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {attachedInvoices.length}
                </span>
              )}
            </button>

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
            Presioná Enter para enviar · Shift+Enter para salto de línea · 📎 Para adjuntar facturas
          </p>
        </div>
      </div>
    </div>
  );
}

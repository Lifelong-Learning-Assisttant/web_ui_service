import React, { useRef, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { InlineMath, BlockMath } from 'react-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';
import { NetrunnerDeck } from './NetrunnerDeck';
import { IDENTITIES } from './IdentitySelection';

export const ChatInterface: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, user } = useAppStore();
  
  const identity = user?.identityId ? IDENTITIES.find(i => i.id === user.identityId) : IDENTITIES[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatContent = (content: string) => {
    // Упрощенный парсинг для демонстрации, в будущем добавим полноценный Markdown
    const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
    
    return parts.map((part, i) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        return <BlockMath key={i} math={part.slice(2, -2)} />;
      }
      if (part.startsWith('$') && part.endsWith('$')) {
        return <InlineMath key={i} math={part.slice(1, -1)} />;
      }
      if (part.includes('```')) {
        const match = part.match(/```(\w+)?\n([\s\S]*?)```/);
        if (match) {
          return (
            <SyntaxHighlighter key={i} language={match[1] || 'text'} style={atomDark} customStyle={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,255,204,0.1)' }}>
              {match[2]}
            </SyntaxHighlighter>
          );
        }
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative font-mono">
      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 cyber-scroll bg-background-dark/30">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex flex-col gap-2 max-w-[90%] ${msg.role === 'user' ? 'ml-auto items-end' : ''}`}
            >
              <div className="flex items-center gap-2">
                {msg.isSystem ? (
                  <>
                    <span className="text-[9px] font-display text-slate-400 font-bold uppercase tracking-wider">SYSTEM MESSAGE</span>
                    <span className="text-[8px] text-slate-600">{msg.timestamp.toLocaleTimeString()}</span>
                  </>
                ) : msg.role === 'assistant' ? (
                  <>
                    <span className="text-[9px] font-display text-accent-lime font-bold uppercase tracking-wider">AI ASSISTANT</span>
                    <span className="text-[8px] text-slate-500">{msg.timestamp.toLocaleTimeString()}</span>
                  </>
                ) : (
                  <>
                    <span className="text-[8px] text-slate-500">{msg.timestamp.toLocaleTimeString()}</span>
                    <span className="text-[9px] font-display text-primary font-bold uppercase tracking-wider">USER_ROOT::{user?.username}</span>
                  </>
                )}
              </div>
              
              <div className={`glass-panel p-4 rounded-xl text-sm text-slate-200 relative overflow-hidden ${
                msg.isSystem
                  ? 'border-l-2 border-slate-500 bg-slate-500/5 shadow-[0_0_15px_rgba(148,163,184,0.1)]'
                  : msg.role === 'assistant'
                    ? 'border-l-2 border-accent-lime bg-accent-lime/5'
                    : 'border-r-2 border-primary bg-primary/5 text-right'
              }`}>
                {msg.isProcessing ? (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary animate-ping rounded-full"></div>
                    <span className="text-primary/60 italic text-xs uppercase tracking-widest">Processing_Neural_Command...</span>
                  </div>
                ) : (
                  <div className="space-y-2 whitespace-pre-wrap">
                    {formatContent(msg.content)}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Netrunner Deck (Bottom Hub) */}
      <NetrunnerDeck mode="chat" />
    </div>
  );
};
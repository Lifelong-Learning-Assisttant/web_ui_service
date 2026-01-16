import React, { useRef, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';
import { NetrunnerDeck } from './NetrunnerDeck';
import { IDENTITIES } from './IdentitySelection';
import { ExternalLink, FileText, Database } from 'lucide-react';

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
    // Регулярное выражение для поиска источников в формате JSON-подобных строк
    const sourceRegex = /- \{'filename':.*?\}/g;
    const sources: any[] = [];
    
    const cleanContent = content.replace(sourceRegex, (match) => {
      try {
        // Упрощенный парсинг JSON-подобной строки (замена одинарных кавычек на двойные)
        const jsonStr = match.substring(2).replace(/'/g, '"');
        const source = JSON.parse(jsonStr);
        sources.push(source);
        return ''; // Удаляем из основного текста, отрендерим внизу отдельно
      } catch (e) {
        return match;
      }
    }).replace(/\*\*Источники:\*\*\n?/g, '');

    return (
      <div className="space-y-4">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            h1: ({node, ...props}) => <h1 className="text-primary font-display text-lg mt-4 mb-2 uppercase tracking-tighter neon-text-cyan" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-secondary font-display text-md mt-3 mb-1 uppercase tracking-tighter neon-text-lime" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-accent-cyan font-display text-sm mt-2 mb-1 uppercase" {...props} />,
            p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed font-mono" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 mb-2 ml-2 text-slate-300" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1 mb-2 ml-2 text-slate-300 font-bold" {...props} />,
            li: ({node, ...props}) => <li className="marker:text-primary mb-1" {...props} />,
            strong: ({node, ...props}) => <strong className="text-secondary font-bold neon-text-lime" {...props} />,
            em: ({node, ...props}) => <em className="text-accent-cyan italic" {...props} />,
            code: ({node, inline, className, children, ...props}: any) => {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <div className="my-4 rounded-lg overflow-hidden border border-white/5 shadow-2xl">
                  <SyntaxHighlighter
                    style={atomDark}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', fontSize: '11px' }}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code className="bg-white/10 px-1.5 py-0.5 rounded text-accent-cyan font-mono text-[0.9em]" {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {cleanContent}
        </ReactMarkdown>

        {sources.length > 0 && (
          <div className="mt-6 pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-display font-bold text-primary tracking-widest uppercase opacity-60">
              <Database className="w-3 h-3" />
              Neural_Knowledge_Sources
            </div>
            <div className="grid grid-cols-1 gap-2">
              {sources.map((src, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-black/20 border border-white/5 rounded group hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText className="w-3.5 h-3.5 text-secondary shrink-0" />
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[11px] font-bold text-slate-200 truncate">{src.breadcrumbs || src.filename}</span>
                      <span className="text-[9px] text-slate-500 font-mono truncate uppercase">{src.filename}</span>
                    </div>
                  </div>
                  {src.url && (
                    <a href={src.url} target="_blank" rel="noreferrer" className="p-1.5 text-slate-500 hover:text-primary transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
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
                    ? 'border-l-2 border-accent-lime bg-accent-lime/5 ai-bubble-glow'
                    : 'border-r-2 border-primary bg-primary/5 text-right user-bubble-glow'
              }`}>
                {msg.isProcessing ? (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary animate-ping rounded-full"></div>
                    <span className="text-primary/60 italic text-xs uppercase tracking-widest">Processing_Neural_Command...</span>
                  </div>
                ) : (
                  <div className="space-y-2 break-words overflow-hidden">
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
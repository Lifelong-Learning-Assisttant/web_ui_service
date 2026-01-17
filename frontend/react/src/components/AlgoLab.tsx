import React, { useState, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { NetrunnerDeck } from './NetrunnerDeck';
import { UnifiedChat } from './UnifiedChat';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, Play, Bolt, Brain, FileText } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const DEFAULT_CODE = `class Solution:
    def isValid(self, s: str) -> bool:
        # Напишите ваше решение здесь
        pass
`;

const TASK_DESCRIPTION = `
# 20. Valid Parentheses

Дана строка \`s\`, содержащая только символы \`'(', ')', '{', '}', '[' и ']'\`. Определите, является ли входная строка валидной.

### Условия валидности
1. Открывающие скобки должны закрываться скобками того же типа.
2. Открывающие скобки должны закрываться в правильном порядке.
3. Каждая закрывающая скобка имеет соответствующую открывающую скобку того же типа.
`;

export const AlgoLab: React.FC = () => {
  const { sendMessage } = useAppStore();
  const [code, setCode] = useState(DEFAULT_CODE);
  const [activeTab, setActiveTab] = useState<'task' | 'code'>('code');

  const runCode = () => {
    // Отправляем событие для терминала в NetrunnerDeck
    window.dispatchEvent(new CustomEvent('terminal-command', { 
      detail: { command: 'pytest test.py', problem_path: 'valid_parentheses' } 
    }));
  };

  const handleHint = useCallback(() => {
    sendMessage(`Подскажи как решать задачу? Текущий код:\n${code}`, 'ALGOS');
  }, [code, sendMessage]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative font-mono bg-black/40">
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Main Workspace */}
        <section className="w-1/2 flex flex-col min-w-0 bg-surface-dark border-r border-white/5 relative h-full">
          {/* Tabs Header */}
          <div className="h-10 px-1 bg-black/40 border-b border-primary/20 flex items-center shrink-0 gap-1">
            <button
              onClick={() => setActiveTab('task')}
              className={`flex items-center gap-2 px-3 h-8 text-[10px] font-bold transition-all rounded-t ${activeTab === 'task' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>TASK.md</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-3 h-8 text-[10px] font-bold transition-all rounded-t ${activeTab === 'code' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>solution.py</span>
            </button>
            
            <div className="ml-auto flex items-center gap-2 px-2">
              <button
                onClick={runCode}
                className="flex items-center gap-1.5 px-3 py-1 bg-primary/5 border border-primary/50 rounded text-primary hover:bg-primary/20 transition-all shadow-[0_0_10px_rgba(0,242,255,0.2)] group"
              >
                <Play className="w-3 h-3 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-bold tracking-wider uppercase">Run Tests</span>
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden relative flex flex-col">
            <AnimatePresence mode="wait">
              {activeTab === 'task' ? (
                <motion.div
                  key="task"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex-1 overflow-auto p-6 prose prose-invert prose-slate max-w-none cyber-scroll"
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {TASK_DESCRIPTION}
                  </ReactMarkdown>
                </motion.div>
              ) : (
                <motion.div
                  key="code"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex-1 overflow-auto bg-[#0d1117]/90 cyber-scroll relative"
                >
                  <SyntaxHighlighter
                    language="python"
                    style={atomDark}
                    showLineNumbers
                    customStyle={{
                      margin: 0,
                      padding: '1.5rem',
                      fontSize: '13px',
                      background: 'transparent',
                      minHeight: '100%'
                    }}
                    lineNumberStyle={{ minWidth: '3em', paddingRight: '1.5em', color: '#334155', textAlign: 'right' }}
                  >
                    {code}
                  </SyntaxHighlighter>
                  <textarea
                    className="absolute inset-0 w-full h-full bg-transparent p-[1.5rem] pl-[4.5em] text-[13px] text-primary caret-primary font-mono outline-none resize-none z-10"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    spellCheck={false}
                    style={{ color: 'transparent' }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* AI Assistant Panel */}
        <section className="w-1/2 flex flex-col min-w-0 bg-surface-dark/95 backdrop-blur-sm relative">
          <div className="h-10 px-3 bg-black/40 border-b border-secondary/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-secondary" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Interviewer</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleHint}
                className="flex items-center gap-1.5 px-2 py-0.5 bg-secondary/5 border border-secondary/50 rounded text-secondary hover:bg-secondary/20 transition-all shadow-[0_0_8px_rgba(163,255,0,0.2)]"
              >
                <Bolt className="w-3 h-3" />
                <span className="text-[9px] font-bold tracking-wider uppercase">Hint</span>
              </button>
            </div>
          </div>

          <div className="bg-black/20 border-b border-primary/10 px-3 py-2 shrink-0">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[8px] font-bold text-primary uppercase tracking-widest">Interview Progress</label>
              <span className="text-[8px] font-mono text-primary/70">0 / 10 Tests</span>
            </div>
            <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden relative">
              <div className="absolute inset-y-0 left-0 bg-primary shadow-[0_0_8px_#00f2ff] rounded-full w-[0%] transition-all duration-500"></div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 cyber-scroll relative">
            <UnifiedChat limit={10} showSystem={false} />
          </div>
        </section>
      </div>

      <NetrunnerDeck mode="algos" />
    </div>
  );
};
import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { Terminal as TerminalIcon, MessageSquare, BookOpen, Send, Edit3, Eye, MinusSquare, PlusSquare } from 'lucide-react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

type DeckTab = 'TERMINAL' | 'AI_SYNC' | 'ANSWER_QUIZ';
type InputMode = 'EDITOR' | 'PREVIEW';

interface NetrunnerDeckProps {
  mode: 'chat' | 'theory' | 'algos';
}

export const NetrunnerDeck: React.FC<NetrunnerDeckProps> = ({ mode }) => {
  const [activeTab, setActiveTab] = useState<DeckTab>(mode === 'algos' ? 'TERMINAL' : 'AI_SYNC');
  const [inputMode, setInputMode] = useState<InputMode>('EDITOR');
  const [inputText, setInputText] = useState('');
  const [height, setHeight] = useState(33); // в процентах vh
  const [isMinimized, setIsMinimized] = useState(false);
  
  const { sendMessage, isLoading, messages } = useAppStore();
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  // Обработка команд терминала извне (например, кнопка Run Tests)
  useEffect(() => {
    const handleTerminalCommand = (e: any) => {
      if (activeTab !== 'TERMINAL') setActiveTab('TERMINAL');
      
      const { command, problem_path } = e.detail;
      if (xtermRef.current) {
        xtermRef.current.writeln(`\r\n\x1b[1;33m> Executing: ${command}\x1b[0m`);
        
        // Отправка через WebSocket
        const ws = (window as any).chatWS;
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            cmd: 'terminal',
            command,
            problem_path,
            cwd: `/home/sandbox/app/${problem_path}`
          }));
        }
      }
    };

    window.addEventListener('terminal-command', handleTerminalCommand);
    return () => window.removeEventListener('terminal-command', handleTerminalCommand);
  }, [activeTab]);

  // Инициализация XTerm
  useEffect(() => {
    if (activeTab === 'TERMINAL' && terminalRef.current && !xtermRef.current) {
      const term = new Terminal({
        theme: {
          background: '#05070a',
          foreground: '#00ffcc',
          cursor: '#00ffcc',
          selectionBackground: 'rgba(0, 255, 204, 0.3)',
        },
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 12,
        cursorBlink: true,
        convertEol: true
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);
      setTimeout(() => fitAddon.fit(), 100);

      term.writeln('\x1b[1;36m> Neural Uplink Established...\x1b[0m');
      term.write('\r\n\x1b[1;34m[sandbox@netrunner]$\x1b[0m ');

      // Обработка ввода
      let currentLine = '';
      term.onData(e => {
        switch (e) {
          case '\r': // Enter
            term.write('\r\n');
            if (currentLine.trim()) {
              const ws = (window as any).chatWS;
              if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  cmd: 'terminal',
                  command: currentLine,
                  cwd: `/home/sandbox/app/valid_parentheses`
                }));
              }
            } else {
              term.write('\x1b[1;34m[sandbox@netrunner]$\x1b[0m ');
            }
            currentLine = '';
            break;
          case '\u007F': // Backspace
            if (currentLine.length > 0) {
              currentLine = currentLine.slice(0, -1);
              term.write('\b \b');
            }
            break;
          default:
            if (e >= ' ' && e <= '~') {
              currentLine += e;
              term.write(e);
            }
        }
      });

      xtermRef.current = term;
      fitAddonRef.current = fitAddon;

      // Глобальный обработчик для вывода из WebSocket
      const handleWsOutput = (e: any) => {
        const data = e.detail;
        if (data.type === 'terminal_output' && xtermRef.current) {
          xtermRef.current.write(data.line);
        } else if (data.type === 'terminal_done' && xtermRef.current) {
          xtermRef.current.write('\r\n\x1b[1;34m[sandbox@netrunner]$\x1b[0m ');
        }
      };
      window.addEventListener('ws-terminal-output', handleWsOutput);
      (window as any)._terminalWsHandler = handleWsOutput;
    }

    return () => {
      if (xtermRef.current) {
        if ((window as any)._terminalWsHandler) {
          window.removeEventListener('ws-terminal-output', (window as any)._terminalWsHandler);
        }
        xtermRef.current.dispose();
        xtermRef.current = null;
      }
    };
  }, [activeTab]);

  useEffect(() => {
    if (!isMinimized && fitAddonRef.current) {
      setTimeout(() => fitAddonRef.current?.fit(), 300);
    }
  }, [height, isMinimized]);

  const isResizing = useRef(false);

  const startResizing = (e: React.MouseEvent) => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
  };

  const stopResizing = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const newHeight = ((window.innerHeight - e.clientY) / window.innerHeight) * 100;
    if (newHeight > 10 && newHeight < 80) {
      setHeight(newHeight);
      if (isMinimized) setIsMinimized(false);
    }
  };

  const handleSend = async () => {
    if (inputText.trim() && !isLoading) {
      let textToSend = inputText.trim();
      await sendMessage(textToSend, activeTab);
      setInputText('');
      setInputMode('EDITOR');
    }
  };

  return (
    <div
      style={{ height: isMinimized ? '40px' : `${height}vh` }}
      className={`border-t border-primary/20 bg-surface-dark/80 backdrop-blur-md flex flex-col overflow-hidden relative transition-all duration-300 ease-in-out ${isMinimized ? 'translate-y-[calc(100%-40px)]' : ''}`}
    >
      <div
        onMouseDown={startResizing}
        className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-primary/40 z-50 transition-colors"
      />

      <div className="flex border-b border-slate-800 bg-black/40 shrink-0 items-center justify-between pr-2">
        <div className="flex">
        {[
          { id: 'TERMINAL', icon: <TerminalIcon className="w-3 h-3" />, label: 'TERMINAL', modes: ['algos'] },
          { id: 'AI_SYNC', icon: <MessageSquare className="w-3 h-3" />, label: 'AI_SYNC', modes: ['chat', 'theory', 'algos'] },
          { id: 'ANSWER_QUIZ', icon: <BookOpen className="w-3 h-3" />, label: 'ANSWER_QUIZ', modes: ['theory'] },
        ].filter(tab => tab.modes.includes(mode)).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as DeckTab)}
            className={`px-4 py-2 text-[10px] font-display font-bold tracking-widest flex items-center gap-2 transition-all ${
              activeTab === tab.id 
                ? 'text-primary bg-primary/10 border-b-2 border-primary' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 text-slate-500 hover:text-primary transition-colors"
            title={isMinimized ? "Restore Deck" : "Minimize Deck"}
          >
            {isMinimized ? <PlusSquare className="w-4 h-4" /> : <MinusSquare className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'TERMINAL' ? (
          <div className="flex-1 p-2 bg-black/20 overflow-hidden">
            <div ref={terminalRef} className="w-full h-full" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-1.5 bg-black/40 border-b border-slate-800 flex justify-between items-center shrink-0">
              <span className="text-[8px] font-display text-primary tracking-[0.2em] uppercase font-bold">Agent Context Window</span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary shadow-[0_0_8px_#00FFCC]" style={{ width: '24%' }}></div>
                </div>
                <span className="text-[8px] font-mono text-primary">24 / 100</span>
              </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden p-3">
              <div className="glass-panel rounded-lg flex-1 flex flex-col overflow-hidden border border-slate-700/50">
                <div className="flex border-b border-slate-800 bg-black/20 shrink-0">
                  <button 
                    onClick={() => setInputMode('EDITOR')}
                    className={`px-3 py-1.5 text-[9px] font-display font-bold tracking-wider flex items-center gap-1.5 transition-all ${
                      inputMode === 'EDITOR' ? 'text-primary bg-primary/5' : 'text-slate-500'
                    }`}
                  >
                    <Edit3 className="w-3 h-3" /> EDITOR
                  </button>
                  <button 
                    onClick={() => setInputMode('PREVIEW')}
                    className={`px-3 py-1.5 text-[9px] font-display font-bold tracking-wider flex items-center gap-1.5 transition-all ${
                      inputMode === 'PREVIEW' ? 'text-primary bg-primary/5' : 'text-slate-500'
                    }`}
                  >
                    <Eye className="w-3 h-3" /> PREVIEW
                  </button>
                </div>

                <div className="flex-1 relative overflow-hidden bg-black/40">
                  {inputMode === 'EDITOR' ? (
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Draft neural command..."
                      className="w-full h-full bg-transparent p-3 text-[13px] text-slate-200 font-mono outline-none resize-none placeholder-slate-700"
                    />
                  ) : (
                    <div className="w-full h-full p-3 overflow-y-auto cyber-scroll text-slate-300 text-sm">
                      {inputText ? (
                        <div className="space-y-2 whitespace-pre-wrap">
                          {inputText.split(/(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g).map((part, i) => {
                            if (part.startsWith('$$') && part.endsWith('$$')) {
                              return <BlockMath key={i} math={part.slice(2, -2)} />;
                            }
                            if (part.startsWith('$') && part.endsWith('$')) {
                              return <InlineMath key={i} math={part.slice(1, -1)} />;
                            }
                            return <span key={i}>{part}</span>;
                          })}
                        </div>
                      ) : (
                        <span className="text-slate-700 italic">Preview empty...</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-2 border-t border-slate-800 bg-black/20 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_5px_#00FFCC]"></span>
                    <span className="text-[8px] text-primary font-bold tracking-widest uppercase">Uplink: Active</span>
                  </div>
                  <button 
                    onClick={handleSend}
                    disabled={!inputText.trim() || isLoading}
                    className={`px-6 py-1.5 rounded text-[10px] font-bold flex items-center gap-2 transition-all active:scale-95 ${
                      activeTab === 'ANSWER_QUIZ' 
                        ? 'bg-accent-lime text-black' 
                        : 'bg-primary text-black'
                    } disabled:opacity-30`}
                  >
                    <Send className="w-3 h-3" />
                    {isLoading ? 'SYNCING...' : 'SEND COMMAND >'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
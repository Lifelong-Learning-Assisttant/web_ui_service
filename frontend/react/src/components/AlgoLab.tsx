import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { NetrunnerDeck } from './NetrunnerDeck';
import { UnifiedChat } from './UnifiedChat';
import { motion } from 'framer-motion';
import { Code2, Play, Maximize2, Bolt, Brain, User, Network } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const DEFAULT_CODE = `import math

def binary_search(arr, x):
    low = 0
    high = len(arr) - 1
    while low <= high:
        mid = (high + low) // 2
        if arr[mid] < x:
            low = mid + 1
        elif arr[mid] > x:
            high = mid - 1
        else:
            return mid
    return -1
`;

export const AlgoLab: React.FC = () => {
  const { messages, user } = useAppStore();
  const [code, setCode] = useState(DEFAULT_CODE);

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative font-mono bg-black/40">
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Editor Panel */}
        <section className="w-1/2 flex flex-col min-w-0 bg-surface-dark border-r border-white/5 relative">
          <div className="h-10 px-3 bg-black/40 border-b border-primary/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-secondary" />
              <span className="text-[10px] font-bold text-slate-400">algorithm.py</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/5 border border-primary/50 rounded text-primary hover:bg-primary/20 transition-all shadow-[0_0_10px_rgba(0,242,255,0.2)]">
                <Play className="w-3 h-3" />
                <span className="text-[9px] font-bold tracking-wider uppercase">Run</span>
              </button>
              <button className="text-slate-500 hover:text-primary transition-colors">
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="p-3 grid grid-cols-2 gap-3 bg-black/20 shrink-0">
            <div className="relative">
              <label className="absolute -top-1.5 left-2 px-1 bg-surface-dark text-[8px] font-bold text-primary uppercase">Time Complexity</label>
              <input 
                className="w-full bg-transparent border border-primary/30 rounded px-2 py-1.5 text-[10px] font-mono text-secondary focus:ring-1 focus:ring-primary outline-none" 
                type="text" 
                defaultValue="O(log n)"
              />
            </div>
            <div className="relative">
              <label className="absolute -top-1.5 left-2 px-1 bg-surface-dark text-[8px] font-bold text-primary uppercase">Space Complexity</label>
              <input 
                className="w-full bg-transparent border border-primary/30 rounded px-2 py-1.5 text-[10px] font-mono text-secondary focus:ring-1 focus:ring-primary outline-none" 
                type="text" 
                defaultValue="O(1)"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-[#0d1117]/90 cyber-scroll">
            <SyntaxHighlighter 
              language="python" 
              style={atomDark}
              showLineNumbers
              customStyle={{ 
                margin: 0, 
                padding: '1rem', 
                fontSize: '12px', 
                background: 'transparent' 
              }}
              lineNumberStyle={{ minWidth: '3em', paddingRight: '1em', color: '#334155', textAlign: 'right' }}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        </section>

        {/* AI Assistant Panel */}
        <section className="w-1/2 flex flex-col min-w-0 bg-surface-dark/95 backdrop-blur-sm relative">
          <div className="h-10 px-3 bg-black/40 border-b border-secondary/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-secondary" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Assistant</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-2 py-0.5 bg-secondary/5 border border-secondary/50 rounded text-secondary hover:bg-secondary/20 transition-all shadow-[0_0_8px_rgba(163,255,0,0.2)]">
                <Bolt className="w-3 h-3" />
                <span className="text-[9px] font-bold tracking-wider uppercase">Hint</span>
              </button>
            </div>
          </div>

          <div className="bg-black/20 border-b border-primary/10 px-3 py-2 shrink-0">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[8px] font-bold text-primary uppercase tracking-widest">Agent Context Window</label>
              <span className="text-[8px] font-mono text-primary/70">20 / 100</span>
            </div>
            <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden relative">
              <div className="absolute inset-y-0 left-0 bg-primary shadow-[0_0_8px_#00f2ff] rounded-full w-[20%]"></div>
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
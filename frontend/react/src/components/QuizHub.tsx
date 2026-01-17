import React from 'react';
import { useAppStore } from '../store/appStore';
import { NetrunnerDeck } from './NetrunnerDeck';
import { UnifiedChat } from './UnifiedChat';
import { BlockMath } from 'react-katex';
import { Brain, Network, Activity } from 'lucide-react';

export const QuizHub: React.FC = () => {
  const { messages } = useAppStore();

  // Находим последнее сообщение типа quizz_question, чтобы получить текущий прогресс
  const lastQuizMsg = [...messages].reverse().find(m => m.type === 'quizz_question');
  const currentIdx = lastQuizMsg?.meta?.current_quiz_index ?? 0;
  const totalQuestions = lastQuizMsg?.meta?.total_questions ?? 0;
  const isComplete = totalQuestions > 0 && currentIdx === totalQuestions; // Это может быть не совсем точно, если мы на последнем вопросе, но еще не ответили.
  // Но по логике backend, когда вопросы закончились, присылается результат.

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative font-mono">
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Left Pane: Theory / Target */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 border-b lg:border-b-0 lg:border-r border-slate-800 bg-background-dark/20 relative cyber-scroll">
          {/* Progress Bar */}
          <div className="flex flex-col gap-2 mb-6">
            <div className="flex justify-between items-end mb-1">
              <div className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-display text-primary tracking-widest uppercase font-bold">Quiz Progress</span>
              </div>
              <div className="text-[10px] font-display text-primary/80 font-bold tracking-widest uppercase">
                {totalQuestions > 0 ? `Question ${Math.min(currentIdx + 1, totalQuestions)} / ${totalQuestions}` : 'No active quiz'}
              </div>
            </div>
            <div className="flex gap-1 h-1.5">
              {totalQuestions > 0 ? (
                Array.from({ length: totalQuestions }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm transition-all duration-500 ${
                      i <= currentIdx
                        ? 'bg-primary shadow-[0_0_8px_#00FFCC]'
                        : 'bg-slate-800/50 border border-slate-700/50'
                    }`}
                  ></div>
                ))
              ) : (
                <div className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-sm"></div>
              )}
            </div>
          </div>

          {/* Quiz Question Card */}
          {lastQuizMsg ? (
            <section className="glass-panel p-5 md:p-6 rounded-xl border-l-4 border-l-primary mb-6 shadow-2xl relative overflow-hidden group">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-primary text-sm md:text-base uppercase tracking-wider font-bold">Current Question</h2>
                  <p className="text-[10px] text-slate-500 font-mono tracking-tight uppercase">Topic: Neural Preparation</p>
                </div>
              </div>

              <div className="space-y-5 text-sm leading-relaxed text-slate-300">
                <UnifiedChat limit={1} showSystem={false} mode="quiz_only" />
              </div>
            </section>
          ) : (
            <section className="glass-panel p-5 md:p-6 rounded-xl border-l-4 border-l-primary mb-6 shadow-2xl relative overflow-hidden group">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-primary text-sm md:text-base uppercase tracking-wider font-bold">Sync Target: Chain Rule</h2>
                  <p className="text-[10px] text-slate-500 font-mono tracking-tight uppercase">Topology: Backpropagation</p>
                </div>
              </div>

              <div className="space-y-5 text-sm leading-relaxed text-slate-300">
                <div className="space-y-2 text-[13px]">
                  <p><span className="text-primary font-bold uppercase tracking-tighter text-[10px] mr-2">Goal:</span> Deep understanding of the derivative distribution process across complex neural topologies.</p>
                  <p><span className="text-primary font-bold uppercase tracking-tighter text-[10px] mr-2">Concept:</span> The chain rule allows us to calculate the influence of weight <span className="text-accent-cyan italic font-serif">w</span> on the final loss <span className="text-accent-cyan italic font-serif">L</span>.</p>
                </div>

                <div className="p-4 md:p-6 bg-black/60 rounded-lg border border-slate-800 text-center relative group">
                  <div className="absolute top-2 right-2 opacity-30">
                    <Network className="w-3 h-3 text-slate-600" />
                  </div>
                  <div className="text-accent-cyan overflow-x-auto py-2">
                    <BlockMath math="\frac{\partial L}{\partial w} = \frac{\partial L}{\partial y} \cdot \frac{\partial y}{\partial x} \cdot \frac{\partial x}{\partial w}" />
                  </div>
                </div>

                <p className="text-slate-500 italic text-[11px] pl-3 border-l-2 border-slate-700">
                  Observe how tokens flow through the network. A "gradient explosion" occurs when these partial derivatives exceed threshold 1.0.
                </p>
              </div>
            </section>
          )}
        </div>

        {/* Right Pane: AI Core Chat */}
        <div className="lg:w-[45%] flex flex-col relative z-10 bg-black/30 border-t lg:border-t-0 border-primary/20">
          <div className="h-9 bg-surface-dark border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2">
              <Network className="w-3.5 h-3.5 text-primary animate-pulse" />
              <span className="text-[10px] font-display font-bold text-slate-300 tracking-[0.15em] uppercase">Agent Context Window</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-lime shadow-[0_0_4px_#A2FF00]"></span>
              <span className="text-[9px] font-mono text-accent-lime uppercase">Online</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-black/20 to-transparent pb-6 cyber-scroll">
            {isComplete ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                  <Activity className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-primary font-display text-xl uppercase tracking-widest neon-text-cyan">Quiz Complete</h2>
                <p className="text-slate-400 text-sm max-w-xs">
                  All questions answered. Check the chat for your detailed evaluation and feedback.
                </p>
              </div>
            ) : (
              <UnifiedChat limit={10} showSystem={false} mode="chat_only" />
            )}
          </div>
        </div>
      </div>

      <NetrunnerDeck mode="theory" />
    </div>
  );
};
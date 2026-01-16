import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { NeuralGraph } from './NeuralGraph';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAppStore();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(username, password);
    } catch (err) {
      setError('IDENTITY_NOT_FOUND: ACCESS_DENIED');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background-dark group font-mono">
      <NeuralGraph />
      
      {/* Digital Rain Effect */}
      <div className="absolute top-0 right-0 h-full w-32 md:w-64 z-10 mask-gradient-v overflow-hidden flex justify-end pr-2 md:pr-6">
        <div className="flex gap-2 md:gap-6 opacity-60">
          <div className="flex flex-col text-[10px] md:text-xs font-mono text-primary/80 animate-rain whitespace-nowrap leading-relaxed">
            <div className="flex flex-col">
              <span className="opacity-50">0x4F:AE</span><span>DATA_PKT</span><span className="text-secondary">NULL_PTR</span><span>0010101</span>
              <span className="opacity-30">------</span><span>SYS_OVR</span><span>MEM_LEAK</span><span className="opacity-50">0xFF:00</span>
              <span>SCANNING</span><span>... ...</span><span>0x2B:4C</span><span>NET_RDY</span>
              <span className="text-secondary opacity-70">ERR_404</span><span>BUFFER</span><span>0101110</span><span>LINK_UP</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-40 w-full min-h-screen p-4 md:p-12 flex flex-col items-center justify-center md:items-start md:justify-start">
        <main className="w-full max-w-sm cyber-border p-1 relative backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.7)] mt-4 md:mt-16 md:ml-12 border-t border-primary/30">
          <div className="bg-surface-dark/90 p-6 md:p-8 space-y-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none"></div>
            
            <header className="text-left space-y-1 relative z-10">
              <div className="flex items-center gap-2 text-primary/60 mb-1">
                <span className="w-1.5 h-1.5 bg-primary animate-pulse"></span>
                <span className="text-[9px] tracking-[0.2em] font-bold uppercase">System_Entry</span>
              </div>
              <h1 className="font-display text-2xl font-bold text-white neon-text-cyan tracking-tight leading-none">
                CYBER ML & DL<br/>
                <span className="text-secondary neon-text-lime text-xl">INTERVIEW SIMULATOR</span>
              </h1>
            </header>

            <div className="space-y-6 relative z-10">
              {/* Scanner Block */}
              <div className="relative w-full aspect-video border border-primary/20 bg-black overflow-hidden flex flex-col items-center justify-center group shadow-inner">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,204,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,204,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                <div className="absolute top-2 left-2 text-[8px] text-primary/40 font-mono">CAM_04 [OFFLINE]</div>
                
                <div className="relative z-10 flex items-center justify-center opacity-90">
                  <div className="w-32 h-32 rounded-full border border-primary/20"></div>
                  <div className="absolute w-24 h-24 rounded-full border border-dashed border-primary/50 animate-spin-slow"></div>
                </div>
                
                <div className="absolute inset-x-0 h-1 bg-secondary blur-[4px] shadow-[0_0_15px_#DAFF00] animate-scan-vertical-slow z-20"></div>
                
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-30 space-y-1">
                  {error ? (
                    <div className="text-[10px] text-red-500 font-bold tracking-widest bg-black/70 px-2 py-0.5 border border-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]">
                      {error}
                    </div>
                  ) : (
                    <div className="text-[10px] text-yellow-300 font-bold tracking-widest bg-black/70 px-2 py-0.5 border border-yellow-300 shadow-[0_0_5px_rgba(253,224,71,0.5)]">
                      IDENTITY_NOT_FOUND
                    </div>
                  )}
                  <div className="text-[8px] text-secondary font-mono animate-pulse">
                    {isLoading ? 'SYNCING_NEURAL_LINK...' : 'SCANNING_UNREGISTERED_SUBJECT...'}
                  </div>
                </div>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-[9px] text-primary/60 font-bold tracking-widest uppercase ml-1">NEURAL_ID</label>
                  <div className="relative">
                    <input 
                      className="cyber-input w-full font-mono text-sm pl-10" 
                      placeholder="USER_REF_#" 
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isLoading}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40 material-symbols-outlined text-lg">fingerprint</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] text-primary/60 font-bold tracking-widest uppercase ml-1">ACCESS_CODE</label>
                  <div className="relative">
                    <input 
                      className="cyber-input w-full font-mono text-sm pl-10" 
                      placeholder="••••••••" 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40 material-symbols-outlined text-lg">key</span>
                  </div>
                </div>

                <div className="pt-2 space-y-4">
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary text-black font-display font-bold text-sm py-4 tracking-[0.2em] hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all active:scale-95 neon-glow-cyan disabled:opacity-50"
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)' }}
                  >
                    {isLoading ? 'SYNCING...' : 'SYNC IDENTITY'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t border-l border-secondary"></div>
          <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b border-r border-secondary"></div>
        </main>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 h-10 border-t border-primary/10 bg-background-dark/95 backdrop-blur-md px-6 flex items-center justify-between z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#00FFCC]"></div>
            <span className="text-[9px] text-primary font-bold tracking-widest uppercase">SYSTEM_STATUS: READY</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-mono text-slate-600">
          <span>V_3.0.1</span>
        </div>
      </footer>
    </div>
  );
};
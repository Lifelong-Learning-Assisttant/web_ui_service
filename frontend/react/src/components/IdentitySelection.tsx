import React from 'react';
import { useAppStore } from '../store/appStore';
import { Identity } from '../types';
import { NeuralGraph } from './NeuralGraph';
import { Bolt } from 'lucide-react';

export const IDENTITIES: Identity[] = [
  {
    id: 'ds_man',
    name: 'SENIOR_DATA_SCIENTIST',
    role: 'NEURAL_ARCHITECT',
    avatarUrl: '/images/characters/ds_man.png',
    specialization: 'DEEP_LEARNING_RESEARCH',
    stats: { sync: '99%', latency: '2ms', id_code: 'DS-01' }
  },
  {
    id: 'ds_woman',
    name: 'LEAD_DATA_SCIENTIST',
    role: 'NEURAL_ARCHITECT',
    avatarUrl: '/images/characters/ds_woman.png',
    specialization: 'COMPUTER_VISION_EXPERT',
    stats: { sync: '98%', latency: '3ms', id_code: 'DS-02' }
  },
  {
    id: 'hacker_man',
    name: 'CYBER_SECURITY_OP',
    role: 'SYSTEM_INTRUSION_EXPERT',
    avatarUrl: '/images/characters/hacker_man.png',
    specialization: 'ENCRYPTION_ANALYSIS',
    stats: { sync: '94%', latency: '5ms', id_code: 'SEC-01' }
  },
  {
    id: 'hacker_woman',
    name: 'NEURAL_LINK_BREAKER',
    role: 'SYSTEM_INTRUSION_EXPERT',
    avatarUrl: '/images/characters/hacker_woman.png',
    specialization: 'STEALTH_SIGNAL_ROUTING',
    stats: { sync: '97%', latency: '1ms', id_code: 'SEC-02' }
  },
  {
    id: 'ml_enjeneer_man',
    name: 'ML_INFRA_ENGINEER',
    role: 'INFRASTRUCTURE_GUARD',
    avatarUrl: '/images/characters/ml_enjeneer_man.png',
    specialization: 'DOCKER_ORCHESTRATION',
    stats: { sync: '100%', latency: '8ms', id_code: 'ENG-01' }
  },
  {
    id: 'ml_enjeneer_woman',
    name: 'ML_SYSTEMS_OPTIMIZER',
    role: 'INFRASTRUCTURE_GUARD',
    avatarUrl: '/images/characters/ml_enjeneer_woman.png',
    specialization: 'GPU_COMPUTE_SCALING',
    stats: { sync: '96%', latency: '4ms', id_code: 'ENG-02' }
  },
  {
    id: 'researcher_man',
    name: 'RESEARCH_BROKER',
    role: 'ALGORITHMIC_INTELLIGENCE',
    avatarUrl: '/images/characters/researcher_man.png',
    specialization: 'HEURISTIC_MODELING',
    stats: { sync: '95%', latency: '12ms', id_code: 'RES-01' }
  },
  {
    id: 'resercher_woman',
    name: 'INTELLIGENCE_AGENT',
    role: 'ALGORITHMIC_INTELLIGENCE',
    avatarUrl: '/images/characters/resercher_woman.png',
    specialization: 'NEURAL_PATTERN_RECOGNITION',
    stats: { sync: '92%', latency: '7ms', id_code: 'RES-02' }
  }
];

export const IdentitySelection: React.FC = () => {
  const { selectedIdentity, selectIdentity, confirmIdentity, isLoading } = useAppStore();

  return (
    <div className="bg-background-dark font-display text-white selection:bg-primary/30 min-h-screen relative flex flex-col overflow-hidden">
      <NeuralGraph />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="pt-8 px-10 pb-6 border-b border-primary/20 bg-background-dark/95 backdrop-blur-md">
          <div className="max-w-[1600px] mx-auto flex justify-between items-end">
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] tracking-[0.5em] text-primary font-bold opacity-80 uppercase">TERMINAL_v4.2.0 // CORE_LINK_ESTABLISHED</span>
                <div className="h-[1px] w-32 bg-primary/20"></div>
              </div>
              <h1 className="text-5xl font-bold tracking-tighter text-white uppercase">
                SELECT <span className="text-primary italic">IDENTITY</span>
              </h1>
            </div>
            
            <div className="hidden lg:flex gap-12 items-center pb-1">
              <div className="flex gap-10">
                <div className="flex flex-col border-l-2 border-primary/30 pl-4">
                  <p className="text-[10px] text-primary/60 font-bold tracking-widest uppercase">Neural Sync</p>
                  <p className="text-2xl font-bold text-white tabular-nums">STABLE</p>
                </div>
                <div className="flex flex-col border-l-2 border-accent-lime/40 pl-4">
                  <p className="text-[10px] text-accent-lime/60 font-bold tracking-widest uppercase">Threat Lvl</p>
                  <p className="text-2xl font-bold text-accent-lime">ZERO</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-10 py-10 overflow-auto">
          <div className="max-w-[1600px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {IDENTITIES.map((identity) => (
              <div 
                key={identity.id}
                onClick={() => selectIdentity(identity)}
                className="relative group cursor-pointer aspect-[2/3]"
              >
                <div className={`absolute -inset-[2px] transition-all duration-300 clip-path-chamfer ${
                  selectedIdentity?.id === identity.id 
                    ? 'bg-accent-lime opacity-100 shadow-[0_0_25px_rgba(138,255,0,0.4)]' 
                    : 'bg-primary/30 opacity-50 group-hover:opacity-100 group-hover:bg-primary'
                }`}></div>
                
                <div className="relative bg-background-dark clip-path-chamfer p-[1px] h-full overflow-hidden">
                  <div 
                    className="h-full flex flex-col justify-end relative clip-path-chamfer overflow-hidden bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `linear-gradient(0deg, rgba(0, 0, 0, 0.6) 0%, transparent 50%), url(${identity.avatarUrl})` }}
                  >
                    {selectedIdentity?.id === identity.id && (
                      <div className="absolute top-4 right-4 px-3 py-1 bg-accent-lime text-black text-[10px] font-black italic rounded-sm tracking-[0.2em] shadow-lg z-20">SELECTED</div>
                    )}
                    
                    <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none z-10">
                      <div className="flex justify-between items-start opacity-70">
                        <span className="text-[8px] font-mono text-primary tracking-widest bg-black/50 px-1 border border-primary/30 uppercase">ID: {identity.stats.id_code}</span>
                        <span className="text-[8px] font-mono text-primary tracking-widest bg-black/50 px-1 border border-primary/30 uppercase">SYNC: {identity.stats.sync}</span>
                      </div>
                      
                      <div className="mt-auto">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${selectedIdentity?.id === identity.id ? 'bg-accent-lime' : 'bg-primary'}`}></div>
                          <span className={`text-[12px] font-bold font-mono tracking-[0.2em] uppercase ${
                            selectedIdentity?.id === identity.id ? 'text-accent-lime neon-text-lime' : 'text-primary neon-text-cyan'
                          }`}>
                            {identity.name}
                          </span>
                        </div>
                        <div className={`flex justify-between items-end border-t pt-1 ${
                          selectedIdentity?.id === identity.id ? 'border-accent-lime/40' : 'border-primary/40'
                        }`}>
                          <span className="text-[8px] font-mono text-white/80 tracking-tight uppercase">ROLE: {identity.role}</span>
                          <span className={`text-[8px] font-mono ${
                            selectedIdentity?.id === identity.id ? 'text-accent-lime/80' : 'text-primary/80'
                          }`}>LATENCY: {identity.stats.latency}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>

        <footer className="bg-background-dark border-t border-primary/20 backdrop-blur-xl px-10 py-8 z-10">
          <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-stretch justify-between gap-8">
            <div className="flex-1 flex items-center gap-10 px-8 py-4 rounded-sm border border-primary/20 bg-primary/5">
              <div className="flex flex-col gap-1 min-w-[220px]">
                <div className="flex items-center gap-3">
                  <span className={`text-base font-black uppercase tracking-[0.3em] ${selectedIdentity ? 'text-accent-lime' : 'text-primary/40'}`}>
                    {selectedIdentity ? 'SYNC READY' : 'AWAITING SELECTION'}
                  </span>
                  {selectedIdentity && <span className="w-3 h-3 rounded-full bg-accent-lime shadow-[0_0_10px_rgba(138,255,0,1)]"></span>}
                </div>
                <p className="text-[11px] text-primary/60 font-mono tracking-wider italic">
                  {selectedIdentity ? `IDENTITY_LINK: ${selectedIdentity.id.toUpperCase()} // READY` : 'PLEASE_SELECT_NEURAL_INTERFACE'}
                </p>
              </div>
              <div className="hidden sm:block h-12 w-[1px] bg-primary/20"></div>
              <div className="hidden sm:flex flex-1 flex-col gap-2">
                <div className="flex items-end justify-between">
                  <p className="text-[10px] text-primary/70 font-mono uppercase tracking-[0.2em]">Neural Stream</p>
                  <p className="text-[10px] text-accent-lime font-mono">ENCRYPTED</p>
                </div>
                <div className="flex gap-[2px]">
                  {[0.4, 0.6, 1, 0.4, 0.2, 0.8, 1].map((op, i) => (
                    <div key={i} className="h-1.5 flex-1 bg-accent-lime" style={{ opacity: selectedIdentity ? op : 0.1 }}></div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="md:w-1/3 flex flex-col gap-3">
              <button 
                onClick={confirmIdentity}
                disabled={!selectedIdentity || isLoading}
                className="w-full h-20 bg-primary text-black font-black text-xl tracking-[0.4em] flex items-center justify-center gap-5 clip-path-chamfer hover:bg-white transition-all transform hover:scale-[1.005] active:scale-95 group relative overflow-hidden disabled:opacity-30"
              >
                <Bolt className={`w-8 h-8 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'SYNCING...' : 'CONFIRM SYNC'}
              </button>
              <div className="flex justify-between items-center px-2">
                <div className="flex gap-1.5">
                  <div className="w-6 h-1 bg-primary/30"></div>
                  <div className="w-24 h-1 bg-primary/10"></div>
                  <div className="w-12 h-1 bg-primary/30"></div>
                </div>
                <p className="text-[10px] text-primary/40 font-mono tracking-[0.2em] uppercase">SYSTEM.LOG :: RECEPTOR_READY</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
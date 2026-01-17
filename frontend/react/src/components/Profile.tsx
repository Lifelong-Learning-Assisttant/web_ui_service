import React from 'react';
import { useAppStore } from '../store/appStore';
import { IDENTITIES } from './IdentitySelection'; // Будем экспортировать IDENTITIES для доступа к метаданным
import { Activity, Shield, Zap, Coins, Verified, Star, CheckCircle, Database, AlertTriangle, Settings, MessageSquare, BookOpen, Terminal, User as UserIcon, LogOut } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, selectedIdentity, resetIdentity } = useAppStore();
  
  // Если личность не выбрана в сторе, пытаемся найти её по ID из пользователя
  const identity = selectedIdentity || (user?.identityId ? IDENTITIES.find(i => i.id === user.identityId) : IDENTITIES[0]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background-dark text-slate-300 font-mono h-full">
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 cyber-scroll">
        {/* Header Section */}
        <section className="cyber-border p-6 md:p-10 border-primary/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-20 pointer-events-none">
            <div className="text-[8px] leading-tight text-right uppercase">
              SYS_STATUS: OPTIMAL<br/>
              NEURAL_LOAD: 12%<br/>
              LATENCY: {identity?.stats.latency || '0.002ms'}
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-10 items-center">
            {/* Avatar HUD */}
            <div
              className="relative group-hover:scale-[1.02] transition-transform duration-500 cursor-pointer"
              onClick={resetIdentity}
              title="Click to re-select identity"
            >
              <div className="w-56 h-56 relative overflow-hidden bg-black border border-primary/20">
                <img
                  alt="Netrunner Portrait"
                  className="w-full h-full object-cover grayscale contrast-125 brightness-75 hover:grayscale-0 transition-all duration-700"
                  src={identity?.avatarUrl}
                />
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-primary shadow-[0_0_5px_rgba(0,255,204,1)]"></div>
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-secondary shadow-[0_0_5px_rgba(218,255,0,1)]"></div>
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-secondary/20"></div>
                <div className="absolute left-1/2 top-0 w-[1px] h-full bg-secondary/20"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-primary/40 shadow-[0_0_10px_rgba(0,255,204,0.8)] animate-scan-vertical-slow opacity-50"></div>
              </div>
              <div className="absolute -top-4 -left-4 bg-primary text-black px-2 py-0.5 text-[8px] font-bold uppercase tracking-tighter z-20">ID_VALIDATED</div>
              <div className="absolute -bottom-2 -right-4 bg-secondary text-black px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(218,255,0,0.4)]">Sync_Active</div>
            </div>

            {/* Identity Info */}
            <div className="flex-1 w-full space-y-6">
              <div className="flex flex-col lg:flex-row justify-between items-baseline gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="w-2 h-2 bg-primary animate-pulse"></span>
                    <span className="text-[10px] text-primary font-bold tracking-[0.4em] uppercase">Security Clearance: Omega</span>
                  </div>
                  <h2 className="font-display text-4xl md:text-6xl text-white neon-text-cyan tracking-tighter mb-2 uppercase">USER_ID: {user?.username || 'GHOST'}</h2>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-secondary font-bold tracking-[0.3em] uppercase">{identity?.name || 'Neural Architect'}</div>
                    <div className="h-[1px] w-24 bg-white/10"></div>
                  </div>
                </div>
                <div className="font-display text-5xl md:text-7xl text-secondary italic opacity-80 neon-text-lime">LVL 42</div>
              </div>

              {/* Progress Bar */}
              <div className="pt-2 space-y-3">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-primary uppercase tracking-widest">Neural Link Synchronization</span>
                  <span className="text-slate-400">4500 <span className="text-white">/ 5000 XP</span></span>
                </div>
                <div className="w-full h-3 bg-white/5 border border-white/10 p-[2px]">
                  <div className="bg-gradient-to-r from-primary via-secondary to-secondary h-full shadow-[0_0_20px_rgba(0,255,204,0.3)]" style={{ width: '85%' }}></div>
                </div>
                <div className="flex justify-between text-[8px] text-slate-500 font-mono uppercase">
                  <span>BUFFER_MODE: FAST</span>
                  <span>THROUGHPUT: 1.2 GB/s</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Neural Credits', value: '1,240', trend: '▲', color: 'primary', icon: <Coins className="w-4 h-4" /> },
            { label: 'Daily API Limit', value: '85/100', trend: '', color: 'secondary', icon: <Zap className="w-4 h-4" /> },
            { label: 'Quizzes', value: '128', trend: '12% ▲', color: 'secondary', icon: <Verified className="w-4 h-4" /> },
            { label: 'Total Points', value: '42.5K', trend: '5% ▲', color: 'primary', icon: <Star className="w-4 h-4" /> },
          ].map((stat, i) => (
            <div
              key={i}
              className={`cyber-border p-5 group transition-all duration-300 cursor-crosshair border-white/5 ${
                stat.color === 'primary'
                  ? 'hover:border-primary/60 hover:shadow-[0_0_15px_rgba(0,255,204,0.1)]'
                  : 'hover:border-secondary/60 hover:shadow-[0_0_15px_rgba(218,255,0,0.1)]'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">
                  {stat.icon}
                  {stat.label}
                </div>
              </div>
              <div className={`text-3xl lg:text-4xl font-display text-white transition-all duration-300 ${
                stat.color === 'primary' ? 'group-hover:neon-text-cyan' : 'group-hover:neon-text-lime'
              }`}>
                {stat.value}
                {stat.trend && (
                  <span className={`text-xs ml-2 ${
                    stat.color === 'primary' ? 'text-primary' : 'text-secondary'
                  }`}>
                    {stat.trend}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Analytical & Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8">
          <section className="lg:col-span-7 cyber-border p-8 border-primary/20 bg-surface-dark/40">
            <h3 className="font-display text-xs tracking-[0.5em] text-white uppercase opacity-80 mb-8">Neural Matrix Proficiency</h3>
            <div className="relative h-72 flex items-center justify-center">
              {/* Radar Chart Placeholder SVG */}
              <svg className="w-full h-full max-w-sm overflow-visible" viewBox="0 0 100 100">
                {[10, 20, 30, 40].map(r => (
                  <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="rgba(0,255,204,0.1)" strokeWidth="0.5" />
                ))}
                <path className="drop-shadow-[0_0_8px_rgba(0,255,204,0.5)]" d="M 50 15 L 85 40 L 75 75 L 30 80 L 15 45 Z" fill="rgba(0, 255, 204, 0.1)" stroke="#00FFCC" strokeWidth="1.5" />
                <text className="fill-primary font-bold text-[4px] uppercase tracking-widest" textAnchor="middle" x="50" y="5">Transformer</text>
                <text className="fill-slate-400 text-[3.5px] uppercase tracking-widest" textAnchor="start" x="92" y="52">RAG</text>
                <text className="fill-slate-400 text-[3.5px] uppercase tracking-widest" textAnchor="middle" x="75" y="94">Optimizers</text>
              </svg>
            </div>
          </section>

          <section className="lg:col-span-5 cyber-border p-6 flex flex-col border-secondary/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-4 bg-secondary shadow-[0_0_8px_rgba(218,255,0,0.5)]"></div>
                <h3 className="font-display text-xs tracking-widest uppercase text-white">Transmission Log</h3>
              </div>
              <span className="text-[9px] font-bold text-secondary tracking-tighter animate-pulse">LIVE_FEED</span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
              {[
                { time: '14:02', title: 'Backpropagation_Logic', status: 'Success // +50 XP', color: 'primary', icon: <CheckCircle className="w-4 h-4" /> },
                { time: '12:45', title: 'Vector_DB_Sharding', status: 'Completed // 12 Credits', color: 'secondary', icon: <Database className="w-4 h-4" /> },
                { time: '09:12', title: 'CNN_Stride_Calculation', status: 'Failed // Retry_Avail', color: 'secondary', icon: <AlertTriangle className="w-4 h-4" /> },
              ].map((log, i) => (
                <div key={i} className={`p-3 bg-white/5 border-l-2 border-${log.color} flex items-center justify-between hover:bg-white/10 transition-colors group`}>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-slate-500 font-mono">{log.time}</span>
                    <div className="space-y-0.5">
                      <div className="text-[11px] font-bold text-slate-200 uppercase group-hover:text-primary transition-colors">{log.title}</div>
                      <div className={`text-[9px] font-bold text-${log.color}/80 uppercase`}>{log.status}</div>
                    </div>
                  </div>
                  <div className={`text-${log.color}`}>{log.icon}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export const ActivityBar: React.FC<{ activeTab: string, onTabChange: (tab: string) => void }> = ({ activeTab, onTabChange }) => {
  const { logout } = useAppStore();

  return (
    <nav className="w-16 flex flex-col items-center py-8 gap-10 border-r border-white/10 bg-background-dark shrink-0">
      <button onClick={() => onTabChange('chat')} className={`p-2 transition-all hover:scale-110 ${activeTab === 'chat' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}>
        <MessageSquare className="w-6 h-6" />
      </button>
      <button onClick={() => onTabChange('theory')} className={`p-2 transition-all hover:scale-110 ${activeTab === 'theory' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}>
        <BookOpen className="w-6 h-6" />
      </button>
      <button onClick={() => onTabChange('algos')} className={`p-2 transition-all hover:scale-110 ${activeTab === 'algos' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}>
        <Terminal className="w-6 h-6" />
      </button>
      <button onClick={() => onTabChange('profile')} className={`p-2 transition-all hover:scale-110 ${activeTab === 'profile' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}>
        <UserIcon className="w-6 h-6" />
      </button>
      <div className="mt-auto flex flex-col items-center gap-6">
        <button
          onClick={logout}
          className="p-2 text-slate-500 hover:text-accent-cyan transition-all hover:scale-110 group relative"
          title="Logout System"
        >
          <LogOut className="w-6 h-6" />
          <span className="absolute left-full ml-4 px-2 py-1 bg-black border border-accent-cyan text-accent-cyan text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            TERMINATE_SESSION
          </span>
        </button>
        <button onClick={() => onTabChange('settings')} className={`p-2 transition-colors ${activeTab === 'settings' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}>
          <Settings className="w-6 h-6" />
        </button>
      </div>
    </nav>
  );
};
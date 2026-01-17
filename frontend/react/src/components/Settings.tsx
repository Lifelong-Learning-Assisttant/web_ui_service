import React, { useState, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { PROVIDERS, MODELS_BY_PROVIDER, ProviderId } from '../constants/models'
import { LLMSettings } from '../types'
import { Save, History, Trash2, Cpu, Database, Brain, Info, Settings as SettingsIcon } from 'lucide-react'

export const Settings: React.FC = () => {
  const [sessionInput, setSessionInput] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  
  const { sessionId, setSessionId, isLoading, settings, updateSettings, clearMessages } = useAppStore()
  const [localSettings, setLocalSettings] = useState(settings)

  useEffect(() => {
    setSessionInput(sessionId)
  }, [sessionId])

  const handleSaveSession = async () => {
    if (!sessionInput.trim()) {
      setMessage({ type: 'error', text: 'PLEASE_ENTER_SESSION_ID' })
      return
    }

    try {
      await setSessionId(sessionInput.trim())
      await updateSettings(localSettings)
      setMessage({ type: 'success', text: 'CONFIGURATION_SYNC_COMPLETE' })
    } catch (error) {
      setMessage({ type: 'error', text: 'SYNC_ERROR::ACCESS_DENIED' })
    }
  }

  const handleSettingChange = (service: 'agent' | 'rag' | 'quiz', field: keyof LLMSettings, value: string) => {
    setLocalSettings(prev => {
      const currentServiceSettings = prev[service] as LLMSettings;
      const updatedService = { ...currentServiceSettings, [field]: value };
      
      if (field === 'provider') {
        updatedService.model = MODELS_BY_PROVIDER[value as ProviderId][0].id;
      }
      
      return {
        ...prev,
        [service]: updatedService
      };
    });
  }

  const renderLLMSelect = (service: 'agent' | 'rag' | 'quiz', label: string, icon: React.ReactNode) => {
    const serviceSettings = localSettings[service] as LLMSettings;
    const currentProvider = serviceSettings.provider as ProviderId;
    
    return (
      <div className="cyber-border p-4 bg-black/20 border-white/5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-primary/10 rounded border border-primary/20">
            {icon}
          </div>
          <span className="text-[10px] font-display font-bold text-primary tracking-widest uppercase">{label}</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter ml-1">Provider</label>
            <select 
              value={serviceSettings.provider}
              onChange={(e) => handleSettingChange(service, 'provider', e.target.value)}
              className="w-full bg-black/40 border border-primary/20 rounded p-2 text-xs font-mono text-primary focus:border-primary outline-none appearance-none cursor-pointer"
            >
              {PROVIDERS.map(p => (
                <option key={p.id} value={p.id} className="bg-surface-dark">{p.name}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-1">
            <label className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter ml-1">Model_Node</label>
            <select 
              value={serviceSettings.model}
              onChange={(e) => handleSettingChange(service, 'model', e.target.value)}
              className="w-full bg-black/40 border border-primary/20 rounded p-2 text-xs font-mono text-secondary focus:border-secondary outline-none appearance-none cursor-pointer"
            >
              {MODELS_BY_PROVIDER[currentProvider].map(m => (
                <option key={m.id} value={m.id} className="bg-surface-dark">{m.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background-dark text-slate-300 font-mono p-4 md:p-8 space-y-6 h-full">
      {/* Header */}
      <section className="cyber-border p-6 border-primary/30 bg-surface-dark/40 relative overflow-hidden shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/30 shadow-[0_0_15px_rgba(0,255,204,0.2)]">
            <SettingsIcon className="w-6 h-6 text-primary animate-spin-slow" />
          </div>
          <div>
            <h2 className="font-display text-xl md:text-2xl text-white neon-text-cyan tracking-tighter uppercase">System_Configuration</h2>
            <p className="text-[10px] text-slate-500 font-mono tracking-[0.2em] uppercase">Core // Neural_Link_Parameters</p>
          </div>
        </div>
      </section>

      <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
        {/* Model Section */}
        <div className="grid grid-cols-1 gap-6">
          {renderLLMSelect('agent', 'AI_ORCHESTRATOR', <Cpu className="w-4 h-4 text-primary" />)}
          {renderLLMSelect('rag', 'KNOWLEDGE_BASE_RAG', <Database className="w-4 h-4 text-accent-cyan" />)}
          {renderLLMSelect('quiz', 'QUIZ_ENGINE', <Brain className="w-4 h-4 text-secondary" />)}
        </div>

        {/* Session Control */}
        <div className="cyber-border p-6 border-secondary/20 bg-black/20 space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-secondary shadow-[0_0_8px_#DAFF00]"></div>
            <h3 className="font-display text-xs tracking-[0.3em] text-white uppercase">Session_Terminal</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest px-1">
              <span className="text-slate-500">Active_ID:</span>
              <span className="text-secondary neon-text-lime">{sessionId}</span>
            </div>

            <div className="relative">
              <label className="absolute -top-1.5 left-3 px-1 bg-background-dark text-[8px] font-bold text-primary uppercase tracking-tighter">Enter_Session_ID</label>
              <input 
                className="w-full bg-black/40 border border-primary/20 rounded p-3 text-sm font-mono text-primary focus:border-primary outline-none placeholder-slate-800"
                value={sessionInput}
                onChange={(e) => setSessionInput(e.target.value)}
                placeholder="react_test_link_01"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button 
                onClick={handleSaveSession}
                disabled={isLoading || !sessionInput.trim()}
                className="bg-primary hover:bg-white text-black font-bold py-3 px-4 rounded-sm text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-30"
              >
                <Save className="w-3 h-3" /> Sync_Config
              </button>
              <button 
                onClick={async () => {
                  try {
                    await setSessionId(sessionInput.trim());
                    setMessage({ type: 'success', text: 'HISTORY_FETCH_SUCCESS' });
                  } catch (e) {
                    setMessage({ type: 'error', text: 'FETCH_FAILED' });
                  }
                }}
                disabled={isLoading || !sessionInput.trim()}
                className="border border-secondary/40 hover:bg-secondary/10 text-secondary font-bold py-3 px-4 rounded-sm text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-30"
              >
                <History className="w-3 h-3" /> Pull_History
              </button>
              <button 
                onClick={async () => {
                  if(confirm('PURGE_ALL_DATA?')) {
                    await clearMessages();
                    setMessage({ type: 'info', text: 'MEMORY_PURGED' });
                  }
                }}
                disabled={isLoading}
                className="border border-pulse-red/40 hover:bg-pulse-red/10 text-pulse-red font-bold py-3 px-4 rounded-sm text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-30"
              >
                <Trash2 className="w-3 h-3" /> Purge_Buffer
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="cyber-border p-6 border-white/5 bg-surface-dark/20 relative overflow-hidden group">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-slate-500" />
            <h3 className="font-display text-[10px] tracking-[0.2em] text-slate-400 uppercase">Protocol_Manual</h3>
          </div>
          <div className="text-[11px] text-slate-500 space-y-2 leading-relaxed">
            <p><span className="text-primary font-bold mr-2">{'>'}</span>To sync with existing neural history, enter <span className="text-slate-300">Session_ID</span> and initiate <span className="text-secondary">Pull_History</span>.</p>
            <p><span className="text-primary font-bold mr-2">{'>'}</span>New sessions are initialized by entering a unique identifier and executing <span className="text-primary">Sync_Config</span>.</p>
            <p><span className="text-primary font-bold mr-2">{'>'}</span>Warning: <span className="text-pulse-red">Purge_Buffer</span> will permanently erase local message cache.</p>
          </div>
        </div>

        {/* Feedback Message */}
        {message && (
          <div className={`cyber-border p-4 animate-pulse ${
            message.type === 'error' ? 'border-pulse-red bg-pulse-red/5 text-pulse-red' : 
            message.type === 'success' ? 'border-accent-lime bg-accent-lime/5 text-accent-lime' : 
            'border-primary bg-primary/5 text-primary'
          }`}>
            <div className="flex items-center gap-3 text-[10px] font-bold tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-current"></span>
              {message.text}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
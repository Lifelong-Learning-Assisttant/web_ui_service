import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

import { ChatInterface } from './components/ChatInterface'
import { Features } from './components/Features'
import { Settings } from './components/Settings'
import { Login } from './components/Login'
import { IdentitySelection } from './components/IdentitySelection'
import { Profile, ActivityBar } from './components/Profile'
import { QuizHub } from './components/QuizHub'
import { AlgoLab } from './components/AlgoLab'
import { useAppStore } from './store/appStore'

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab, sessionId, setSessionId, token, user } = useAppStore()

  // Инициализация WebSocket при старте
  React.useEffect(() => {
    if (token) {
      setSessionId(sessionId)
    }
  }, [token])

  if (!token) {
    return <Login />
  }

  if (user && !user.identityId) {
    return <IdentitySelection />
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatInterface />
      case 'features':
        return <Features />
      case 'settings':
        return <Settings />
      case 'profile':
        return <Profile />
      case 'theory':
        return <QuizHub />
      case 'algos':
        return <AlgoLab />
      default:
        return <ChatInterface />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background-dark text-slate-300">
      <ActivityBar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-white/10 bg-surface-dark/90 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-50 sticky top-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">chat_bubble</span>
            <h1 className="font-display text-sm tracking-[0.3em] font-bold text-white uppercase">
              {activeTab === 'chat' ? 'NEURAL_CHAT' : activeTab.toUpperCase()}
            </h1>
          </div>
        </header>
        <div className="flex-1 overflow-auto">
          {renderContent()}
        </div>
        <footer className="h-8 border-t border-white/5 bg-background-dark/95 backdrop-blur-sm flex items-center justify-between px-6 text-[9px] font-mono tracking-wider shrink-0 z-50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(0,255,204,0.6)]"></div>
              <span className="text-primary/80 uppercase">Node: Active-Sync-42</span>
            </div>
            <span className="text-slate-800">|</span>
            <span className="text-slate-500 uppercase">Ping: 12ms</span>
          </div>
          <div className="text-slate-600 font-bold uppercase">
            SYSTEM_V4.2.0-STABLE
          </div>
        </footer>
      </div>
    </div>
  )
}

const App: React.FC = () => {
  return (
    <AppContent />
  )
}

// Mount the app
const root = document.getElementById('root')
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
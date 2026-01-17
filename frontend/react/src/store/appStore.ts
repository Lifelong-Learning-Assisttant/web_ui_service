import { create } from 'zustand'
import { AppState, ChatMessage, AppSettings } from '../types'
import axios from 'axios'
import { wsService } from './websocketService'

const API_BASE_URL = '/api'

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  messages: [],
  isLoading: false,
  selectedFile: null,
  activeTab: 'chat',
  latexEnabled: true,
  sessionId: 'default',
  settings: {
    agent: { provider: 'zai', model: 'glm-4.6v' },
    rag: { provider: 'openai', model: 'gpt-4o-mini' },
    quiz: { provider: 'openai', model: 'gpt-4o-mini' },
    identityId: undefined
  },
  selectedIdentity: null,

  // Actions
  login: async (username, password) => {
    set({ isLoading: true })
    try {
      const formData = new FormData()
      formData.append('username', username)
      formData.append('password', password)
      
      const response = await axios.post(`${API_BASE_URL}/auth/login`, formData)
      const { access_token, user_id, username: loginUsername } = response.data
      
      localStorage.setItem('token', access_token)
      set({ token: access_token, user: { id: user_id, username: loginUsername }, isLoading: false })
      
      // Load user settings after login
      const { loadSettings } = get()
      await loadSettings()
    } catch (error) {
      console.error('Login error:', error)
      set({ isLoading: false })
      throw error
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ token: null, user: null, messages: [] })
  },

  loadSettings: async () => {
    const { user } = get()
    if (!user) return

    try {
      const settingsRes = await axios.get(`${API_BASE_URL}/settings?user_id=${user.id}`)
      if (settingsRes.data && Object.keys(settingsRes.data).length > 0) {
        const loadedSettings = settingsRes.data;
        set({ settings: loadedSettings })
        
        // Если в настройках есть identityId, обновляем его и в объекте пользователя
        if (loadedSettings.identityId) {
          set((state) => ({
            user: state.user ? { ...state.user, identityId: loadedSettings.identityId } : null
          }))
        }
      }
    } catch (e) {
      console.warn('Failed to load user settings')
    }
  },

  setSessionId: async (sessionId: string) => {
    set({ sessionId, isLoading: true })
    
    // Подключаем WebSocket при смене сессии
    wsService.connect(sessionId);
    
    try {
      // Загружаем историю сообщений для новой сессии
      const response = await axios.get(`${API_BASE_URL}/messages?session_id=${sessionId}`)
      
      console.log('Loaded history raw data:', response.data);
      
      if (response.data.messages && response.data.messages.length > 0) {
        // Преобразуем историю в формат ChatMessage
        const historyMessages: ChatMessage[] = []
        
        response.data.messages.forEach((msg: any, index: number) => {
          // Новый формат: {"role": "user"|"agent"|"system", "content": "..."}
          if (typeof msg === 'object' && msg.role && msg.content) {
            const role = msg.role === 'user' ? 'user' : (msg.role === 'agent' || msg.role === 'assistant' ? 'assistant' : 'system')
            
            if (role === 'system') {
              // Системные сообщения - добавляем как отдельный тип
              historyMessages.push({
                id: `history_sys_${index}_${Date.now()}`,
                role: 'assistant',
                content: msg.content,
                timestamp: new Date(Date.now() - (response.data.messages.length - index) * 1000),
                isSystem: true
              })
            } else {
              historyMessages.push({
                id: `history_${index}_${Date.now()}`,
                role: role as 'user' | 'assistant',
                content: msg.content,
                timestamp: new Date(Date.now() - (response.data.messages.length - index) * 1000),
                type: msg.type,
                meta: msg.meta
              })
            }
          }
          // Старый формат для обратной совместимости
          else if (Array.isArray(msg) && msg.length === 2) {
            const role = msg[0] === 'user' ? 'user' : 'assistant'
            historyMessages.push({
              id: `history_${index}_${Date.now()}`,
              role: role,
              content: msg[1],
              timestamp: new Date(Date.now() - (response.data.messages.length - index) * 1000)
            })
          }
          // Формат: строка
          else if (typeof msg === 'string') {
            historyMessages.push({
              id: `history_${index}_${Date.now()}`,
              role: 'assistant',
              content: msg,
              timestamp: new Date(Date.now() - (response.data.messages.length - index) * 1000)
            })
          }
        })
        
        set({ messages: historyMessages })
      } else {
        set({ messages: [] })
      }
    } catch (error) {
      console.error('Error loading session history:', error)
      set({ messages: [] })
    } finally {
      set({ isLoading: false })
    }
    
    set({ sessionId })
  },
  
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const { activeTab, setActiveTab } = get()
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    }
    
    // Если пришел вопрос квиза, переключаем на вкладку теории (квиза)
    if (newMessage.type === 'quizz_question' && activeTab !== 'theory') {
      setActiveTab('theory')
    }
    
    set((state) => ({ messages: [...state.messages, newMessage] }))
  },

  sendMessage: async (content: string, mode?: string) => {
    const { sessionId, settings } = get()
    set({ isLoading: true })
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
      meta: { interaction_mode: mode }
    }
    
    // Add assistant placeholder
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: 'Обрабатываю ваш запрос...',
      timestamp: new Date(),
      isProcessing: true,
    }
    
    // Append new messages to existing history
    set((state) => ({
      messages: [...state.messages, userMessage, assistantMessage]
    }))
    
    try {
      // Use existing backend API endpoint
      const response = await axios.post(`${API_BASE_URL}/agent/run`, {
        question: content,
        session_id: sessionId,
        settings: settings,
        interaction_mode: mode
      })
      
      // Мы больше не ждем фиксированное время и не запрашиваем историю вручную.
      // WebSocket (wsService) сам инициирует обновление истории через setSessionId,
      // когда получит событие final_answer или ошибку.
      set({ isLoading: false })
    } catch (error) {
      console.error('Error sending message:', error)
      set((state) => ({
        messages: state.messages.map(msg =>
          msg.id === assistantMessage.id
            ? { ...msg, content: 'Произошла ошибка при обработке запроса', isProcessing: false }
            : msg
        ),
        isLoading: false
      }))
    }
  },

  executeAction: async (action: string, data?: any) => {
    const { sessionId } = get()
    set({ isLoading: true })
    try {
      // Map actions to backend endpoints
      const actionEndpoints: Record<string, string> = {
        'quick_qa': '/api/quick_qa',
        'quiz_generation': '/api/quiz/generate',
        'web_search': '/api/web/search',
        'telegram_ingest': '/api/telegram/ingest',
        'rag_search': '/api/rag/search'
      }
      
      const endpoint = actionEndpoints[action]
      if (!endpoint) {
        throw new Error(`Unknown action: ${action}`)
      }
      
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, {
        ...data,
        session_id: sessionId
      })
      
      set({ isLoading: false })
      return response.data
    } catch (error) {
      console.error('Error executing action:', error)
      set({ isLoading: false })
      throw error
    }
  },

  uploadFile: async (file: File) => {
    const { sessionId } = get()
    set({ isLoading: true, selectedFile: file })
    const formData = new FormData()
    formData.append('file', file)
    formData.append('session_id', sessionId)
    
    try {
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      set({ isLoading: false })
      return response.data
    } catch (error) {
      console.error('Error uploading file:', error)
      set({ isLoading: false })
      throw error
    }
  },

  setActiveTab: (tab: string) => set({ activeTab: tab }),

  selectIdentity: (identity) => set({ selectedIdentity: identity }),

  confirmIdentity: async () => {
    const { selectedIdentity, user, updateSettings } = get()
    if (!selectedIdentity || !user) return

    set({ isLoading: true })
    try {
      // Сохраняем identityId в общих настройках пользователя через user_service
      await updateSettings({ identityId: selectedIdentity.id });
      
      set((state) => ({
        user: state.user ? { ...state.user, identityId: selectedIdentity.id } : null,
        activeTab: 'chat',
        isLoading: false
      }))
    } catch (error) {
      console.error('Error confirming identity via settings:', error)
      // Fallback: даже если сервер не ответил, пускаем в чат
      set((state) => ({
        user: state.user ? { ...state.user, identityId: selectedIdentity.id } : null,
        activeTab: 'chat',
        isLoading: false
      }))
    }
  },

  resetIdentity: () => {
    set((state) => ({
      user: state.user ? { ...state.user, identityId: undefined } : null,
      selectedIdentity: null,
      activeTab: 'profile' // Ensure we stay on profile to see the selection screen if integrated, but here it triggers the conditional in main.tsx
    }))
  },
  
  setLatexEnabled: (enabled: boolean) => set({ latexEnabled: enabled }),
  
  clearMessages: async () => {
    const { sessionId } = get()
    try {
      await axios.post(`${API_BASE_URL}/session/clear`, { session_id: sessionId })
    } catch (error) {
      console.error('Error clearing messages:', error)
    } finally {
      // Всегда очищаем локальное состояние
      set({ messages: [] })
    }
  },

  endSession: async () => {
    const { sessionId } = get()
    try {
      await axios.post(`${API_BASE_URL}/session/end`, { session_id: sessionId })
    } catch (error) {
      console.error('Error ending session:', error)
    } finally {
      // Всегда очищаем локальное состояние и сбрасываем на дефолтную сессию
      set({ messages: [], sessionId: 'default' })
    }
  },

  updateSettings: async (newSettings: Partial<AppSettings>) => {
    const { settings, user } = get()
    const updatedSettings = { ...settings, ...newSettings }
    set({ settings: updatedSettings, isLoading: true })
    
    try {
      await axios.post(`${API_BASE_URL}/session/settings`, {
        session_id: get().sessionId,
        user_id: user?.id || 'tmp',
        settings: updatedSettings
      })
      set({ isLoading: false })
    } catch (error) {
      console.error('Error updating settings:', error)
      set({ isLoading: false })
      throw error
    }
  },
}))
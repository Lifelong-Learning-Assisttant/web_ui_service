// Types for the application

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isProcessing?: boolean;
  isSystem?: boolean;  // Для системных сообщений (прогресс)
  type?: string;       // Тип сообщения (например, quizz_question)
  meta?: any;          // Метаданные (прогресс квиза и т.д.)
}

export interface ButtonConfig {
  id: string;
  label: string;
  action: string;
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  icon?: string;
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface LLMSettings {
  provider: 'openai' | 'openrouter' | 'mistral' | 'zai';
  model: string;
}

export interface AppSettings {
  agent: LLMSettings;
  rag: LLMSettings;
  quiz: LLMSettings;
  identityId?: string;
}

export interface User {
  id: string;
  username: string;
  identityId?: string;
}

export interface Identity {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  specialization: string;
  stats: {
    sync: string;
    latency: string;
    id_code: string;
  };
}

export interface AppState {
  user: User | null;
  token: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  selectedFile: File | null;
  activeTab: string;
  latexEnabled: boolean;
  sessionId: string;
  settings: AppSettings;
  selectedIdentity: Identity | null;
  
  // Actions
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loadSettings: () => Promise<void>;
  setSessionId: (sessionId: string) => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  selectIdentity: (identity: Identity) => void;
  confirmIdentity: () => Promise<void>;
  resetIdentity: () => void;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  sendMessage: (content: string) => Promise<void>;
  executeAction: (action: string, data?: any) => Promise<any>;
  uploadFile: (file: File) => Promise<any>;
  setActiveTab: (tab: string) => void;
  setLatexEnabled: (enabled: boolean) => void;
  clearMessages: () => Promise<void>;
  endSession: () => Promise<void>;
}
// Types for the application

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isProcessing?: boolean;
  isSystem?: boolean;  // Для системных сообщений (прогресс)
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

export interface AppState {
  messages: ChatMessage[];
  isLoading: boolean;
  selectedFile: File | null;
  activeTab: string;
  latexEnabled: boolean;
  sessionId: string;
  
  // Actions
  setSessionId: (sessionId: string) => Promise<void>;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  sendMessage: (content: string) => Promise<void>;
  executeAction: (action: string, data?: any) => Promise<any>;
  uploadFile: (file: File) => Promise<any>;
  setActiveTab: (tab: string) => void;
  setLatexEnabled: (enabled: boolean) => void;
  clearMessages: () => Promise<void>;
  endSession: () => Promise<void>;
}
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Box } from '@mui/material'

import { Header } from './components/Header'
import { ChatInterface } from './components/ChatInterface'
import { Features } from './components/Features'
import { Settings } from './components/Settings'
import { Login } from './components/Login'
import { useAppStore } from './store/appStore'

// Russian theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
})

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab, sessionId, setSessionId, token } = useAppStore()

  // Инициализация WebSocket при старте
  React.useEffect(() => {
    if (token) {
      setSessionId(sessionId)
    }
  }, [token])

  if (!token) {
    return <Login />
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatInterface />
      case 'features':
        return <Features />
      case 'settings':
        return <Settings />
      default:
        return <ChatInterface />
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header onTabChange={setActiveTab} />
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {renderContent()}
      </Box>
    </Box>
  )
}

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppContent />
    </ThemeProvider>
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
import React, { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material'
import { Save, Upload, History } from '@mui/icons-material'
import { useAppStore } from '../store/appStore'

export const Settings: React.FC = () => {
  const [sessionInput, setSessionInput] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  
  const { sessionId, setSessionId, isLoading } = useAppStore()

  useEffect(() => {
    setSessionInput(sessionId)
  }, [sessionId])

  const handleSaveSession = async () => {
    if (!sessionInput.trim()) {
      setMessage({ type: 'error', text: 'Пожалуйста, введите Session ID' })
      return
    }

    await setSessionId(sessionInput.trim())
    setMessage({ type: 'success', text: `Session ID сохранен: ${sessionInput.trim()}` })
  }

  const handleLoadHistory = async () => {
    if (!sessionInput.trim()) {
      setMessage({ type: 'error', text: 'Пожалуйста, введите Session ID для загрузки истории' })
      return
    }

    try {
      await setSessionId(sessionInput.trim())
      setMessage({ type: 'success', text: `История для сессии "${sessionInput.trim()}" загружена в чат` })
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка при загрузке истории' })
    }
  }

  const handleClearMessages = async () => {
    const { clearMessages } = useAppStore.getState()
    await clearMessages()
    setMessage({ type: 'info', text: 'История сообщений очищена' })
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5', p: 2 }}>
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        bgcolor: 'white', 
        borderBottom: '1px solid #e0e0e0',
        mb: 2,
        borderRadius: 2
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          ⚙️ Настройки сессии
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Управление Session ID и историей сообщений
        </Typography>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Paper sx={{ p: 3, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Session ID
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Текущая сессия: <strong>{sessionId}</strong>
          </Typography>

          <TextField
            fullWidth
            label="Введите Session ID"
            value={sessionInput}
            onChange={(e) => setSessionInput(e.target.value)}
            placeholder="Например: react_test_1"
            sx={{ mb: 2 }}
            disabled={isLoading}
          />

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveSession}
              disabled={isLoading || !sessionInput.trim()}
              startIcon={<Save />}
              sx={{ flex: 1, minWidth: '150px' }}
            >
              Сохранить
            </Button>

            <Button
              variant="outlined"
              color="secondary"
              onClick={handleLoadHistory}
              disabled={isLoading || !sessionInput.trim()}
              startIcon={<History />}
              sx={{ flex: 1, minWidth: '150px' }}
            >
              Загрузить историю
            </Button>

            <Button
              variant="text"
              color="error"
              onClick={handleClearMessages}
              disabled={isLoading}
              sx={{ flex: 1, minWidth: '150px' }}
            >
              Очистить чат
            </Button>
          </Box>

          {isLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, gap: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Загрузка...
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Info Section */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            📖 Инструкция
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Как подключиться к существующей истории:</strong>
          </Typography>
          
          <Typography variant="body2" component="div" sx={{ pl: 2 }}>
            <ul>
              <li>В поле "Session ID" введите ID сессии (например: <code>react_test_1</code>)</li>
              <li>Нажмите "Загрузить историю" - сообщения появятся в чате</li>
              <li>Или нажмите "Сохранить" - переключитесь на эту сессию без загрузки истории</li>
            </ul>
          </Typography>

          <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
            <strong>Создание новой сессии:</strong>
          </Typography>
          
          <Typography variant="body2" component="div" sx={{ pl: 2 }}>
            <ul>
              <li>Введите новый Session ID (например: <code>my_new_session</code>)</li>
              <li>Нажмите "Сохранить"</li>
              <li>Начните общение - все сообщения сохранятся под этим ID</li>
            </ul>
          </Typography>

          <Typography variant="body2" sx={{ mt: 2 }}>
            <strong>Текущие сессии в тестах:</strong> react_test_1, session_1, session_2
          </Typography>
        </Paper>

        {/* Messages */}
        {message && (
          <Box sx={{ mt: 2 }}>
            <Alert 
              severity={message.type === 'error' ? 'error' : message.type === 'success' ? 'success' : 'info'}
              onClose={() => setMessage(null)}
            >
              {message.text}
            </Alert>
          </Box>
        )}
      </Box>
    </Box>
  )
}
import React, { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress
} from '@mui/material'
import { Login as LoginIcon } from '@mui/icons-material'
import { useAppStore } from '../store/appStore'

export const Login: React.FC = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  const { login, isLoading } = useAppStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!username || !password) {
      setError('Введите логин и пароль')
      return
    }

    try {
      await login(username, password)
    } catch (err: any) {
      setError('Ошибка входа. Проверьте учетные данные.')
    }
  }

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      bgcolor: '#f5f5f5' 
    }}>
      <Paper sx={{ p: 4, width: '100%', maxWidth: '400px', borderRadius: 2 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1976d2' }}>
            🎓 Learning Assistant
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Войдите в систему для продолжения
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Имя пользователя"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="normal"
            disabled={isLoading}
          />
          <TextField
            fullWidth
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            disabled={isLoading}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            fullWidth
            variant="contained"
            size="large"
            type="submit"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : <LoginIcon />}
            sx={{ mt: 3 }}
          >
            Войти
          </Button>
        </form>
      </Paper>
    </Box>
  )
}
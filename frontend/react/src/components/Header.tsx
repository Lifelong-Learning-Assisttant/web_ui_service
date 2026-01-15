import React from 'react'
import { AppBar, Toolbar, Typography, Box, IconButton, Chip } from '@mui/material'
import { Chat, Science, Settings } from '@mui/icons-material'
import { useAppStore } from '../store/appStore'

interface HeaderProps {
  onTabChange: (tab: string) => void
}

export const Header: React.FC<HeaderProps> = ({ onTabChange }) => {
  const { activeTab, latexEnabled, setLatexEnabled } = useAppStore()

  const tabs = [
    { id: 'chat', label: 'Чат', icon: <Chat /> },
    { id: 'features', label: 'Функции', icon: <Science /> },
    { id: 'settings', label: 'Настройки', icon: <Settings /> }
  ]

  return (
    <AppBar position="static" sx={{ bgcolor: '#1976d2', boxShadow: 2 }}>
      <Toolbar>
        <Typography 
          variant="h6" 
          sx={{ 
            flexGrow: 1, 
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          🎓 Learning Assistant
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {tabs.map((tab) => (
            <IconButton
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              sx={{
                color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.7)',
                bgcolor: activeTab === tab.id ? 'rgba(255,255,255,0.15)' : 'transparent',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.2)'
                }
              }}
            >
              {tab.icon}
            </IconButton>
          ))}
          
          <Chip 
            label={latexEnabled ? 'LaTeX: ON' : 'LaTeX: OFF'} 
            size="small"
            onClick={() => setLatexEnabled(!latexEnabled)}
            sx={{ 
              ml: 1,
              cursor: 'pointer',
              bgcolor: latexEnabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)'
            }}
          />
        </Box>
      </Toolbar>
    </AppBar>
  )
}
import React from 'react'
import { Box, Grid, Card, CardContent, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import { useAppStore } from '../store/appStore'

const features = [
  {
    id: 'quick-qa',
    title: 'Быстрый Q&A',
    description: 'Мгновенные ответы на вопросы по загруженным материалам',
    icon: '💡',
    color: '#2196f3',
    action: 'quick_qa'
  },
  {
    id: 'quiz',
    title: 'Генерация тестов',
    description: 'Создание тестов и заданий для самопроверки',
    icon: '📝',
    color: '#4caf50',
    action: 'quiz_generation'
  },
  {
    id: 'upload',
    title: 'Загрузка материалов',
    description: 'PDF, DOC, TXT файлы для анализа',
    icon: '📚',
    color: '#ff9800',
    action: 'upload'
  },
  {
    id: 'web-search',
    title: 'Веб-поиск',
    description: 'Дополнительная информация из интернета',
    icon: '🌐',
    color: '#9c27b0',
    action: 'web_search'
  },
  {
    id: 'telegram',
    title: 'Telegram интеграция',
    description: 'Работа с сообщениями из Telegram',
    icon: '✈️',
    color: '#0088cc',
    action: 'telegram_ingest'
  },
  {
    id: 'rag',
    title: 'RAG система',
    description: 'Умный поиск по контексту',
    icon: '🔍',
    color: '#f44336',
    action: 'rag_search'
  }
]

export const Features: React.FC = () => {
  const { executeAction, isLoading, setActiveTab } = useAppStore()

  const handleFeatureClick = async (feature: (typeof features)[0]) => {
    if (feature.action === 'upload') {
      // Trigger file upload via chat interface
      setActiveTab('chat')
      return
    }
    
    try {
      const result = await executeAction(feature.action)
      console.log('Action result:', result)
      setActiveTab('chat')
    } catch (error) {
      console.error('Action failed:', error)
    }
  }

  return (
    <Box sx={{ p: 3, height: '100vh', overflow: 'auto', bgcolor: '#f5f5f5' }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, textAlign: 'center' }}>
        🚀 Возможности системы
      </Typography>
      
      <Grid container spacing={3}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={4} key={feature.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  height: '100%',
                  borderLeft: `4px solid ${feature.color}`,
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
                onClick={() => handleFeatureClick(feature)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ fontSize: '32px', mr: 2 }}>{feature.icon}</Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {feature.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: feature.color, fontWeight: 600 }}>
                      Нажмите для запуска
                    </Typography>
                    {isLoading && (
                      <Box sx={{ color: feature.color }}>⏳</Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4, p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          📋 Быстрые действия
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{ 
              p: 2, 
              bgcolor: '#e8f5e9', 
              borderRadius: 1,
              border: '1px solid #c8e6c9'
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                💬 Чат-интерфейс
              </Typography>
              <Typography variant="body2">
                Задавайте вопросы, загружайте файлы, получайте детальные ответы с формулами и кодом
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ 
              p: 2, 
              bgcolor: '#e3f2fd', 
              borderRadius: 1,
              border: '1px solid #bbdefb'
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                🎯 Интеллектуальные функции
              </Typography>
              <Typography variant="body2">
                Генерация тестов, RAG-поиск, веб-данные и Telegram-интеграция
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}
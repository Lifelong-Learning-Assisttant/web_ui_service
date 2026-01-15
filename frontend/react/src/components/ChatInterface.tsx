import React, { useState, useRef, useEffect } from 'react'
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  IconButton,
  CircularProgress,
  Avatar
} from '@mui/material'
import { Send, Delete, Upload } from '@mui/icons-material'
import { InlineMath } from 'react-katex'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useAppStore } from '../store/appStore'
import { motion, AnimatePresence } from 'framer-motion'

export const ChatInterface: React.FC = () => {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { messages, isLoading, sendMessage, uploadFile, clearMessages, endSession, latexEnabled, sessionId } = useAppStore()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (input.trim() && !isLoading) {
      await sendMessage(input.trim())
      setInput('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        await uploadFile(file)
        // Add message about file upload
        const fileMessage = `Файл "${file.name}" успешно загружен и обработан`
        await sendMessage(fileMessage)
      } catch (error) {
        console.error('Upload failed:', error)
      }
    }
  }

  const formatContent = (content: string) => {
    if (!latexEnabled) return content

    // Convert LaTeX formats: \(...\) -> $...$, \[...\] -> $$...$$
    // Handle both escaped and unescaped formats
    let convertedContent = content
      .replace(/\\\((.*?)\\\)/g, '$1')  // \(...\) -> inline
      .replace(/\\\[(.*?)\\\]/g, '$$1$$')  // \[...\] -> block
      .replace(/\\\((.*?)\\\)/g, '$1')  // \\(...\\) -> inline (double escape)
      .replace(/\\\[(.*?)\\\]/g, '$$1$$')  // \\[...\\] -> block (double escape)
    
    // Split by code blocks first
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    const codeBlocks: string[] = []
    let contentWithoutCode = convertedContent.replace(codeBlockRegex, (match) => {
      codeBlocks.push(match)
      return `__CODE_BLOCK_${codeBlocks.length - 1}__`
    })
    
    // Split by LaTeX patterns
    const parts = contentWithoutCode.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g)
    
    return parts.map((part, partIndex) => {
      // Restore code blocks
      if (part.includes('__CODE_BLOCK_')) {
        const codeBlockIndex = parseInt(part.match(/__CODE_BLOCK_(\d+)__/)?.[1] || '0')
        const codeBlock = codeBlocks[codeBlockIndex]
        const codeMatch = codeBlock.match(/```(\w+)?\n([\s\S]*?)```/)
        if (codeMatch) {
          const language = codeMatch[1] || 'text'
          const code = codeMatch[2]
          return (
            <SyntaxHighlighter key={`code-${partIndex}`} language={language} style={atomDark}>
              {code}
            </SyntaxHighlighter>
          )
        }
      }
      
      // Block math: $$...$$
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const math = part.slice(2, -2).trim()
        return <Box key={`math-${partIndex}`} sx={{ my: 1, textAlign: 'center' }}><InlineMath math={math} /></Box>
      }
      
      // Inline math: $...$
      if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        const math = part.slice(1, -1).trim()
        const hasComplexCommands = /\\[a-z]+|\\_|\^|\\frac|\\sum|\\int|\\begin|\\end/.test(math)
        
        if (hasComplexCommands) {
          return <Box key={`math-${partIndex}`} sx={{ my: 1 }}><InlineMath math={math} /></Box>
        }
        
        return <InlineMath key={`math-${partIndex}`} math={math} />
      }
      
      // Regular text - process Markdown formatting
      return processMarkdownText(part, partIndex)
    })
  }

  const processMarkdownText = (text: string, partIndex: number) => {
    // Split by lines to preserve line breaks
    const lines = text.split('\n')
    
    return lines.map((line, lineIndex) => {
      if (!line.trim()) {
        return <br key={`${partIndex}-${lineIndex}`} />
      }
      
      // Check for headers: # Header, ## Header, etc.
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/)
      if (headerMatch) {
        const level = headerMatch[1].length
        const headerText = headerMatch[2]
        const fontSize = [24, 20, 18, 16, 14, 12][level - 1]
        const fontWeight = level <= 2 ? 700 : 600
        
        // Process inline formatting within header
        const headerContent = processInlineMarkdown(headerText, partIndex, lineIndex)
        
        return (
          <Typography
            key={`${partIndex}-${lineIndex}`}
            variant="h6"
            sx={{
              fontSize: `${fontSize}px`,
              fontWeight: fontWeight,
              my: 1,
              color: level === 1 ? '#1976d2' : level === 2 ? '#2e7d32' : 'inherit'
            }}
          >
            {headerContent}
          </Typography>
        )
      }
      
      // Process inline Markdown: **bold**, *italic*, `code`
      const inlineContent = processInlineMarkdown(line, partIndex, lineIndex)
      
      return <React.Fragment key={`${partIndex}-${lineIndex}`}>{inlineContent}{lineIndex < lines.length - 1 && <br />}</React.Fragment>
    })
  }

  const processInlineMarkdown = (text: string, partIndex: number, lineIndex: number) => {
    const segments: React.ReactNode[] = []
    let remaining = text
    let keyCounter = 0
    
    // Bold: **text**
    const boldRegex = /\*\*(.+?)\*\*/g
    // Italic: *text*
    const italicRegex = /\*(.+?)\*/g
    // Inline code: `text`
    const codeRegex = /`(.+?)`/g
    
    // Process bold first (longer match)
    const boldParts = remaining.split(boldRegex)
    
    boldParts.forEach((part, idx) => {
      if (idx % 2 === 1) {
        // Bold content
        segments.push(<strong key={`${partIndex}-${lineIndex}-bold-${keyCounter++}`}>{part}</strong>)
      } else {
        // Check for italic and code in non-bold parts
        let subPart = part
        const italicParts = subPart.split(italicRegex)
        
        italicParts.forEach((iPart, iIdx) => {
          if (iIdx % 2 === 1) {
            // Italic content
            segments.push(<em key={`${partIndex}-${lineIndex}-italic-${keyCounter++}`}>{iPart}</em>)
          } else {
            // Check for code
            const codeParts = iPart.split(codeRegex)
            codeParts.forEach((cPart, cIdx) => {
              if (cIdx % 2 === 1) {
                // Code content
                segments.push(<code key={`${partIndex}-${lineIndex}-code-${keyCounter++}`} style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '2px 4px',
                  borderRadius: '3px',
                  fontFamily: 'monospace',
                  fontSize: '0.9em'
                }}>{cPart}</code>)
              } else if (cPart) {
                segments.push(cPart)
              }
            })
          }
        })
      }
    })
    
    return segments
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <Box sx={{
        p: 2,
        bgcolor: 'white',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          🤖 Learning Assistant
        </Typography>
        <Box>
          <IconButton onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
            <Upload />
          </IconButton>
          <IconButton onClick={clearMessages} disabled={messages.length === 0}>
            <Delete />
          </IconButton>
          <Button
            variant="outlined"
            color="error"
            onClick={async () => {
              if (confirm('Завершить сессию и удалить всю историю?')) {
                await endSession()
              }
            }}
            disabled={isLoading}
            sx={{ ml: 1 }}
          >
            Завершить сессию
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
            accept=".pdf,.txt,.doc,.docx,.md"
          />
        </Box>
      </Box>
      
      {/* Session Info Bar */}
      <Box sx={{
        p: 1,
        px: 2,
        bgcolor: '#f0f4f8',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="caption" color="text.secondary">
          Сессия: <strong>{sessionId}</strong>
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {messages.length} сообщений
        </Typography>
      </Box>

      {/* Messages Area */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}>
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  bgcolor: message.isSystem ? '#f5f5f5' : (message.role === 'user' ? '#e3f2fd' : 'white'),
                  borderLeft: message.isSystem ? '4px solid #9e9e9e' : (message.role === 'user' ? '4px solid #2196f3' : '4px solid #4caf50'),
                  borderRadius: 2,
                  opacity: message.isSystem ? 0.8 : 1
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Avatar
                    src={message.role === 'assistant' && !message.isSystem ? '/images/assistant_icon_small.png' : undefined}
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: message.isSystem ? '#9e9e9e' : (message.role === 'user' ? '#2196f3' : '#4caf50'),
                      fontSize: '16px',
                      '& img': {
                        objectFit: 'cover'
                      }
                    }}
                  >
                    {message.isSystem ? 'ℹ️' : (message.role === 'user' ? '👤' : '🤖')}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {message.isSystem ? 'ℹ️ Система' : (message.role === 'user' ? 'Вы' : '🤖 Ассистент')}
                    </Typography>
                    <Box sx={{ fontSize: '15px', lineHeight: 1.6 }}>
                      {message.isProcessing ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CircularProgress size={16} />
                          <Typography variant="body2" color="text.secondary">
                            Обрабатывается...
                          </Typography>
                        </Box>
                      ) : (
                        formatContent(message.content)
                      )}
                    </Box>
                    <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                      {message.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box sx={{ 
        p: 2, 
        bgcolor: 'white', 
        borderTop: '1px solid #e0e0e0',
        display: 'flex',
        gap: 1,
        alignItems: 'flex-end'
      }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Введите сообщение..."
          disabled={isLoading}
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
        />
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          sx={{
            minWidth: 56,
            height: 56,
            borderRadius: 2,
            px: 2
          }}
        >
          {isLoading ? <CircularProgress size={24} color="inherit" /> : <Send />}
        </Button>
      </Box>
    </Box>
  )
}
import React, { useEffect, useState } from 'react'
import { 
  Container, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Paper,
  Button,
  Box,
  Divider,
  Snackbar,
  Alert,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  useTheme,
  alpha,
  Fade,
  Tooltip
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

interface ClipboardItem {
  type: 'text' | 'image'
  content: string
  timestamp: string
  imageUrl?: string
  hash?: string
}

declare global {
  interface Window {
    electronAPI: {
      getClipboardHistory: () => Promise<ClipboardItem[]>
      clearClipboardHistory: () => Promise<void>
      onClipboardUpdate: (callback: (data: ClipboardItem) => void) => void
      setClipboardContent: (item: ClipboardItem) => Promise<boolean>
    }
  }
}

function App() {
  const theme = useTheme()
  const [history, setHistory] = useState<ClipboardItem[]>([])
  const [showCopied, setShowCopied] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    // Load initial history
    const loadHistory = async () => {
      try {
        const data = await window.electronAPI.getClipboardHistory()
        const sortedData = [...data].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        setHistory(sortedData)
      } catch (error) {
        console.error('Error loading history:', error)
        setErrorMessage('Failed to load clipboard history')
      }
    }
    loadHistory()

    window.electronAPI.onClipboardUpdate((newItem) => {
      setHistory(prev => {
        const filteredHistory = prev.filter(item => 
          item.type !== newItem.type || 
          (item.type === 'text' ? item.content !== newItem.content : item.hash !== newItem.hash)
        )
        return [newItem, ...filteredHistory]
      })
    })
  }, [])

  const handleClearHistory = async () => {
    try {
      await window.electronAPI.clearClipboardHistory()
      setHistory([])
    } catch (error) {
      console.error('Error clearing history:', error)
      setErrorMessage('Failed to clear clipboard history')
    }
  }

  const handleItemClick = async (item: ClipboardItem) => {
    try {
      const success = await window.electronAPI.setClipboardContent(item)
      if (success) {
        setShowCopied(true)
      } else {
        setErrorMessage('Failed to copy item to clipboard')
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      setErrorMessage('Failed to copy item to clipboard')
    }
  }

  const handleSnackbarClose = () => {
    setShowCopied(false)
  }

  const handleErrorClose = () => {
    setErrorMessage(null)
  }

  const renderClipboardItem = (item: ClipboardItem) => {
    if (item.type === 'image' && item.imageUrl) {
      return (
        <Box sx={{ width: '100%', p: 1 }}>
          <Card 
            elevation={0}
            sx={{ 
              bgcolor: 'background.paper',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.01)',
                boxShadow: theme.shadows[4]
              }
            }}
          >
            <CardMedia
              component="img"
              image={item.imageUrl}
              alt="Clipboard image"
              sx={{ 
                height: 200,
                objectFit: 'contain',
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                borderRadius: 1
              }}
              onError={() => {
                console.error('Error loading image:', item.imageUrl)
                setErrorMessage('Failed to load image')
              }}
            />
            <CardContent sx={{ py: 1, px: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Typography variant="caption" color="text.secondary">
                  {new Date(item.timestamp).toLocaleString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )
    }
    return (
      <Box sx={{ width: '100%', px: 2 }}>
        <Typography 
          sx={{ 
            mb: 1,
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {item.content}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {new Date(item.timestamp).toLocaleString()}
          </Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ 
        my: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 3
      }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography 
            variant="h4" 
            component="h1"
            sx={{ 
              fontWeight: 'medium',
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent'
            }}
          >
            Kumbuka
          </Typography>
          <Tooltip title="Clear History">
            <IconButton 
              onClick={handleClearHistory}
              color="error"
              sx={{ 
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'scale(1.1)'
                }
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Paper 
          elevation={0}
          sx={{ 
            borderRadius: 2,
            bgcolor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(10px)'
          }}
        >
          <List sx={{ p: 0 }}>
            {history.length === 0 ? (
              <ListItem>
                <ListItemText 
                  primary={
                    <Typography color="text.secondary" align="center">
                      No clipboard history yet
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary" align="center" display="block">
                      Copy something to see it appear here
                    </Typography>
                  }
                />
              </ListItem>
            ) : (
              history.map((item, index) => (
                <Fade key={item.timestamp} in={true} timeout={300}>
                  <Box>
                    <ListItem
                      sx={{
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.05),
                        },
                        '&:hover .copy-button': {
                          opacity: 1
                        }
                      }}
                    >
                      <Box sx={{ flexGrow: 1 }}>
                        {renderClipboardItem(item)}
                      </Box>
                      <Tooltip title="Copy to Clipboard">
                        <IconButton 
                          className="copy-button"
                          onClick={() => handleItemClick(item)}
                          sx={{ 
                            opacity: 0,
                            transition: 'all 0.2s',
                            ml: 1
                          }}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </ListItem>
                    {index < history.length - 1 && (
                      <Divider sx={{ opacity: 0.5 }} />
                    )}
                  </Box>
                </Fade>
              ))
            )}
          </List>
        </Paper>
      </Box>

      <Snackbar
        open={showCopied}
        autoHideDuration={2000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          Copied to clipboard!
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!errorMessage}
        autoHideDuration={4000}
        onClose={handleErrorClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleErrorClose} 
          severity="error" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default App 
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
  Tooltip,
  useMediaQuery,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import { motion, AnimatePresence } from 'framer-motion'

interface ClipboardItem {
  type: 'text' | 'image'
  content: string
  timestamp: string
  imageUrl?: string
  hash?: string
  locked: boolean
}

declare global {
  interface Window {
    electronAPI: {
      getClipboardHistory: () => Promise<ClipboardItem[]>
      clearClipboardHistory: () => Promise<void>
      onClipboardUpdate: (callback: (data: ClipboardItem) => void) => void
      setClipboardContent: (item: ClipboardItem) => Promise<boolean>
      deleteClipboardItem: (timestamp: string) => Promise<void>
      toggleLockItem: (timestamp: string) => Promise<ClipboardItem>
    }
  }
}

function App() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [history, setHistory] = useState<ClipboardItem[]>([])
  const [showCopied, setShowCopied] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'all' | 'locked'>('all')

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
      // Only remove unlocked items from the UI
      setHistory(prev => prev.filter(item => item.locked))
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

  const handleDeleteItem = async (timestamp: string, event: React.MouseEvent) => {
    event.stopPropagation()
    try {
      await window.electronAPI.deleteClipboardItem(timestamp)
      setHistory(prev => prev.filter(item => item.timestamp !== timestamp))
    } catch (error) {
      console.error('Error deleting item:', error)
      setErrorMessage('Failed to delete item')
    }
  }

  const handleToggleLock = async (timestamp: string, event: React.MouseEvent) => {
    event.stopPropagation()
    try {
      const updatedItem = await window.electronAPI.toggleLockItem(timestamp)
      setHistory(prev => prev.map(item => 
        item.timestamp === timestamp ? { ...item, locked: updatedItem.locked } : item
      ))
    } catch (error) {
      console.error('Error toggling lock:', error)
      setErrorMessage('Failed to toggle lock state')
    }
  }

  const filteredHistory = viewMode === 'all' 
    ? history 
    : history.filter(item => item.locked)

  const renderClipboardItem = (item: ClipboardItem) => {
    if (item.type === 'image' && item.imageUrl) {
      return (
        <Card 
          elevation={0}
          sx={{ 
            bgcolor: alpha(theme.palette.background.paper, 0.7),
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.1)}`,
              borderColor: alpha(theme.palette.primary.main, 0.2)
            }
          }}
        >
          <CardMedia
            component="img"
            image={item.imageUrl}
            alt="Clipboard image"
            sx={{ 
              height: 120,
              objectFit: 'contain',
              bgcolor: alpha(theme.palette.primary.main, 0.03),
              borderRadius: '4px 4px 0 0'
            }}
          />
          <CardContent sx={{ 
            py: 1, 
            px: 1.5,
            '&:last-child': { pb: 1 },
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: '50%' }}>
              {new Date(item.timestamp).toLocaleString()}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title={item.locked ? "Unlock" : "Lock"}>
                <IconButton 
                  onClick={(e) => handleToggleLock(item.timestamp, e)}
                  size="small"
                  className="action-button"
                  color={item.locked ? "primary" : "default"}
                  sx={{ 
                    padding: 0.5,
                    opacity: { xs: 1, sm: 0 },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }}
                >
                  {item.locked ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <span>
                  <IconButton 
                    onClick={(e) => handleDeleteItem(item.timestamp, e)}
                    size="small"
                    className="action-button"
                    disabled={item.locked}
                    sx={{ 
                      padding: 0.5,
                      opacity: { xs: 1, sm: 0 },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.error.main, 0.1),
                        color: theme.palette.error.main
                      }
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Copy to Clipboard">
                <IconButton 
                  onClick={() => handleItemClick(item)}
                  size="small"
                  className="action-button"
                  sx={{ 
                    padding: 0.5,
                    opacity: { xs: 1, sm: 0 },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </CardContent>
        </Card>
      )
    }
    return (
      <Card
        elevation={0}
        sx={{
          bgcolor: alpha(theme.palette.background.paper, 0.7),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.1)}`,
            borderColor: alpha(theme.palette.primary.main, 0.2)
          }
        }}
      >
        <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
            <Typography 
              sx={{ 
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: theme.palette.text.primary,
                flex: 1,
                maxHeight: '100px',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {item.content}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
              <Tooltip title={item.locked ? "Unlock" : "Lock"}>
                <IconButton 
                  onClick={(e) => handleToggleLock(item.timestamp, e)}
                  size="small"
                  className="action-button"
                  color={item.locked ? "primary" : "default"}
                  sx={{ 
                    padding: 0.5,
                    opacity: { xs: 1, sm: 0 },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }}
                >
                  {item.locked ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <span>
                  <IconButton 
                    onClick={(e) => handleDeleteItem(item.timestamp, e)}
                    size="small"
                    className="action-button"
                    disabled={item.locked}
                    sx={{ 
                      padding: 0.5,
                      opacity: { xs: 1, sm: 0 },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.error.main, 0.1),
                        color: theme.palette.error.main
                      }
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Copy to Clipboard">
                <IconButton 
                  onClick={() => handleItemClick(item)}
                  size="small"
                  className="action-button"
                  sx={{ 
                    padding: 0.5,
                    opacity: { xs: 1, sm: 0 },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end',
            mt: 1,
            pt: 1,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}>
            <Typography variant="caption" color="text.secondary" noWrap>
              {new Date(item.timestamp).toLocaleString()}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <Container 
      maxWidth={false} 
      disableGutters 
      sx={{ 
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: alpha(theme.palette.background.default, 0.8),
        backdropFilter: 'blur(10px)'
      }}
    >
      <Box sx={{ 
        p: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
      }}>
        <Typography 
          variant="h6" 
          component="h1"
          sx={{ 
            fontWeight: 600,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            letterSpacing: '-0.02em'
          }}
        >
          Kumbuka
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newValue) => newValue && setViewMode(newValue)}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                bgcolor: alpha(theme.palette.background.paper, 0.7),
                backdropFilter: 'blur(10px)',
                color: theme.palette.text.secondary,
                py: 0.5,
                '&.Mui-selected': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                  }
                },
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                }
              }
            }}
          >
            <ToggleButton value="all" size="small">
              All
            </ToggleButton>
            <ToggleButton value="locked" size="small">
              <LockIcon sx={{ fontSize: '1rem' }} />
            </ToggleButton>
          </ToggleButtonGroup>
          <Tooltip title="Clear History">
            <IconButton 
              onClick={handleClearHistory}
              color="error"
              size="small"
              sx={{ 
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'scale(1.1) rotate(90deg)',
                  bgcolor: alpha(theme.palette.error.main, 0.1)
                }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ 
        flex: 1, 
        overflowY: 'auto',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: alpha(theme.palette.primary.main, 0.2),
          borderRadius: '4px',
          '&:hover': {
            background: alpha(theme.palette.primary.main, 0.3),
          }
        }
      }}>
        <AnimatePresence>
          {filteredHistory.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography 
                  variant="body1" 
                  color="text.secondary" 
                  sx={{ mb: 1 }}
                >
                  {viewMode === 'all' 
                    ? 'No clipboard history yet'
                    : 'No locked items'}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                >
                  {viewMode === 'all'
                    ? 'Copy something to see it appear here'
                    : 'Lock some items to see them here'}
                </Typography>
              </Box>
            </motion.div>
          ) : (
            <List sx={{ py: 1 }}>
              {filteredHistory.map((item, index) => (
                <motion.div
                  key={item.timestamp}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <ListItem
                    sx={{
                      p: 1,
                      '&:hover .action-button': {
                        opacity: 1
                      }
                    }}
                  >
                    {renderClipboardItem(item)}
                  </ListItem>
                </motion.div>
              ))}
            </List>
          )}
        </AnimatePresence>
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
          sx={{ 
            bgcolor: alpha(theme.palette.success.main, 0.9),
            backdropFilter: 'blur(10px)',
            color: 'white'
          }}
        >
          Copied to clipboard!
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={handleErrorClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleErrorClose} 
          severity="error"
          sx={{ 
            bgcolor: alpha(theme.palette.error.main, 0.9),
            backdropFilter: 'blur(10px)',
            color: 'white'
          }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default App 
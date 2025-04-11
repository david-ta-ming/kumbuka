import React, { useEffect, useState } from 'react'
import { 
  Container,
  Snackbar,
  Alert,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material'
import { Header } from './components/Header'
import { ClipboardList } from './components/ClipboardList'

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
  const [history, setHistory] = useState<ClipboardItem[]>([])
  const [showCopied, setShowCopied] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'all' | 'locked'>('all')
  const [showClearDialog, setShowClearDialog] = useState(false)

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
    setShowClearDialog(true)
  }

  const handleConfirmClear = async () => {
    try {
      await window.electronAPI.clearClipboardHistory()
      // Only remove unlocked items from the UI
      setHistory(prev => prev.filter(item => item.locked))
      setShowClearDialog(false)
    } catch (error) {
      console.error('Error clearing history:', error)
      setErrorMessage('Failed to clear clipboard history')
      setShowClearDialog(false)
    }
  }

  const handleCancelClear = () => {
    setShowClearDialog(false)
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
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onClearHistory={handleClearHistory}
      />

      <ClipboardList
        items={filteredHistory}
        viewMode={viewMode}
        onCopy={handleItemClick}
        onDelete={handleDeleteItem}
        onToggleLock={handleToggleLock}
      />

      <Dialog
        open={showClearDialog}
        onClose={handleCancelClear}
        PaperProps={{
          sx: {
            bgcolor: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: 'blur(10px)',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle>
          Clear Clipboard History
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to clear all unlocked items from your clipboard history? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelClear} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmClear} 
            color="error"
            variant="contained"
          >
            Clear History
          </Button>
        </DialogActions>
      </Dialog>

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
import React from 'react'
import {
  Box,
  List,
  ListItem,
  Typography,
  useTheme,
  alpha
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardItem } from './ClipboardItem'

interface ClipboardListProps {
  items: Array<{
    type: 'text' | 'image'
    content: string
    timestamp: string
    imageUrl?: string
    hash?: string
    locked: boolean
  }>
  viewMode: 'all' | 'locked'
  onCopy: (item: ClipboardListProps['items'][0]) => void
  onDelete: (timestamp: string, event: React.MouseEvent) => void
  onToggleLock: (timestamp: string, event: React.MouseEvent) => void
}

export const ClipboardList: React.FC<ClipboardListProps> = ({
  items,
  viewMode,
  onCopy,
  onDelete,
  onToggleLock
}) => {
  const theme = useTheme()

  return (
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
        {items.length === 0 ? (
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
            {items.map((item, index) => (
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
                    width: '100%',
                    '&:hover .action-button': {
                      opacity: 1
                    }
                  }}
                >
                  <ClipboardItem
                    item={item}
                    onCopy={onCopy}
                    onDelete={onDelete}
                    onToggleLock={onToggleLock}
                  />
                </ListItem>
              </motion.div>
            ))}
          </List>
        )}
      </AnimatePresence>
    </Box>
  )
} 
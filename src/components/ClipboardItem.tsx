import React, { useState } from 'react'
import { 
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  IconButton,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import { ImageModal } from './ImageModal'

interface ClipboardItemProps {
  item: {
    type: 'text' | 'image'
    content: string
    timestamp: string
    imageUrl?: string
    hash?: string
    locked: boolean
  }
  onCopy: (item: ClipboardItemProps['item']) => void
  onDelete: (timestamp: string, event: React.MouseEvent) => void
  onToggleLock: (timestamp: string, event: React.MouseEvent) => void
}

export const ClipboardItem: React.FC<ClipboardItemProps> = ({
  item,
  onCopy,
  onDelete,
  onToggleLock
}) => {
  const theme = useTheme()
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)

  const ActionButtons = () => (
    <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
      <Tooltip title={item.locked ? "Unlock" : "Lock"}>
        <span>
          <IconButton 
            onClick={(e) => onToggleLock(item.timestamp, e)}
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
        </span>
      </Tooltip>
      <Tooltip title="Delete">
        <span>
          <IconButton 
            onClick={(e) => onDelete(item.timestamp, e)}
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
        <span>
          <IconButton 
            onClick={() => onCopy(item)}
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
        </span>
      </Tooltip>
    </Box>
  )

  if (item.type === 'image' && item.imageUrl) {
    return (
      <>
        <Card 
          elevation={0}
          sx={{ 
            width: '100%',
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
            onClick={() => setIsImageModalOpen(true)}
            sx={{ 
              height: 120,
              objectFit: 'contain',
              bgcolor: alpha(theme.palette.primary.main, 0.03),
              borderRadius: '4px 4px 0 0',
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.9
              }
            }}
          />
          <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color="text.secondary" noWrap>
                {new Date(item.timestamp).toLocaleString()}
              </Typography>
              <ActionButtons />
            </Box>
          </CardContent>
        </Card>
        <ImageModal
          open={isImageModalOpen}
          imageUrl={item.imageUrl}
          onClose={() => setIsImageModalOpen(false)}
        />
      </>
    )
  }

  return (
    <Card
      elevation={0}
      sx={{
        width: '100%',
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
            mb: 1
          }}
        >
          {item.content}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary" noWrap>
            {new Date(item.timestamp).toLocaleString()}
          </Typography>
          <ActionButtons />
        </Box>
      </CardContent>
    </Card>
  )
} 
import React from 'react'
import {
  Dialog,
  DialogContent,
  IconButton,
  useTheme,
  alpha,
  Box
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

interface ImageModalProps {
  open: boolean
  imageUrl: string
  onClose: () => void
}

export const ImageModal: React.FC<ImageModalProps> = ({
  open,
  imageUrl,
  onClose
}) => {
  const theme = useTheme()

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative'
        }
      }}
    >
      <DialogContent sx={{ p: 0, position: 'relative' }}>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '60px',
            background: `linear-gradient(to bottom, ${alpha(theme.palette.background.paper, 0.8)}, transparent)`,
            pointerEvents: 'none',
            zIndex: 1
          }}
        />
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            bgcolor: alpha(theme.palette.background.paper, 0.9),
            color: theme.palette.text.primary,
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            zIndex: 2,
            '&:hover': {
              bgcolor: theme.palette.background.paper,
              transform: 'scale(1.1)'
            },
            transition: 'all 0.2s ease-in-out'
          }}
        >
          <CloseIcon />
        </IconButton>
        <img
          src={imageUrl}
          alt="Enlarged clipboard image"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block'
          }}
        />
      </DialogContent>
    </Dialog>
  )
} 
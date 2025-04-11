import React from 'react'
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
  alpha
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import LockIcon from '@mui/icons-material/Lock'

interface HeaderProps {
  viewMode: 'all' | 'locked'
  onViewModeChange: (mode: 'all' | 'locked') => void
  onClearHistory: () => void
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  onClearHistory
}) => {
  const theme = useTheme()

  return (
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
          onChange={(e, newValue) => newValue && onViewModeChange(newValue)}
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
            onClick={onClearHistory}
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
  )
} 
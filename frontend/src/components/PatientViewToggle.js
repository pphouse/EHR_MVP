import React, { useState } from 'react';
import {
  Box,
  Switch,
  FormControlLabel,
  Paper,
  Typography,
  Fade,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  RotateLeft as RotateIcon,
} from '@mui/icons-material';

const PatientViewToggle = ({ onToggle, defaultView = 'doctor' }) => {
  const [viewMode, setViewMode] = useState(defaultView);
  const [isRotating, setIsRotating] = useState(false);

  const handleToggle = (event) => {
    const newMode = event.target.checked ? 'patient' : 'doctor';
    setViewMode(newMode);
    onToggle(newMode);
  };

  const handleRotateScreen = () => {
    setIsRotating(true);
    // 画面回転のアニメーション
    setTimeout(() => {
      setIsRotating(false);
    }, 500);
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        position: 'fixed',
        bottom: 20,
        right: 20,
        p: 2,
        zIndex: 1200,
        minWidth: 200
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <FormControlLabel
          control={
            <Switch 
              checked={viewMode === 'patient'}
              onChange={handleToggle}
              color="primary"
            />
          }
          label={
            <Box display="flex" alignItems="center" gap={1}>
              {viewMode === 'patient' ? (
                <>
                  <VisibilityIcon />
                  <Typography variant="body2">患者様画面</Typography>
                </>
              ) : (
                <>
                  <VisibilityOffIcon />
                  <Typography variant="body2">医師画面</Typography>
                </>
              )}
            </Box>
          }
        />
        
        {viewMode === 'patient' && (
          <Tooltip title="画面を回転">
            <IconButton 
              size="small" 
              onClick={handleRotateScreen}
              sx={{
                animation: isRotating ? 'rotate 0.5s ease-in-out' : 'none',
                '@keyframes rotate': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(180deg)' }
                }
              }}
            >
              <RotateIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Fade in={viewMode === 'patient'}>
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ display: 'block', mt: 1 }}
        >
          患者様に画面をお見せする際は、
          こちらをONにしてください
        </Typography>
      </Fade>
    </Paper>
  );
};

export default PatientViewToggle;
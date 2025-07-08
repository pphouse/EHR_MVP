import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  Slider,
  FormControlLabel,
  Button,
  Grid,
  Divider,
} from '@mui/material';
import {
  VolumeUp,
  VolumeOff,
  PlayArrow,
} from '@mui/icons-material';
import { useNotificationSound } from '../hooks/useNotificationSound';

const NotificationSettings = () => {
  const {
    playSuccess,
    playError,
    playWarning,
    playInfo,
    playSave,
    playLogin,
    playLogout,
    playNewPatient,
    playNewEncounter,
    playBeep,
    setEnabled,
    setVolume,
  } = useNotificationSound();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volumeLevel, setVolumeLevel] = useState(0.3);

  useEffect(() => {
    // Load settings from localStorage
    const enabled = localStorage.getItem('notificationSoundEnabled');
    const volume = localStorage.getItem('notificationSoundVolume');
    
    if (enabled !== null) {
      setSoundEnabled(enabled === 'true');
    }
    if (volume !== null) {
      setVolumeLevel(parseFloat(volume));
    }
  }, []);

  const handleEnabledChange = (event) => {
    const enabled = event.target.checked;
    setSoundEnabled(enabled);
    setEnabled(enabled);
  };

  const handleVolumeChange = (event, newValue) => {
    setVolumeLevel(newValue);
    setVolume(newValue);
  };

  const soundTests = [
    { name: '成功', description: 'データ保存成功時', action: playSuccess },
    { name: 'エラー', description: 'エラー発生時', action: playError },
    { name: '警告', description: 'バリデーションエラー時', action: playWarning },
    { name: '情報', description: '一般的な通知', action: playInfo },
    { name: '保存', description: 'データ保存時', action: playSave },
    { name: 'ログイン', description: 'ログイン成功時', action: playLogin },
    { name: 'ログアウト', description: 'ログアウト時', action: playLogout },
    { name: '新規患者', description: '患者登録完了時', action: playNewPatient },
    { name: '新規診療', description: '診療記録作成時', action: playNewEncounter },
    { name: 'ビープ', description: '基本的な通知音', action: playBeep },
  ];

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          {soundEnabled ? <VolumeUp sx={{ mr: 1 }} /> : <VolumeOff sx={{ mr: 1 }} />}
          <Typography variant="h6">
            通知音設定
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Enable/Disable */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={soundEnabled}
                  onChange={handleEnabledChange}
                  color="primary"
                />
              }
              label="通知音を有効にする"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              各種操作の完了時や警告時に音で通知します
            </Typography>
          </Grid>

          {/* Volume Control */}
          <Grid item xs={12}>
            <Typography gutterBottom>
              音量
            </Typography>
            <Box sx={{ px: 2 }}>
              <Slider
                value={volumeLevel}
                onChange={handleVolumeChange}
                disabled={!soundEnabled}
                min={0}
                max={1}
                step={0.1}
                marks={[
                  { value: 0, label: '0%' },
                  { value: 0.5, label: '50%' },
                  { value: 1, label: '100%' },
                ]}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
              />
            </Box>
          </Grid>

          {/* Sound Tests */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              通知音テスト
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              各種通知音を試聴できます
            </Typography>
          </Grid>

          {soundTests.map((sound, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Box
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 2,
                  textAlign: 'center',
                }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  {sound.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  {sound.description}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PlayArrow />}
                  onClick={sound.action}
                  disabled={!soundEnabled}
                  sx={{ mt: 1 }}
                >
                  再生
                </Button>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>注意:</strong> 
            ブラウザによっては、ユーザーの操作（クリックなど）が発生するまで音声が再生されない場合があります。
            初回アクセス時は、何かボタンをクリックしてから通知音機能をお試しください。
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
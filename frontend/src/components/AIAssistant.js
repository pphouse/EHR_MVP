import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Chip,
  CircularProgress,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Security,
  Warning,
  CheckCircle,
  Error,
  Info,
  Psychology,
  Description,
  ExpandMore,
  Visibility,
  VisibilityOff,
  ContentCopy,
} from '@mui/icons-material';
import { aiAssistantAPI, handleAPIError } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const AIAssistant = ({ onTextProcessed, initialText = '', context = {} }) => {
  const { user } = useAuth();
  const [text, setText] = useState(initialText);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // AI Assistant status
  const [status, setStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setStatusLoading(true);
      const response = await aiAssistantAPI.getStatus();
      setStatus(response.data);
    } catch (err) {
      console.error('Failed to fetch AI Assistant status:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSafetyCheck = async () => {
    if (!text.trim()) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await aiAssistantAPI.checkSafety({
        text: text,
        context: context
      });
      
      setResult(response.data);
      
      // コールバックで処理済みテキストを親コンポーネントに渡す
      if (onTextProcessed) {
        onTextProcessed(response.data);
      }
      
    } catch (err) {
      console.error('Safety check failed:', err);
      const errorData = handleAPIError(err);
      setError(errorData.message);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (riskLevel) => {
    const colors = {
      'low': 'success',
      'medium': 'warning', 
      'high': 'error',
      'critical': 'error'
    };
    return colors[riskLevel] || 'default';
  };

  const getRiskLevelIcon = (riskLevel) => {
    const icons = {
      'low': <CheckCircle />,
      'medium': <Warning />,
      'high': <Error />,
      'critical': <Error />
    };
    return icons[riskLevel] || <Info />;
  };

  const getActionText = (action) => {
    const actions = {
      'allow': '許可',
      'mask': 'マスキング適用',
      'rewrite': '自動書き直し',
      'block': 'ブロック'
    };
    return actions[action] || action;
  };

  const copyToClipboard = (textToCopy) => {
    navigator.clipboard.writeText(textToCopy);
  };

  if (statusLoading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <CircularProgress size={24} />
            <Typography>AI Assistant を初期化中...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Security color="primary" />
          <Typography variant="h6">AI Assistant - セーフティレイヤー</Typography>
          {status?.system_health?.status === 'operational' ? (
            <Chip label="動作中" color="success" size="small" />
          ) : (
            <Chip label="制限あり" color="warning" size="small" />
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              multiline
              rows={4}
              fullWidth
              label="テキストを入力してください"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="診療記録や医療テキストを入力..."
            />
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                onClick={handleSafetyCheck}
                disabled={loading || !text.trim()}
                startIcon={loading ? <CircularProgress size={20} /> : <Security />}
              >
                {loading ? '検査中...' : 'セーフティチェック'}
              </Button>
              
              {result && (
                <Button
                  variant="outlined"
                  onClick={() => setDetailsOpen(true)}
                  startIcon={<Visibility />}
                >
                  詳細表示
                </Button>
              )}
            </Box>
          </Grid>

          {result && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              
              {/* リスク概要 */}
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                {getRiskLevelIcon(result.risk_level)}
                <Typography variant="h6">
                  リスクレベル: 
                  <Chip 
                    label={result.risk_level.toUpperCase()}
                    color={getRiskLevelColor(result.risk_level)}
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  信頼度: {(result.confidence_score * 100).toFixed(1)}%
                </Typography>
              </Box>

              {/* アクション */}
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  実行されたアクション: {getActionText(result.action_taken)}
                </Typography>
              </Box>

              {/* 処理済みテキスト */}
              <Box mb={2}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Typography variant="subtitle2">処理済みテキスト:</Typography>
                  <IconButton 
                    size="small" 
                    onClick={() => copyToClipboard(result.processed_text)}
                  >
                    <ContentCopy fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => setShowOriginal(!showOriginal)}
                  >
                    {showOriginal ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </Box>
                
                <TextField
                  multiline
                  rows={4}
                  fullWidth
                  value={showOriginal ? result.original_text : result.processed_text}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                />
              </Box>

              {/* 推奨事項 */}
              {result.recommendations && result.recommendations.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    推奨事項:
                  </Typography>
                  <List dense>
                    {result.recommendations.map((rec, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Info color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={rec} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Grid>
          )}
        </Grid>

        {/* 詳細ダイアログ */}
        <Dialog 
          open={detailsOpen} 
          onClose={() => setDetailsOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>セーフティチェック詳細結果</DialogTitle>
          <DialogContent>
            {result && (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      処理時間
                    </Typography>
                    <Typography>{result.processing_time_ms}ms</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      検出された問題数
                    </Typography>
                    <Typography>{result.detected_issues.length}件</Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" gutterBottom>
                  検出された問題:
                </Typography>
                
                {result.detected_issues.length === 0 ? (
                  <Typography color="text.secondary">
                    問題は検出されませんでした
                  </Typography>
                ) : (
                  result.detected_issues.map((issue, index) => (
                    <Accordion key={index}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box display="flex" alignItems="center" gap={2}>
                          {issue.type === 'pii_detected' && <Warning color="warning" />}
                          {issue.type === 'hallucination_risk' && <Error color="error" />}
                          <Typography>{issue.description}</Typography>
                          {issue.confidence && (
                            <Chip 
                              label={`${(issue.confidence * 100).toFixed(0)}%`}
                              size="small"
                            />
                          )}
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2">
                          タイプ: {issue.type}
                          {issue.category && ` / カテゴリ: ${issue.category}`}
                          {issue.score && ` / スコア: ${issue.score}`}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  ))
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsOpen(false)}>
              閉じる
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AIAssistant;
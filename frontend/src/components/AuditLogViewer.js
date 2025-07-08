import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Security,
  ExpandMore,
  Refresh,
  Download,
  Visibility,
  Warning,
  Error,
  CheckCircle,
  Info,
  Timeline,
  Dashboard,
  FilterList,
} from '@mui/icons-material';
import { aiAssistantAPI, handleAPIError } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const AuditLogViewer = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    risk_level: '',
    limit: 50,
    date_from: '',
    date_to: ''
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAuditLogs();
      fetchStatistics();
    }
  }, [user, filters]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        limit: filters.limit,
        ...(filters.risk_level && { risk_level: filters.risk_level }),
        ...(filters.date_from && { date_from: filters.date_from }),
        ...(filters.date_to && { date_to: filters.date_to })
      };

      const response = await aiAssistantAPI.getAuditLogs(params);
      setLogs(response.data.logs || []);

    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      const errorData = handleAPIError(err);
      setError(errorData.message);
      
      // Mock data for demonstration
      const mockLogs = [
        {
          id: 1,
          timestamp: '2025-06-29T21:30:00',
          user_id: 1,
          user_name: 'Dr. 山田',
          operation: 'safety_check',
          risk_level: 'medium',
          action_taken: 'mask',
          issues_detected: 2,
          confidence_score: 0.85,
          processing_time_ms: 1250,
          audit_hash: 'abc123def456'
        },
        {
          id: 2,
          timestamp: '2025-06-29T21:25:00',
          user_id: 2,
          user_name: 'Dr. 佐藤',
          operation: 'diagnosis_assist',
          risk_level: 'low',
          action_taken: 'allow',
          issues_detected: 0,
          confidence_score: 0.92,
          processing_time_ms: 800,
          audit_hash: 'def456ghi789'
        },
        {
          id: 3,
          timestamp: '2025-06-29T21:20:00',
          user_id: 1,
          user_name: 'Dr. 山田',
          operation: 'summary_generation',
          risk_level: 'high',
          action_taken: 'rewrite',
          issues_detected: 3,
          confidence_score: 0.76,
          processing_time_ms: 2100,
          audit_hash: 'ghi789jkl012'
        }
      ];
      setLogs(mockLogs);

    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      // Mock statistics for demonstration
      const mockStats = {
        total_operations: 156,
        high_risk_count: 12,
        medium_risk_count: 34,
        low_risk_count: 110,
        avg_processing_time: 1200,
        pii_detections: 28,
        hallucination_detections: 15,
        success_rate: 0.94
      };
      setStatistics(mockStats);

    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  };

  const handleFilterChange = (field) => (event) => {
    setFilters({
      ...filters,
      [field]: event.target.value
    });
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  const getRiskColor = (riskLevel) => {
    const colors = {
      'low': 'success',
      'medium': 'warning',
      'high': 'error',
      'critical': 'error'
    };
    return colors[riskLevel] || 'default';
  };

  const getActionIcon = (action) => {
    const icons = {
      'allow': <CheckCircle color="success" />,
      'mask': <Info color="info" />,
      'rewrite': <Warning color="warning" />,
      'block': <Error color="error" />
    };
    return icons[action] || <Info />;
  };

  const formatDateTime = (dateTimeString) => {
    return new Date(dateTimeString).toLocaleString('ja-JP');
  };

  const calculateRiskPercentage = (count, total) => {
    return total > 0 ? ((count / total) * 100).toFixed(1) : 0;
  };

  if (user?.role !== 'admin') {
    return (
      <Alert severity="warning">
        監査ログの表示は管理者のみアクセス可能です。
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Security color="primary" />
        <Typography variant="h5">
          AI Assistant 監査ログ・リスク分析
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => {
            fetchAuditLogs();
            fetchStatistics();
          }}
        >
          更新
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Dashboard */}
      {statistics && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  <Dashboard sx={{ mr: 1, verticalAlign: 'middle' }} />
                  総操作数
                </Typography>
                <Typography variant="h3">
                  {statistics.total_operations}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  過去30日間
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="error" gutterBottom>
                  高リスク操作
                </Typography>
                <Typography variant="h3" color="error">
                  {statistics.high_risk_count}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ({calculateRiskPercentage(statistics.high_risk_count, statistics.total_operations)}%)
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main" gutterBottom>
                  成功率
                </Typography>
                <Typography variant="h3" color="success.main">
                  {(statistics.success_rate * 100).toFixed(1)}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={statistics.success_rate * 100}
                  color="success"
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  平均処理時間
                </Typography>
                <Typography variant="h3">
                  {statistics.avg_processing_time}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ミリ秒
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">
            <FilterList sx={{ mr: 1, verticalAlign: 'middle' }} />
            フィルター
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>リスクレベル</InputLabel>
                <Select
                  value={filters.risk_level}
                  onChange={handleFilterChange('risk_level')}
                  label="リスクレベル"
                >
                  <MenuItem value="">すべて</MenuItem>
                  <MenuItem value="low">LOW</MenuItem>
                  <MenuItem value="medium">MEDIUM</MenuItem>
                  <MenuItem value="high">HIGH</MenuItem>
                  <MenuItem value="critical">CRITICAL</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>表示件数</InputLabel>
                <Select
                  value={filters.limit}
                  onChange={handleFilterChange('limit')}
                  label="表示件数"
                >
                  <MenuItem value={25}>25件</MenuItem>
                  <MenuItem value={50}>50件</MenuItem>
                  <MenuItem value={100}>100件</MenuItem>
                  <MenuItem value={200}>200件</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="開始日"
                type="date"
                value={filters.date_from}
                onChange={handleFilterChange('date_from')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="終了日"
                type="date"
                value={filters.date_to}
                onChange={handleFilterChange('date_to')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={1}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setFilters({ risk_level: '', limit: 50, date_from: '', date_to: '' })}
              >
                クリア
              </Button>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Audit Logs Table */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              監査ログ ({logs.length}件)
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Download />}
              size="small"
            >
              CSVエクスポート
            </Button>
          </Box>

          {loading ? (
            <LinearProgress sx={{ mb: 2 }} />
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>日時</TableCell>
                    <TableCell>ユーザー</TableCell>
                    <TableCell>操作</TableCell>
                    <TableCell>リスクレベル</TableCell>
                    <TableCell>アクション</TableCell>
                    <TableCell>検出問題数</TableCell>
                    <TableCell>信頼度</TableCell>
                    <TableCell>処理時間</TableCell>
                    <TableCell>詳細</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDateTime(log.timestamp)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {log.user_name || `User ${log.user_id}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={log.operation} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.risk_level?.toUpperCase()}
                          color={getRiskColor(log.risk_level)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getActionIcon(log.action_taken)}
                          <Typography variant="body2">
                            {log.action_taken}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {log.issues_detected}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {(log.confidence_score * 100).toFixed(1)}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {log.processing_time_ms}ms
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="詳細表示">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(log)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Log Details Dialog */}
      <Dialog 
        open={showDetails} 
        onClose={() => setShowDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          監査ログ詳細 - {selectedLog?.id}
        </DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">日時:</Typography>
                <Typography variant="body2" paragraph>
                  {formatDateTime(selectedLog.timestamp)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">ユーザー:</Typography>
                <Typography variant="body2" paragraph>
                  {selectedLog.user_name} (ID: {selectedLog.user_id})
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">操作:</Typography>
                <Typography variant="body2" paragraph>
                  {selectedLog.operation}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">リスクレベル:</Typography>
                <Chip
                  label={selectedLog.risk_level?.toUpperCase()}
                  color={getRiskColor(selectedLog.risk_level)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">実行されたアクション:</Typography>
                <Typography variant="body2" paragraph>
                  {selectedLog.action_taken}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">検出された問題数:</Typography>
                <Typography variant="body2" paragraph>
                  {selectedLog.issues_detected}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">信頼度スコア:</Typography>
                <Typography variant="body2" paragraph>
                  {(selectedLog.confidence_score * 100).toFixed(1)}%
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">処理時間:</Typography>
                <Typography variant="body2" paragraph>
                  {selectedLog.processing_time_ms}ms
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">監査ハッシュ:</Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {selectedLog.audit_hash}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditLogViewer;
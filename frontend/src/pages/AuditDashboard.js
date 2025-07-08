import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import {
  Security,
  Dashboard,
  Assessment,
} from '@mui/icons-material';
import AuditLogViewer from '../components/AuditLogViewer';
import { useAuth } from '../contexts/AuthContext';

const AuditDashboard = () => {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning" sx={{ textAlign: 'center' }}>
          <Typography variant="h6">
            アクセス権限がありません
          </Typography>
          <Typography variant="body2">
            この機能は管理者のみアクセス可能です。
          </Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          <Security sx={{ mr: 2, verticalAlign: 'middle' }} />
          AI Assistant セキュリティ・監査ダッシュボード
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Azure OpenAI API セーフティレイヤーの監査ログとリスク分析
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Overview Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Dashboard color="primary" />
                <Box>
                  <Typography variant="h6">リアルタイム監視</Typography>
                  <Typography variant="body2" color="text.secondary">
                    AI処理の安全性をリアルタイムで監視
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Security color="success" />
                <Box>
                  <Typography variant="h6">セーフティチェック</Typography>
                  <Typography variant="body2" color="text.secondary">
                    PII検知・ハルシネーション防止
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Assessment color="info" />
                <Box>
                  <Typography variant="h6">リスク分析</Typography>
                  <Typography variant="body2" color="text.secondary">
                    包括的なリスクアセスメント
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Main Audit Log Viewer */}
        <Grid item xs={12}>
          <AuditLogViewer />
        </Grid>
      </Grid>
    </Container>
  );
};

export default AuditDashboard;
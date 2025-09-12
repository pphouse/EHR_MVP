import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Divider,
  Alert,
  Button,
  LinearProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  LocalHospital as HospitalIcon,
  Assignment as AssignmentIcon,
  Thermostat as ThermometerIcon,
  Favorite as HeartIcon,
  Air as LungsIcon,
  CalendarToday as CalendarIcon,
  SmartToy as AIIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { encountersAPI, patientsAPI } from '../services/api';
import { PatientAIDisclosureCompact } from '../components/PatientAIDisclosure';

const EncounterDetailPatientView = () => {
  const { id } = useParams();
  const [encounter, setEncounter] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const encRes = await encountersAPI.getById(id);
      const encounter = encRes.data;
      setEncounter(encounter);

      const patRes = await patientsAPI.getById(encounter.patient_id);
      setPatient(patRes.data);
    } catch (error) {
      console.error('データの取得に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  if (!encounter || !patient) {
    return <Alert severity="error">診療情報が見つかりません</Alert>;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* ヘッダー */}
      <Paper sx={{ p: 4, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'white', color: 'primary.main' }}>
              <PersonIcon sx={{ fontSize: 50 }} />
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h3" gutterBottom>
              {patient.last_name} {patient.first_name} 様
            </Typography>
            <Typography variant="h6">
              本日の診療結果
            </Typography>
          </Grid>
          <Grid item>
            <Chip 
              label={formatDate(encounter.start_time)} 
              sx={{ 
                bgcolor: 'white', 
                color: 'primary.main',
                fontSize: '1rem',
                height: 40,
                px: 2
              }} 
            />
          </Grid>
        </Grid>
      </Paper>

      {/* AI診療支援の説明 */}
      <PatientAIDisclosureCompact language="ja" />

      {/* 診療内容 */}
      <Grid container spacing={3}>
        {/* 主訴と診断 */}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AssignmentIcon sx={{ mr: 2 }} color="primary" />
                本日の診療内容
              </Typography>
              
              <Grid container spacing={4} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <Alert severity="info" icon={<InfoIcon />}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      来院理由
                    </Typography>
                    <Typography variant="h6">
                      {encounter.chief_complaint || '記録なし'}
                    </Typography>
                  </Alert>
                </Grid>
                
                {encounter.diagnosis && (
                  <Grid item xs={12} md={6}>
                    <Alert severity="success" icon={<CheckIcon />}>
                      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        診断結果
                      </Typography>
                      <Typography variant="h6">
                        {encounter.diagnosis}
                      </Typography>
                    </Alert>
                  </Grid>
                )}
              </Grid>

              {/* 診療内容の詳細 */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  診療の詳細
                </Typography>
                
                {encounter.subjective && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      症状について
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body1">
                        {encounter.subjective}
                      </Typography>
                    </Paper>
                  </Box>
                )}

                {encounter.assessment && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      医師の見解
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body1">
                        {encounter.assessment}
                      </Typography>
                    </Paper>
                  </Box>
                )}

                {encounter.plan && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      今後の治療方針
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'info.lighter' }}>
                      <Typography variant="body1">
                        {encounter.plan}
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* バイタルサイン */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <HospitalIcon sx={{ mr: 2 }} color="primary" />
                測定結果
              </Typography>
              
              <List sx={{ mt: 2 }}>
                {encounter.temperature && (
                  <ListItem>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'error.light' }}>
                        <ThermometerIcon />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary="体温"
                      secondary={
                        <Typography variant="h6" component="span">
                          {encounter.temperature}°C
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
                
                {(encounter.blood_pressure_systolic && encounter.blood_pressure_diastolic) && (
                  <ListItem>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'error.light' }}>
                        <HeartIcon />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary="血圧"
                      secondary={
                        <Typography variant="h6" component="span">
                          {encounter.blood_pressure_systolic}/{encounter.blood_pressure_diastolic} mmHg
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
                
                {encounter.heart_rate && (
                  <ListItem>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'primary.light' }}>
                        <HeartIcon />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary="脈拍"
                      secondary={
                        <Typography variant="h6" component="span">
                          {encounter.heart_rate} 回/分
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
                
                {encounter.oxygen_saturation && (
                  <ListItem>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'info.light' }}>
                        <LungsIcon />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary="酸素飽和度"
                      secondary={
                        <Typography variant="h6" component="span">
                          {encounter.oxygen_saturation}%
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* 次回の診療について */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarIcon sx={{ mr: 2 }} color="primary" />
                次回の診療
              </Typography>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body1">
                  次回の診療日時については、受付でご相談ください。
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  症状が悪化した場合は、すぐにご連絡ください。
                </Typography>
              </Alert>

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  ご注意事項
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="• 処方されたお薬は、指示通りに服用してください" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="• 気になる症状があれば、遠慮なくご相談ください" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="• 定期的な検診を心がけましょう" />
                  </ListItem>
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* フッター */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button 
          variant="contained" 
          size="large"
          onClick={() => window.print()}
          sx={{ mr: 2 }}
        >
          印刷する
        </Button>
        <Button 
          variant="outlined" 
          size="large"
          href="/patient-portal"
        >
          患者ポータルへ
        </Button>
      </Box>
    </Container>
  );
};

export default EncounterDetailPatientView;
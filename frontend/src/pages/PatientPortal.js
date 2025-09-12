import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Button,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Tab,
  Tabs,
  Alert,
} from '@mui/material';
import {
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  LocalHospital as HospitalIcon,
  Assignment as AssignmentIcon,
  Medication as MedicationIcon,
  Description as DescriptionIcon,
  SmartToy as AIIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { PatientAIDisclosureCompact } from '../components/PatientAIDisclosure';
import { patientsAPI, encountersAPI, prescriptionsAPI } from '../services/api';

const PatientPortal = () => {
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [encounters, setEncounters] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      const [patientRes, encountersRes, prescriptionsRes] = await Promise.all([
        patientsAPI.getById(patientId),
        encountersAPI.getAll({ patient_id: patientId }),
        prescriptionsAPI.getAll({ patient_id: patientId })
      ]);

      setPatient(patientRes.data);
      setEncounters(encountersRes.data.items || []);
      setPrescriptions(prescriptionsRes.data.items || []);
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
      day: 'numeric'
    });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) return <Typography>読み込み中...</Typography>;
  if (!patient) return <Typography>患者情報が見つかりません</Typography>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* ヘッダー */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}>
              <PersonIcon sx={{ fontSize: 40 }} />
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h4" gutterBottom>
              {patient.last_name} {patient.first_name} 様
            </Typography>
            <Typography variant="body1" color="text.secondary">
              患者ID: {patient.patient_id}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Chip 
                label={`${new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()}歳`} 
                size="small" 
                sx={{ mr: 1 }}
              />
              <Chip 
                label={patient.gender === 'male' ? '男性' : '女性'} 
                size="small" 
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* AI診療支援の説明 */}
      <PatientAIDisclosureCompact language="ja" />

      {/* タブ */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
          <Tab icon={<TimelineIcon />} label="診療履歴" />
          <Tab icon={<MedicationIcon />} label="お薬情報" />
          <Tab icon={<AssignmentIcon />} label="検査結果" />
          <Tab icon={<AIIcon />} label="AI診療支援" />
        </Tabs>
      </Paper>

      {/* タブコンテンツ */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>
              診療履歴
            </Typography>
            {encounters.length === 0 ? (
              <Alert severity="info">診療履歴がありません</Alert>
            ) : (
              <List>
                {encounters.map((encounter) => (
                  <Card key={encounter.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="subtitle2" color="text.secondary">
                            診療日
                          </Typography>
                          <Typography variant="body1">
                            {formatDate(encounter.start_time)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="subtitle2" color="text.secondary">
                            診療科
                          </Typography>
                          <Typography variant="body1">
                            {encounter.department || '一般内科'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            主訴
                          </Typography>
                          <Typography variant="body1">
                            {encounter.chief_complaint || '-'}
                          </Typography>
                        </Grid>
                        {encounter.diagnosis && (
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" color="text.secondary">
                              診断
                            </Typography>
                            <Typography variant="body1">
                              {encounter.diagnosis}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </List>
            )}
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>
              現在服用中のお薬
            </Typography>
            {prescriptions.length === 0 ? (
              <Alert severity="info">処方されているお薬はありません</Alert>
            ) : (
              <Grid container spacing={2}>
                {prescriptions.filter(p => p.status === 'active').map((prescription) => (
                  <Grid item xs={12} md={6} key={prescription.id}>
                    <Card>
                      <CardHeader
                        avatar={
                          <Avatar sx={{ bgcolor: 'secondary.main' }}>
                            <MedicationIcon />
                          </Avatar>
                        }
                        title={prescription.medication_name}
                        subheader={`処方日: ${formatDate(prescription.prescribed_date)}`}
                      />
                      <CardContent>
                        <Typography variant="body2" gutterBottom>
                          <strong>用法用量:</strong> {prescription.dosage_instructions}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>投与日数:</strong> {prescription.duration}日分
                        </Typography>
                        {prescription.notes && (
                          <Alert severity="warning" sx={{ mt: 1 }}>
                            <Typography variant="body2">
                              {prescription.notes}
                            </Typography>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>
              検査結果
            </Typography>
            <Alert severity="info">
              検査結果の表示機能は準備中です
            </Alert>
          </Grid>
        </Grid>
      )}

      {tabValue === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <AIIcon />
                  </Avatar>
                }
                title="AI診療支援システムについて"
                subheader="当院の診療支援システムの説明"
              />
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  安心・安全な医療の提供
                </Typography>
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    🤖 AIはどのように使われていますか？
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText 
                        primary="診断の補助"
                        secondary="医師の診断を支援し、見落としを防ぎます"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="薬の相互作用チェック"
                        secondary="複数の薬の飲み合わせを確認します"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="最新医学情報の参照"
                        secondary="最新の治療ガイドラインを確認します"
                      />
                    </ListItem>
                  </List>
                </Box>

                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    👨‍⚕️ 医師の役割
                  </Typography>
                  <Typography variant="body2" paragraph>
                    AIの提案を参考にしながら、医師が最終的な診断と治療方針を決定します。
                    患者様の状態を総合的に判断し、最適な医療を提供いたします。
                  </Typography>
                </Box>

                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    🔒 個人情報の保護
                  </Typography>
                  <Typography variant="body2" paragraph>
                    AIシステムは匿名化されたデータのみを処理し、
                    個人を特定できる情報は一切外部に送信されません。
                  </Typography>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Alert severity="success">
                  ご不明な点がございましたら、遠慮なく医師または看護師にお尋ねください。
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default PatientPortal;
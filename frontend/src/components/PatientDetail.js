import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Alert,
  IconButton,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Person,
  Phone,
  Email,
  Home,
  CalendarToday,
  Assignment,
  LocalHospital,
  Emergency,
  Add,
} from '@mui/icons-material';

// Sample patient data
const samplePatients = [
  {
    id: 1,
    patient_id: 'P000001',
    first_name: '太郎',
    last_name: '田中',
    first_name_kana: 'タロウ',
    last_name_kana: 'タナカ',
    date_of_birth: '1978-05-15',
    gender: 'male',
    phone: '090-1234-5678',
    email: 'tanaka.taro@example.com',
    address: '東京都渋谷区1-1-1',
    emergency_contact: '田中花子',
    emergency_phone: '080-9876-5432',
    medical_history: '高血圧、糖尿病',
    allergies: 'ペニシリン',
    current_medications: '降圧剤、インスリン',
    is_active: '1',
  },
  {
    id: 2,
    patient_id: 'P000002',
    first_name: '花子',
    last_name: '佐藤',
    first_name_kana: 'ハナコ',
    last_name_kana: 'サトウ',
    date_of_birth: '1991-12-03',
    gender: 'female',
    phone: '080-9876-5432',
    email: 'sato.hanako@example.com',
    address: '東京都新宿区2-2-2',
    emergency_contact: '佐藤一郎',
    emergency_phone: '090-1111-2222',
    medical_history: '特になし',
    allergies: '卵',
    current_medications: 'なし',
    is_active: '1',
  },
  {
    id: 3,
    patient_id: 'P000003',
    first_name: '次郎',
    last_name: '山田',
    first_name_kana: 'ジロウ',
    last_name_kana: 'ヤマダ',
    date_of_birth: '1956-08-22',
    gender: 'male',
    phone: '070-5555-1111',
    email: 'yamada.jiro@example.com',
    address: '東京都世田谷区3-3-3',
    emergency_contact: '山田三郎',
    emergency_phone: '080-3333-4444',
    medical_history: '心疾患、関節炎',
    allergies: 'なし',
    current_medications: '心臓薬、鎮痛剤',
    is_active: '1',
  },
];

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`patient-tabpanel-${index}`}
      aria-labelledby={`patient-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Simulate API call
    const loadPatientData = async () => {
      try {
        // Find patient by ID
        const foundPatient = samplePatients.find(p => p.id === parseInt(id));
        
        if (!foundPatient) {
          setError('患者が見つかりません');
          return;
        }

        setPatient(foundPatient);

      } catch (err) {
        setError('患者データの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadPatientData();
  }, [id]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleBackToList = () => {
    navigate('/patients');
  };

  const handleEditPatient = () => {
    navigate(`/patients/${id}/edit`);
  };

  const handleCreateEncounter = () => {
    navigate(`/encounters/create?patient_id=${id}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography>読み込み中...</Typography>
      </Box>
    );
  }

  if (error || !patient) {
    return (
      <Box>
        <Alert severity="error">{error || '患者が見つかりません'}</Alert>
        <Button variant="outlined" onClick={handleBackToList} sx={{ mt: 2 }}>
          患者一覧に戻る
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handleBackToList} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            患者詳細
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={handleEditPatient}
          >
            編集
          </Button>
          <Button
            variant="contained"
            startIcon={<Assignment />}
            onClick={handleCreateEncounter}
          >
            診療記録作成
          </Button>
        </Box>
      </Box>

      {/* Patient Summary Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Avatar
                  sx={{ width: 80, height: 80, bgcolor: patient.gender === 'male' ? 'primary.main' : 'secondary.main' }}
                >
                  <Person sx={{ fontSize: 40 }} />
                </Avatar>
              </Box>
            </Grid>
            <Grid item xs={12} md={10}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="h5" sx={{ mr: 2 }}>
                  {patient.last_name} {patient.first_name}
                </Typography>
                <Chip 
                  label={patient.gender === 'male' ? '男性' : '女性'} 
                  color={patient.gender === 'male' ? 'primary' : 'secondary'} 
                  size="small" 
                />
              </Box>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                {patient.last_name_kana} {patient.first_name_kana}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">患者ID</Typography>
                  <Typography variant="body1">{patient.patient_id}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">年齢</Typography>
                  <Typography variant="body1">{calculateAge(patient.date_of_birth)}歳</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">生年月日</Typography>
                  <Typography variant="body1">{patient.date_of_birth}</Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="基本情報" />
            <Tab label="診療履歴" />
            <Tab label="医療情報" />
          </Tabs>
        </Box>

        {/* Basic Information Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                連絡先情報
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography>{patient.phone}</Typography>
              </Box>
              {patient.email && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Email sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography>{patient.email}</Typography>
                </Box>
              )}
              {patient.address && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <Home sx={{ mr: 1, mt: 0.5, color: 'text.secondary' }} />
                  <Typography>{patient.address}</Typography>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                緊急連絡先
              </Typography>
              {patient.emergency_contact && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Emergency sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography>{patient.emergency_contact}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {patient.emergency_phone}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        {/* Medical Information Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                <LocalHospital sx={{ mr: 1, verticalAlign: 'bottom' }} />
                医療情報
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                既往歴
              </Typography>
              <Typography variant="body1">
                {patient.medical_history || '特になし'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                アレルギー
              </Typography>
              <Typography variant="body1">
                {patient.allergies || '特になし'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                現在の服薬
              </Typography>
              <Typography variant="body1">
                {patient.current_medications || '特になし'}
              </Typography>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default PatientDetail;
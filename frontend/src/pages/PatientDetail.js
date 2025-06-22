import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Tab,
  Tabs,
  Alert,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Person,
  Phone,
  Email,
  Home,
  LocalHospital,
  Assignment,
  CalendarToday,
  Edit,
  Add,
  ArrowBack,
  Visibility,
} from '@mui/icons-material';
import { patientsAPI, encountersAPI, handleAPIError } from '../services/api';

const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`patient-tabpanel-${index}`}
      aria-labelledby={`patient-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      
      // Fetch patient data
      const patientResponse = await patientsAPI.getPatient(id);
      setPatient(patientResponse.data);
      
      // Fetch patient's encounters
      try {
        const encountersResponse = await encountersAPI.getPatientEncounters(id);
        setEncounters(encountersResponse.data || []);
      } catch (encErr) {
        console.log('No encounters found for patient');
        setEncounters([]);
      }
    } catch (err) {
      console.error('Failed to fetch patient data:', err);
      const errorData = handleAPIError(err);
      setError(errorData.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCreateEncounter = () => {
    navigate(`/encounters/create?patient_id=${id}`);
  };

  const handleViewEncounter = (encounterId) => {
    navigate(`/encounters/${encounterId}`);
  };

  const getGenderChip = (gender) => {
    switch(gender) {
      case 'MALE':
      case 'male':
        return <Chip label="男性" color="primary" size="small" />;
      case 'FEMALE':
      case 'female':
        return <Chip label="女性" color="secondary" size="small" />;
      case 'OTHER':
      case 'other':
        return <Chip label="その他" color="default" size="small" />;
      default:
        return <Chip label={gender} color="default" size="small" />;
    }
  };

  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'finished':
        return <Chip label="完了" color="success" size="small" />;
      case 'in-progress':
        return <Chip label="診療中" color="warning" size="small" />;
      case 'planned':
        return <Chip label="予定" color="info" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('ja-JP') + ' ' + 
           date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!patient) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        患者情報が見つかりません。
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/patients')}
          sx={{ mr: 2 }}
        >
          患者一覧に戻る
        </Button>
        <Typography variant="h4">
          患者詳細
        </Typography>
      </Box>

      {/* Patient Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar sx={{ width: 80, height: 80 }}>
                <Person sx={{ fontSize: 40 }} />
              </Avatar>
            </Grid>
            <Grid item xs>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h4">
                  {patient.last_name} {patient.first_name}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  {patient.last_name_kana} {patient.first_name_kana}
                </Typography>
                <Chip
                  label={patient.patient_id}
                  color="primary"
                  variant="outlined"
                />
                {getGenderChip(patient.gender)}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body1">
                  {calculateAge(patient.date_of_birth)}歳
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {new Date(patient.date_of_birth).toLocaleDateString('ja-JP')}生まれ
                </Typography>
              </Box>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateEncounter}
                size="large"
                color="success"
              >
                新規診療記録
              </Button>
              <Button
                variant="outlined"
                startIcon={<Edit />}
                sx={{ ml: 1 }}
              >
                編集
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="基本情報" icon={<Person />} />
            <Tab label="診療記録" icon={<Assignment />} />
            <Tab label="連絡先" icon={<Phone />} />
          </Tabs>
        </Box>

        {/* Basic Information Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                基本情報
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Person />
                  </ListItemIcon>
                  <ListItemText
                    primary="患者ID"
                    secondary={patient.patient_id}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CalendarToday />
                  </ListItemIcon>
                  <ListItemText
                    primary="生年月日"
                    secondary={`${new Date(patient.date_of_birth).toLocaleDateString('ja-JP')} (${calculateAge(patient.date_of_birth)}歳)`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Person />
                  </ListItemIcon>
                  <ListItemText
                    primary="性別"
                    secondary={getGenderChip(patient.gender)}
                  />
                </ListItem>
              </List>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                医療情報
              </Typography>
              <List>
                {patient.blood_type && (
                  <ListItem>
                    <ListItemIcon>
                      <LocalHospital />
                    </ListItemIcon>
                    <ListItemText
                      primary="血液型"
                      secondary={patient.blood_type}
                    />
                  </ListItem>
                )}
                {patient.allergies && (
                  <ListItem>
                    <ListItemText
                      primary="アレルギー"
                      secondary={patient.allergies}
                    />
                  </ListItem>
                )}
                {patient.medical_history && (
                  <ListItem>
                    <ListItemText
                      primary="既往歴"
                      secondary={patient.medical_history}
                    />
                  </ListItem>
                )}
              </List>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Encounters Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              診療記録 ({encounters.length}件)
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateEncounter}
            >
              新規診療記録
            </Button>
          </Box>
          
          {encounters.length === 0 ? (
            <Alert severity="info">
              診療記録がありません。
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>診療記録ID</TableCell>
                    <TableCell>診療日時</TableCell>
                    <TableCell>主訴</TableCell>
                    <TableCell>ステータス</TableCell>
                    <TableCell align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {encounters.map((encounter) => (
                    <TableRow key={encounter.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {encounter.encounter_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {formatDateTime(encounter.start_time)}
                      </TableCell>
                      <TableCell>
                        {encounter.chief_complaint}
                      </TableCell>
                      <TableCell>
                        {getStatusChip(encounter.status)}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          onClick={() => handleViewEncounter(encounter.id)}
                          title="詳細表示"
                        >
                          <Visibility />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* Contact Information Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                連絡先
              </Typography>
              <List>
                {patient.phone && (
                  <ListItem>
                    <ListItemIcon>
                      <Phone />
                    </ListItemIcon>
                    <ListItemText
                      primary="電話番号"
                      secondary={patient.phone}
                    />
                  </ListItem>
                )}
                {patient.email && (
                  <ListItem>
                    <ListItemIcon>
                      <Email />
                    </ListItemIcon>
                    <ListItemText
                      primary="メールアドレス"
                      secondary={patient.email}
                    />
                  </ListItem>
                )}
              </List>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                住所
              </Typography>
              <List>
                {patient.postal_code && (
                  <ListItem>
                    <ListItemIcon>
                      <Home />
                    </ListItemIcon>
                    <ListItemText
                      primary="郵便番号"
                      secondary={patient.postal_code}
                    />
                  </ListItem>
                )}
                <ListItem>
                  <ListItemIcon>
                    <Home />
                  </ListItemIcon>
                  <ListItemText
                    primary="住所"
                    secondary={`${patient.prefecture || ''} ${patient.city || ''} ${patient.address_line || ''}`}
                  />
                </ListItem>
                {patient.emergency_contact_name && (
                  <ListItem>
                    <ListItemText
                      primary="緊急連絡先"
                      secondary={`${patient.emergency_contact_name} (${patient.emergency_contact_phone || ''})`}
                    />
                  </ListItem>
                )}
              </List>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default PatientDetail;
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
  Paper,
  Tab,
  Tabs,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
} from '@mui/material';
import {
  Assignment,
  Person,
  CalendarToday,
  Edit,
  Save,
  Print,
  Thermostat,
  Favorite,
  Air,
  MonitorHeart,
  Height,
  FitnessCenter,
} from '@mui/icons-material';
import { encountersAPI, patientsAPI, handleAPIError } from '../services/api';
import { CircularProgress } from '@mui/material';

const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`encounter-tabpanel-${index}`}
      aria-labelledby={`encounter-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const EncounterDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [encounter, setEncounter] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [soapNotes, setSoapNotes] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  });
  const [vitalSigns, setVitalSigns] = useState({
    temperature: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    heart_rate: '',
    respiratory_rate: '',
    oxygen_saturation: '',
    height: '',
    weight: '',
  });

  useEffect(() => {
    fetchEncounter();
  }, [id]);

  const fetchEncounter = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching encounter with ID:', id);
      
      const response = await encountersAPI.getEncounter(id);
      const encData = response.data;
      console.log('Encounter data received:', encData);
      
      setEncounter(encData);
      
      // Fetch patient data
      console.log('Fetching patient with ID:', encData.patient_id);
      const patientResponse = await patientsAPI.getPatient(encData.patient_id);
      const patientData = patientResponse.data;
      console.log('Patient data received:', patientData);
      
      setPatient(patientData);
      
      // Set SOAP notes
      setSoapNotes({
        subjective: encData.subjective || '',
        objective: encData.objective || '',
        assessment: encData.assessment || '',
        plan: encData.plan || '',
      });
      
      // Set vital signs
      setVitalSigns({
        temperature: encData.temperature || '',
        blood_pressure_systolic: encData.blood_pressure_systolic || '',
        blood_pressure_diastolic: encData.blood_pressure_diastolic || '',
        heart_rate: encData.heart_rate || '',
        respiratory_rate: encData.respiratory_rate || '',
        oxygen_saturation: encData.oxygen_saturation || '',
        height: encData.height || '',
        weight: encData.weight || '',
      });
    } catch (err) {
      console.error('Error fetching encounter:', err);
      const errorData = handleAPIError(err);
      console.error('Processed error:', errorData);
      setError(`データの取得に失敗しました: ${errorData.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEditToggle = async () => {
    if (editMode) {
      // Save changes
      await handleSave();
    } else {
      setEditMode(true);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Update SOAP notes
      await encountersAPI.updateSOAPNotes(id, soapNotes);
      
      // Update vital signs
      await encountersAPI.updateVitalSigns(id, vitalSigns);
      
      // Refresh encounter data
      await fetchEncounter();
      setEditMode(false);
    } catch (err) {
      const errorData = handleAPIError(err);
      setError(errorData.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSoapChange = (field) => (event) => {
    setSoapNotes({
      ...soapNotes,
      [field]: event.target.value,
    });
  };

  const handleVitalSignChange = (field) => (event) => {
    setVitalSigns({
      ...vitalSigns,
      [field]: event.target.value,
    });
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('ja-JP'),
      time: date.toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
    };
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'finished':
        return <Chip label="完了" color="success" />;
      case 'in-progress':
        return <Chip label="診療中" color="warning" />;
      case 'planned':
        return <Chip label="予定" color="info" />;
      default:
        return <Chip label={status} />;
    }
  };

  const calculateBMI = () => {
    const height = parseFloat(vitalSigns.height || encounter?.height);
    const weight = parseFloat(vitalSigns.weight || encounter?.weight);
    if (height && weight) {
      const heightM = height / 100;
      return (weight / (heightM * heightM)).toFixed(1);
    }
    return null;
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

  if (!encounter || !patient) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        診療記録が見つかりません。
      </Alert>
    );
  }

  const startDateTime = formatDateTime(encounter.start_time);
  const endDateTime = encounter.end_time ? formatDateTime(encounter.end_time) : null;

  const getGenderText = (gender) => {
    switch(gender) {
      case 'male': return '男性';
      case 'female': return '女性';
      case 'MALE': return '男性';
      case 'FEMALE': return '女性';
      case 'OTHER': return 'その他';
      default: return gender;
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

  return (
    <Box>
      {/* Encounter Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar sx={{ width: 60, height: 60 }}>
                <Assignment />
              </Avatar>
            </Grid>
            <Grid item xs>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h4">
                  診療記録
                </Typography>
                <Chip
                  label={encounter.encounter_id}
                  color="primary"
                  variant="outlined"
                />
                {getStatusChip(encounter.status)}
              </Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {encounter.chief_complaint}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body1">
                  患者: {patient ? `${patient.first_name} ${patient.last_name} (${patient.patient_id})` : '読み込み中...'}
                </Typography>
                <Typography variant="body1">
                  担当医ID: {encounter.practitioner_id}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                <CalendarToday sx={{ fontSize: 16 }} />
                <Typography variant="body2">
                  {startDateTime.date} {startDateTime.time}
                  {endDateTime && ` - ${endDateTime.time}`}
                </Typography>
              </Box>
            </Grid>
            <Grid item>
              <Button
                variant={editMode ? "contained" : "outlined"}
                startIcon={saving ? <CircularProgress size={16} /> : editMode ? <Save /> : <Edit />}
                onClick={handleEditToggle}
                disabled={saving}
                sx={{ mr: 1 }}
              >
                {saving ? '保存中...' : editMode ? '保存' : '編集'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<Print />}
              >
                印刷
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="SOAP記録" icon={<Assignment />} />
            <Tab label="バイタルサイン" icon={<MonitorHeart />} />
            <Tab label="患者情報" icon={<Person />} />
          </Tabs>
        </Box>

        {/* SOAP Notes Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                主訴
              </Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                {encounter.chief_complaint}
              </Alert>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom color="primary">
                S - Subjective (主観的情報)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={soapNotes.subjective}
                onChange={handleSoapChange('subjective')}
                disabled={!editMode}
                placeholder="患者の訴え、症状、病歴など"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom color="primary">
                O - Objective (客観的情報)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={soapNotes.objective}
                onChange={handleSoapChange('objective')}
                disabled={!editMode}
                placeholder="身体所見、検査結果、バイタルサインなど"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom color="primary">
                A - Assessment (評価・診断)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={soapNotes.assessment}
                onChange={handleSoapChange('assessment')}
                disabled={!editMode}
                placeholder="診断、病状評価、鑑別診断など"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom color="primary">
                P - Plan (計画)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={soapNotes.plan}
                onChange={handleSoapChange('plan')}
                disabled={!editMode}
                placeholder="治療計画、処方、次回予約など"
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Vital Signs Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                バイタルサイン
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Thermostat color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary="体温"
                    secondary={`${encounter.temperature}°C`}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Favorite color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary="血圧"
                    secondary={`${encounter.blood_pressure_systolic}/${encounter.blood_pressure_diastolic} mmHg`}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <MonitorHeart color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="脈拍"
                    secondary={`${encounter.heart_rate} bpm`}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Air color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="呼吸数"
                    secondary={`${encounter.respiratory_rate} /min`}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Air color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="酸素飽和度"
                    secondary={`${encounter.oxygen_saturation}%`}
                  />
                </ListItem>
              </List>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                身体測定
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Height color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="身長"
                    secondary={`${encounter.height} cm`}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <FitnessCenter color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="体重"
                    secondary={`${encounter.weight} kg`}
                  />
                </ListItem>
                
                {calculateBMI() && (
                  <ListItem>
                    <ListItemText
                      primary="BMI"
                      secondary={calculateBMI()}
                    />
                  </ListItem>
                )}
              </List>
              
              {/* Vital Signs Chart Placeholder */}
              <Paper sx={{ p: 2, mt: 2, textAlign: 'center', minHeight: 200 }}>
                <Typography variant="h6" color="text.secondary">
                  バイタルサイン推移グラフ
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  （実装予定）
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Patient Information Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                患者基本情報
              </Typography>
              {patient ? (
                <List>
                  <ListItem>
                    <ListItemText
                      primary="患者ID"
                      secondary={patient.patient_id}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="氏名"
                      secondary={patient.full_name}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="年齢"
                      secondary={`${calculateAge(patient.date_of_birth)}歳`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="性別"
                      secondary={getGenderText(patient.gender)}
                    />
                  </ListItem>
                </List>
              ) : (
                <Typography>患者情報を読み込み中...</Typography>
              )}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                担当医情報
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="担当医ID"
                    secondary={encounter.practitioner_id}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="診療科"
                    secondary="内科"
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default EncounterDetail;
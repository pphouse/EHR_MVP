import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  NavigateNext,
  NavigateBefore,
} from '@mui/icons-material';
import { encountersAPI, patientsAPI, handleAPIError } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const steps = ['基本情報', 'バイタルサイン', 'SOAP記録'];

const EncounterCreate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [patients, setPatients] = useState([]);
  
  const [encounterData, setEncounterData] = useState({
    patient_id: searchParams.get('patient_id') || '',
    practitioner_id: user?.id || '',
    status: 'PLANNED',
    encounter_class: 'AMBULATORY',
    start_time: new Date().toISOString().slice(0, 16),
    end_time: '',
    chief_complaint: '',
    history_present_illness: '',
    physical_examination: '',
    diagnosis_codes: '',
    notes: '',
    // Vital signs
    temperature: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    heart_rate: '',
    respiratory_rate: '',
    oxygen_saturation: '',
    height: '',
    weight: '',
    // SOAP notes
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      console.log('Fetching patients...');
      const response = await patientsAPI.getPatients({ limit: 1000 });
      console.log('Patients response:', response.data);
      setPatients(response.data);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
      const errorData = handleAPIError(err);
      setError(`患者リストの取得に失敗しました: ${errorData.message}`);
    }
  };

  const handleInputChange = (field) => (event) => {
    setEncounterData({
      ...encounterData,
      [field]: event.target.value,
    });
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await encountersAPI.createEncounter(encounterData);
      setSuccess(true);
      
      // Navigate to the created encounter
      setTimeout(() => {
        navigate(`/encounters/${response.data.id}`);
      }, 2000);
    } catch (err) {
      const errorData = handleAPIError(err);
      setError(errorData.message);
    } finally {
      setLoading(false);
    }
  };

  const renderBasicInfo = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth required>
          <InputLabel>患者</InputLabel>
          <Select
            value={encounterData.patient_id}
            onChange={handleInputChange('patient_id')}
            label="患者"
          >
            {patients.length > 0 ? (
              patients.map((patient) => (
                <MenuItem key={patient.id} value={patient.id}>
                  {patient.first_name} {patient.last_name} ({patient.patient_id})
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>患者データを読み込み中...</MenuItem>
            )}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth required>
          <InputLabel>診療クラス</InputLabel>
          <Select
            value={encounterData.encounter_class}
            onChange={handleInputChange('encounter_class')}
            label="診療クラス"
          >
            <MenuItem value="AMBULATORY">外来</MenuItem>
            <MenuItem value="INPATIENT">入院</MenuItem>
            <MenuItem value="EMERGENCY">救急</MenuItem>
            <MenuItem value="HOME">在宅</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          required
          label="開始日時"
          type="datetime-local"
          value={encounterData.start_time}
          onChange={handleInputChange('start_time')}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="終了日時"
          type="datetime-local"
          value={encounterData.end_time}
          onChange={handleInputChange('end_time')}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          label="主訴"
          value={encounterData.chief_complaint}
          onChange={handleInputChange('chief_complaint')}
          placeholder="患者の主訴を入力してください"
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="現病歴"
          multiline
          rows={3}
          value={encounterData.history_present_illness}
          onChange={handleInputChange('history_present_illness')}
          placeholder="現在の症状の経過を入力してください"
        />
      </Grid>
    </Grid>
  );

  const renderVitalSigns = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          バイタルサイン
        </Typography>
      </Grid>

      <Grid item xs={6} md={3}>
        <TextField
          fullWidth
          label="体温"
          type="number"
          value={encounterData.temperature}
          onChange={handleInputChange('temperature')}
          InputProps={{ endAdornment: '°C' }}
          inputProps={{ step: 0.1, min: 35, max: 42 }}
        />
      </Grid>

      <Grid item xs={6} md={3}>
        <TextField
          fullWidth
          label="収縮期血圧"
          type="number"
          value={encounterData.blood_pressure_systolic}
          onChange={handleInputChange('blood_pressure_systolic')}
          InputProps={{ endAdornment: 'mmHg' }}
          inputProps={{ min: 80, max: 250 }}
        />
      </Grid>

      <Grid item xs={6} md={3}>
        <TextField
          fullWidth
          label="拡張期血圧"
          type="number"
          value={encounterData.blood_pressure_diastolic}
          onChange={handleInputChange('blood_pressure_diastolic')}
          InputProps={{ endAdornment: 'mmHg' }}
          inputProps={{ min: 40, max: 150 }}
        />
      </Grid>

      <Grid item xs={6} md={3}>
        <TextField
          fullWidth
          label="脈拍"
          type="number"
          value={encounterData.heart_rate}
          onChange={handleInputChange('heart_rate')}
          InputProps={{ endAdornment: 'bpm' }}
          inputProps={{ min: 40, max: 200 }}
        />
      </Grid>

      <Grid item xs={6} md={3}>
        <TextField
          fullWidth
          label="呼吸数"
          type="number"
          value={encounterData.respiratory_rate}
          onChange={handleInputChange('respiratory_rate')}
          InputProps={{ endAdornment: '/min' }}
          inputProps={{ min: 8, max: 40 }}
        />
      </Grid>

      <Grid item xs={6} md={3}>
        <TextField
          fullWidth
          label="酸素飽和度"
          type="number"
          value={encounterData.oxygen_saturation}
          onChange={handleInputChange('oxygen_saturation')}
          InputProps={{ endAdornment: '%' }}
          inputProps={{ step: 0.1, min: 70, max: 100 }}
        />
      </Grid>

      <Grid item xs={6} md={3}>
        <TextField
          fullWidth
          label="身長"
          type="number"
          value={encounterData.height}
          onChange={handleInputChange('height')}
          InputProps={{ endAdornment: 'cm' }}
          inputProps={{ step: 0.1, min: 50, max: 250 }}
        />
      </Grid>

      <Grid item xs={6} md={3}>
        <TextField
          fullWidth
          label="体重"
          type="number"
          value={encounterData.weight}
          onChange={handleInputChange('weight')}
          InputProps={{ endAdornment: 'kg' }}
          inputProps={{ step: 0.1, min: 20, max: 300 }}
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          身体所見
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={encounterData.physical_examination}
          onChange={handleInputChange('physical_examination')}
          placeholder="身体診察の所見を入力してください"
        />
      </Grid>
    </Grid>
  );

  const renderSOAPNotes = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          SOAP記録
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <Typography variant="subtitle1" color="primary" gutterBottom>
          S - Subjective (主観的情報)
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={encounterData.subjective}
          onChange={handleInputChange('subjective')}
          placeholder="患者の訴え、症状、病歴など"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Typography variant="subtitle1" color="primary" gutterBottom>
          O - Objective (客観的情報)
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={encounterData.objective}
          onChange={handleInputChange('objective')}
          placeholder="身体所見、検査結果、バイタルサインなど"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Typography variant="subtitle1" color="primary" gutterBottom>
          A - Assessment (評価・診断)
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={encounterData.assessment}
          onChange={handleInputChange('assessment')}
          placeholder="診断、病状評価、鑑別診断など"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Typography variant="subtitle1" color="primary" gutterBottom>
          P - Plan (計画)
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={encounterData.plan}
          onChange={handleInputChange('plan')}
          placeholder="治療計画、処方、次回予約など"
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="診断コード"
          value={encounterData.diagnosis_codes}
          onChange={handleInputChange('diagnosis_codes')}
          placeholder="ICD-10コードなど"
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="その他のメモ"
          multiline
          rows={3}
          value={encounterData.notes}
          onChange={handleInputChange('notes')}
          placeholder="追加のメモや注意事項"
        />
      </Grid>
    </Grid>
  );

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return renderBasicInfo();
      case 1:
        return renderVitalSigns();
      case 2:
        return renderSOAPNotes();
      default:
        return 'Unknown step';
    }
  };

  const isStepValid = (step) => {
    switch (step) {
      case 0:
        return encounterData.patient_id && encounterData.start_time && encounterData.chief_complaint;
      case 1:
        return true; // Vital signs are optional
      case 2:
        return true; // SOAP notes are optional initially
      default:
        return false;
    }
  };

  if (success) {
    return (
      <Alert severity="success" sx={{ mb: 2 }}>
        診療記録が正常に作成されました。診療記録詳細ページに移動します...
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mr: 2 }}
        >
          戻る
        </Button>
        <Typography variant="h4">
          新しい診療記録の作成
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Stepper */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardContent>
          {getStepContent(activeStep)}

          {/* Navigation */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<NavigateBefore />}
            >
              戻る
            </Button>

            <Box>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading || !isStepValid(activeStep)}
                  startIcon={<Save />}
                >
                  {loading ? '作成中...' : '診療記録を作成'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!isStepValid(activeStep)}
                  endIcon={<NavigateNext />}
                >
                  次へ
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EncounterCreate;
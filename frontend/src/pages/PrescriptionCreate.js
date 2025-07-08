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
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Divider,
  Chip,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Add,
  Delete,
  Search,
} from '@mui/icons-material';
import { prescriptionsAPI, medicationsAPI, patientsAPI, encountersAPI, handleAPIError } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNotificationSound } from '../hooks/useNotificationSound';

const PrescriptionCreate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { playNewPrescription, playError, playSave } = useNotificationSound();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [patients, setPatients] = useState([]);
  const [encounters, setEncounters] = useState([]);
  const [medications, setMedications] = useState([]);
  const [medicationSearch, setMedicationSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  const [prescriptionData, setPrescriptionData] = useState({
    patient_id: searchParams.get('patient_id') || '',
    encounter_id: searchParams.get('encounter_id') || '',
    prescription_date: new Date().toISOString().slice(0, 10),
    instructions: '',
    notes: '',
    prescription_items: []
  });

  useEffect(() => {
    fetchPatients();
    if (prescriptionData.patient_id) {
      fetchPatientEncounters(prescriptionData.patient_id);
    }
  }, [prescriptionData.patient_id]);

  const fetchPatients = async () => {
    try {
      const response = await patientsAPI.getPatients({ limit: 1000 });
      setPatients(response.data || []);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
      setPatients([]);
    }
  };

  const fetchPatientEncounters = async (patientId) => {
    try {
      const response = await encountersAPI.getPatientEncounters(patientId, { limit: 50 });
      setEncounters(response.data || []);
    } catch (err) {
      console.error('Failed to fetch encounters:', err);
      setEncounters([]);
    }
  };

  const searchMedications = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      const response = await medicationsAPI.searchMedications({ 
        query, 
        limit: 20,
        is_active: true 
      });
      setSearchResults(response.data?.items || []);
    } catch (err) {
      console.error('Failed to search medications:', err);
      setSearchResults([]);
    }
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setPrescriptionData({
      ...prescriptionData,
      [field]: value,
    });
    
    if (field === 'patient_id' && value) {
      fetchPatientEncounters(value);
    }
  };

  const handleMedicationSearchChange = (event) => {
    const value = event.target.value;
    setMedicationSearch(value);
    searchMedications(value);
  };

  const addMedication = (medication) => {
    console.log('🔥 addMedication called with:', medication);
    console.log('🔥 Current prescription_items:', prescriptionData.prescription_items);
    
    const newItem = {
      id: Date.now(),
      medication_id: medication.id,
      medication: medication,
      quantity: 1,
      dosage: '',
      unit: medication.form || 'tablet',
      frequency: '',
      duration_days: 7,
      instructions: '',
    };
    
    console.log('🔥 New item to add:', newItem);
    
    const updatedData = {
      ...prescriptionData,
      prescription_items: [...prescriptionData.prescription_items, newItem]
    };
    
    console.log('🔥 Updated prescription data:', updatedData);
    
    setPrescriptionData(updatedData);
    
    setMedicationSearch('');
    setSearchResults([]);
    
    console.log('🔥 addMedication completed');
  };

  const updatePrescriptionItem = (itemId, field, value) => {
    setPrescriptionData({
      ...prescriptionData,
      prescription_items: prescriptionData.prescription_items.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    });
  };

  const removePrescriptionItem = (itemId) => {
    setPrescriptionData({
      ...prescriptionData,
      prescription_items: prescriptionData.prescription_items.filter(item => item.id !== itemId)
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!prescriptionData.patient_id) {
        setError('患者を選択してください');
        return;
      }

      if (!prescriptionData.encounter_id) {
        setError('診療記録を選択してください');
        return;
      }

      if (prescriptionData.prescription_items.length === 0) {
        setError('少なくとも1つの薬剤を追加してください');
        return;
      }

      const cleanedData = {
        patient_id: parseInt(prescriptionData.patient_id),
        encounter_id: parseInt(prescriptionData.encounter_id),
        prescription_date: prescriptionData.prescription_date,
        instructions: prescriptionData.instructions || null,
        notes: prescriptionData.notes || null,
        prescription_items: prescriptionData.prescription_items.map(item => ({
          medication_id: item.medication_id,
          quantity: parseFloat(item.quantity) || 1,
          dosage: item.dosage || '',
          unit: item.unit || 'tablet',
          frequency: item.frequency || null,
          duration_days: parseInt(item.duration_days) || 7,
          instructions: item.instructions || null,
        }))
      };

      console.log('Submitting prescription data:', cleanedData);
      
      const response = await prescriptionsAPI.createPrescription(cleanedData);
      console.log('Prescription created successfully:', response.data);
      setSuccess(true);
      playNewPrescription();
      
      setTimeout(() => {
        navigate('/prescriptions');
      }, 2000);
      
    } catch (err) {
      console.error('Submit error:', err);
      const errorData = handleAPIError(err);
      setError(errorData.message);
      playError();
    } finally {
      setLoading(false);
    }
  };

  const selectedPatient = patients.find(p => p.id === parseInt(prescriptionData.patient_id));
  const selectedEncounter = encounters.find(e => e.id === parseInt(prescriptionData.encounter_id));

  if (success) {
    return (
      <Alert severity="success" sx={{ mb: 2 }}>
        処方箋が正常に作成されました。処方箋一覧ページに移動します...
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
          新しい処方箋の作成
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {typeof error === 'string' ? error : JSON.stringify(error)}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                基本情報
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>患者</InputLabel>
                    <Select
                      value={prescriptionData.patient_id}
                      onChange={handleInputChange('patient_id')}
                      label="患者"
                    >
                      {patients.map((patient) => (
                        <MenuItem key={patient.id} value={patient.id}>
                          {patient.full_name || `${patient.first_name} ${patient.last_name}`} ({patient.patient_id})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>診療記録</InputLabel>
                    <Select
                      value={prescriptionData.encounter_id}
                      onChange={handleInputChange('encounter_id')}
                      label="診療記録"
                      disabled={!prescriptionData.patient_id}
                    >
                      {encounters.map((encounter) => (
                        <MenuItem key={encounter.id} value={encounter.id}>
                          {encounter.encounter_id} - {encounter.chief_complaint} ({new Date(encounter.start_time).toLocaleDateString()})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="処方日"
                    type="date"
                    value={prescriptionData.prescription_date}
                    onChange={handleInputChange('prescription_date')}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="処方指示"
                    multiline
                    rows={2}
                    value={prescriptionData.instructions}
                    onChange={handleInputChange('instructions')}
                    placeholder="全体的な服薬指示を入力してください"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Patient & Encounter Info */}
        {(selectedPatient || selectedEncounter) && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  選択された情報
                </Typography>
                
                {selectedPatient && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" color="primary">
                      患者情報
                    </Typography>
                    <Typography>
                      {selectedPatient.full_name || `${selectedPatient.first_name} ${selectedPatient.last_name}`} 
                      ({selectedPatient.patient_id})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      生年月日: {selectedPatient.date_of_birth} | 
                      性別: {selectedPatient.gender === 'male' ? '男性' : '女性'}
                    </Typography>
                  </Box>
                )}

                {selectedEncounter && (
                  <Box>
                    <Typography variant="subtitle1" color="primary">
                      診療記録
                    </Typography>
                    <Typography>
                      {selectedEncounter.encounter_id} - {selectedEncounter.chief_complaint}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      診療日: {new Date(selectedEncounter.start_time).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Medication Search */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                薬剤検索・追加
              </Typography>
              
              <TextField
                fullWidth
                label="薬剤名で検索"
                value={medicationSearch}
                onChange={handleMedicationSearchChange}
                placeholder="薬剤名、一般名、商品名で検索してください"
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                sx={{ mb: 2 }}
              />

              {searchResults.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    検索結果 ({searchResults.length}件)
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>薬剤名</TableCell>
                          <TableCell>剤形</TableCell>
                          <TableCell>分類</TableCell>
                          <TableCell>単価</TableCell>
                          <TableCell>アクション</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {searchResults.map((medication) => (
                          <TableRow key={medication.id}>
                            <TableCell>
                              <Box>
                                <Typography variant="body2">
                                  {medication.drug_name}
                                </Typography>
                                {medication.generic_name && (
                                  <Typography variant="caption" color="text.secondary">
                                    {medication.generic_name}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>{medication.form}</TableCell>
                            <TableCell>{medication.category}</TableCell>
                            <TableCell>¥{medication.unit_price || 0}</TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                startIcon={<Add />}
                                onClick={() => addMedication(medication)}
                                disabled={prescriptionData.prescription_items.some(item => item.medication_id === medication.id)}
                              >
                                追加
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Prescription Items */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                処方薬剤 ({prescriptionData.prescription_items.length}件)
              </Typography>
              
              {prescriptionData.prescription_items.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  処方する薬剤を上記の検索から追加してください
                </Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>薬剤名</TableCell>
                        <TableCell>用量</TableCell>
                        <TableCell>単位</TableCell>
                        <TableCell>頻度</TableCell>
                        <TableCell>数量</TableCell>
                        <TableCell>日数</TableCell>
                        <TableCell>服薬指示</TableCell>
                        <TableCell>アクション</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {prescriptionData.prescription_items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">
                                {item.medication.drug_name}
                              </Typography>
                              <Chip
                                label={item.medication.form}
                                size="small"
                                variant="outlined"
                                sx={{ mt: 0.5 }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={item.dosage}
                              onChange={(e) => updatePrescriptionItem(item.id, 'dosage', e.target.value)}
                              placeholder="1"
                              sx={{ width: 60 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={item.unit}
                              onChange={(e) => updatePrescriptionItem(item.id, 'unit', e.target.value)}
                              placeholder="錠"
                              sx={{ width: 60 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={item.frequency}
                              onChange={(e) => updatePrescriptionItem(item.id, 'frequency', e.target.value)}
                              placeholder="1日3回"
                              sx={{ width: 100 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updatePrescriptionItem(item.id, 'quantity', e.target.value)}
                              inputProps={{ min: 1, step: 1 }}
                              sx={{ width: 80 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={item.duration_days}
                              onChange={(e) => updatePrescriptionItem(item.id, 'duration_days', e.target.value)}
                              inputProps={{ min: 1, step: 1 }}
                              sx={{ width: 80 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={item.instructions}
                              onChange={(e) => updatePrescriptionItem(item.id, 'instructions', e.target.value)}
                              placeholder="食後服用"
                              sx={{ width: 120 }}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removePrescriptionItem(item.id)}
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Notes */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                備考・注意事項
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                value={prescriptionData.notes}
                onChange={handleInputChange('notes')}
                placeholder="処方に関する備考や注意事項を入力してください"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Submit Button */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
            >
              キャンセル
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading || !prescriptionData.patient_id || !prescriptionData.encounter_id || prescriptionData.prescription_items.length === 0}
              startIcon={<Save />}
            >
              {loading ? '作成中...' : '処方箋を作成'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PrescriptionCreate;
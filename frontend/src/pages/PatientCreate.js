import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Save,
  Cancel,
  PersonAdd,
} from '@mui/icons-material';
import { useNotificationSound } from '../hooks/useNotificationSound';
import { patientsAPI, handleAPIError } from '../services/api';

const PatientCreate = () => {
  const navigate = useNavigate();
  const { playNewPatient, playError, playWarning } = useNotificationSound();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    lastNameKana: '',
    firstNameKana: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    medicalHistory: '',
    allergies: '',
    currentMedications: '',
  });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    const required = ['lastName', 'firstName', 'lastNameKana', 'firstNameKana', 'phone', 'dateOfBirth', 'gender'];
    const missing = required.filter(field => !formData[field]);
    
    if (missing.length > 0) {
      setError(`必須項目が未入力です: ${missing.join(', ')}`);
      playWarning();
      return false;
    }

    // Phone number validation
    const phoneRegex = /^[\d-]+$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('電話番号の形式が正しくありません');
      playWarning();
      return false;
    }

    // Email validation (if provided)
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('メールアドレスの形式が正しくありません');
        playWarning();
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 実際のAPI呼び出しを実行
      console.log('Patient data to be saved:', formData);
      
      // APIデータ形式に変換
      const apiData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        first_name_kana: formData.firstNameKana,
        last_name_kana: formData.lastNameKana,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        phone: formData.phone,
        email: formData.email || null,
        address: formData.address || null,
        emergency_contact: formData.emergencyContact || null,
        emergency_phone: formData.emergencyPhone || null,
        medical_history: formData.medicalHistory || null,
        allergies: formData.allergies || null,
        current_medications: formData.currentMedications || null,
      };
      
      const response = await patientsAPI.createPatient(apiData);
      console.log('Patient created successfully:', response.data);
      
      setSuccess('患者が正常に登録されました');
      playNewPatient();
      
      // Navigate back to patients list after a short delay
      setTimeout(() => {
        navigate('/patients');
      }, 2000);
      
    } catch (err) {
      console.error('Patient creation error:', err);
      const errorData = handleAPIError(err);
      setError('患者の登録に失敗しました: ' + errorData.message);
      playError();
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/patients');
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <PersonAdd sx={{ mr: 1, fontSize: 32 }} />
        <Typography variant="h4" component="h1">
          新規患者登録
        </Typography>
      </Box>

      <Card component={Paper} elevation={2}>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {/* Alert Messages */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {success}
              </Alert>
            )}

            {/* Basic Information */}
            <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2 }}>
              基本情報
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  name="lastName"
                  label="姓"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="田中"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  name="firstName"
                  label="名"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="太郎"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  name="lastNameKana"
                  label="姓（カナ）"
                  value={formData.lastNameKana}
                  onChange={handleInputChange}
                  placeholder="タナカ"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  name="firstNameKana"
                  label="名（カナ）"
                  value={formData.firstNameKana}
                  onChange={handleInputChange}
                  placeholder="タロウ"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  name="dateOfBirth"
                  label="生年月日"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>性別</InputLabel>
                  <Select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    label="性別"
                    data-testid="gender-select"
                  >
                    <MenuItem value="male">男性</MenuItem>
                    <MenuItem value="female">女性</MenuItem>
                    <MenuItem value="other">その他</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Contact Information */}
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              連絡先情報
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  name="phone"
                  label="電話番号"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="090-1234-5678"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="email"
                  label="メールアドレス"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="example@email.com"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="address"
                  label="住所"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="東京都渋谷区..."
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Emergency Contact */}
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              緊急連絡先
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="emergencyContact"
                  label="緊急連絡先（氏名）"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                  placeholder="田中花子"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="emergencyPhone"
                  label="緊急連絡先（電話番号）"
                  value={formData.emergencyPhone}
                  onChange={handleInputChange}
                  placeholder="080-9876-5432"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Medical Information */}
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              医療情報
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="medicalHistory"
                  label="既往歴"
                  value={formData.medicalHistory}
                  onChange={handleInputChange}
                  placeholder="高血圧、糖尿病など"
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="allergies"
                  label="アレルギー"
                  value={formData.allergies}
                  onChange={handleInputChange}
                  placeholder="ペニシリン、卵など"
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="currentMedications"
                  label="現在の服薬"
                  value={formData.currentMedications}
                  onChange={handleInputChange}
                  placeholder="降圧剤、インスリンなど"
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
                startIcon={<Cancel />}
                disabled={loading}
              >
                キャンセル
              </Button>
              <Button
                variant="contained"
                type="submit"
                startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                disabled={loading}
              >
                {loading ? '登録中...' : '保存'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PatientCreate;
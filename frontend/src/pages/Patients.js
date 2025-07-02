import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  InputAdornment,
  TablePagination,
  Fab,
  Tooltip,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Visibility,
  People,
  Phone,
  CalendarToday,
  Assignment,
} from '@mui/icons-material';
import { patientsAPI, handleAPIError } from '../services/api';

// Sample data - in real app, this would come from API
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
    is_active: '1',
  },
];

const Patients = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // 患者データを取得する関数
  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await patientsAPI.getPatients();
      console.log('Patients API response:', response.data);
      setPatients(response.data || []);
    } catch (err) {
      console.error('Error fetching patients:', err);
      const errorData = handleAPIError(err);
      setError(errorData.message);
      
      // フォールバック: エラーの場合はサンプルデータを使用
      console.log('フォールバック: サンプルデータを使用します');
      setPatients(samplePatients);
    } finally {
      setLoading(false);
    }
  };

  // コンポーネントマウント時にデータを取得
  useEffect(() => {
    fetchPatients();
  }, []);

  // location が変わった時にデータを再取得（患者登録後に戻ってきた場合など）
  useEffect(() => {
    if (location.pathname === '/patients') {
      fetchPatients();
    }
  }, [location]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const filteredPatients = patients.filter((patient) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.patient_id.toLowerCase().includes(searchLower) ||
      patient.first_name.toLowerCase().includes(searchLower) ||
      patient.last_name.toLowerCase().includes(searchLower) ||
      patient.first_name_kana.toLowerCase().includes(searchLower) ||
      patient.last_name_kana.toLowerCase().includes(searchLower) ||
      patient.phone.includes(searchTerm)
    );
  });

  const paginatedPatients = filteredPatients.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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

  const getGenderChip = (gender) => {
    return gender === 'male' ? (
      <Chip label="男性" color="primary" size="small" />
    ) : (
      <Chip label="女性" color="secondary" size="small" />
    );
  };

  const handleViewPatient = (patientId) => {
    navigate(`/patients/${patientId}`);
  };

  const handleCreateEncounter = (patientId) => {
    navigate(`/encounters/create?patient_id=${patientId}`);
  };

  const handleAddPatient = () => {
    navigate('/patients/create');
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <People sx={{ mr: 1, fontSize: 32 }} />
          <Typography variant="h4" component="h1">
            患者管理
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddPatient}
          size="large"
        >
          新規患者登録
        </Button>
      </Box>

      {/* Search and Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                患者検索
              </Typography>
              <TextField
                fullWidth
                placeholder="患者ID、氏名、カナ、電話番号で検索"
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                患者数
              </Typography>
              <Typography variant="h3" color="primary">
                {filteredPatients.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                検索結果 / 総患者数: {patients.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Patients Table */}
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>患者ID</TableCell>
                <TableCell>氏名</TableCell>
                <TableCell>カナ</TableCell>
                <TableCell>年齢</TableCell>
                <TableCell>性別</TableCell>
                <TableCell>電話番号</TableCell>
                <TableCell>生年月日</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedPatients.map((patient) => (
                <TableRow key={patient.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {patient.patient_id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1">
                      {patient.last_name} {patient.first_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {patient.last_name_kana} {patient.first_name_kana}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1">
                      {calculateAge(patient.date_of_birth)}歳
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getGenderChip(patient.gender)}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Phone sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                      {patient.phone}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarToday sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                      {patient.date_of_birth}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="詳細表示">
                      <IconButton
                        color="primary"
                        onClick={() => handleViewPatient(patient.id)}
                        size="small"
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="編集">
                      <IconButton
                        color="secondary"
                        size="small"
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="診療録作成">
                      <IconButton
                        color="success"
                        onClick={() => handleCreateEncounter(patient.id)}
                        size="small"
                      >
                        <Assignment />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredPatients.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="表示件数:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} / ${count !== -1 ? count : `more than ${to}`}`
          }
        />
      </Card>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add patient"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleAddPatient}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default Patients;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Avatar,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Visibility,
  Assignment,
  Person,
  CalendarToday,
  FilterList,
} from '@mui/icons-material';
import { encountersAPI, handleAPIError } from '../services/api';
import { CircularProgress, Alert } from '@mui/material';

// Sample data - in real app, this would come from API
const sampleEncounters = [
  {
    id: 1,
    encounter_id: 'E000001',
    patient_id: 1,
    patient_name: '田中 太郎',
    patient_number: 'P000001',
    practitioner_name: '山田 医師',
    start_time: '2024-01-15T09:00:00',
    status: 'finished',
    encounter_class: 'ambulatory',
    chief_complaint: '定期検診',
    assessment: '高血圧症安定',
  },
  {
    id: 2,
    encounter_id: 'E000002',
    patient_id: 2,
    patient_name: '佐藤 花子',
    patient_number: 'P000002',
    practitioner_name: '田中 医師',
    start_time: '2024-01-15T10:30:00',
    status: 'in-progress',
    encounter_class: 'ambulatory',
    chief_complaint: '頭痛',
    assessment: '緊張性頭痛',
  },
  {
    id: 3,
    encounter_id: 'E000003',
    patient_id: 3,
    patient_name: '山田 次郎',
    patient_number: 'P000003',
    practitioner_name: '佐藤 医師',
    start_time: '2024-01-14T14:00:00',
    status: 'finished',
    encounter_class: 'ambulatory',
    chief_complaint: 'フォローアップ',
    assessment: '糖尿病管理良好',
  },
];

const encounterStatuses = [
  { value: '', label: 'すべて' },
  { value: 'planned', label: '予定' },
  { value: 'arrived', label: '到着' },
  { value: 'in-progress', label: '診療中' },
  { value: 'finished', label: '完了' },
  { value: 'cancelled', label: 'キャンセル' },
];

const Encounters = () => {
  const navigate = useNavigate();
  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchEncounters();
  }, []);

  const fetchEncounters = async () => {
    try {
      setLoading(true);
      const response = await encountersAPI.getEncounters();
      setEncounters(response.data);
    } catch (err) {
      const errorData = handleAPIError(err);
      setError(errorData.message);
    } finally {
      setLoading(false);
    }
  };

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

  const handleStatusFilter = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const filteredEncounters = encounters.filter((encounter) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      encounter.encounter_id.toLowerCase().includes(searchLower) ||
      encounter.patient_name.toLowerCase().includes(searchLower) ||
      encounter.patient_number.toLowerCase().includes(searchLower) ||
      encounter.chief_complaint.toLowerCase().includes(searchLower) ||
      encounter.assessment.toLowerCase().includes(searchLower)
    );
    
    const matchesStatus = !statusFilter || encounter.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const paginatedEncounters = filteredEncounters.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getStatusChip = (status) => {
    switch (status) {
      case 'planned':
        return <Chip label="予定" color="info" size="small" />;
      case 'arrived':
        return <Chip label="到着" color="warning" size="small" />;
      case 'in-progress':
        return <Chip label="診療中" color="warning" size="small" />;
      case 'finished':
        return <Chip label="完了" color="success" size="small" />;
      case 'cancelled':
        return <Chip label="キャンセル" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
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

  const handleViewEncounter = (encounterId) => {
    navigate(`/encounters/${encounterId}`);
  };

  const handleAddEncounter = () => {
    navigate('/encounters/create');
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

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Assignment sx={{ mr: 1, fontSize: 32 }} />
          <Typography variant="h4" component="h1">
            診療記録
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddEncounter}
          size="large"
        >
          新規診療記録
        </Button>
      </Box>

      {/* Search and Filters */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                検索・フィルター
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    placeholder="診療記録ID、患者名、主訴で検索"
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
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>ステータス</InputLabel>
                    <Select
                      value={statusFilter}
                      label="ステータス"
                      onChange={handleStatusFilter}
                      startAdornment={
                        <InputAdornment position="start">
                          <FilterList />
                        </InputAdornment>
                      }
                    >
                      {encounterStatuses.map((status) => (
                        <MenuItem key={status.value} value={status.value}>
                          {status.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    本日の診療
                  </Typography>
                  <Typography variant="h3" color="primary">
                    {encounters.filter(e => e.start_time.startsWith('2024-01-15')).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    件
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    診療中
                  </Typography>
                  <Typography variant="h3" color="warning.main">
                    {encounters.filter(e => e.status === 'in-progress').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    件
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Encounters Table */}
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>診療記録ID</TableCell>
                <TableCell>患者</TableCell>
                <TableCell>担当医</TableCell>
                <TableCell>日時</TableCell>
                <TableCell>主訴</TableCell>
                <TableCell>診断</TableCell>
                <TableCell>ステータス</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedEncounters.map((encounter) => {
                const { date, time } = formatDateTime(encounter.start_time);
                return (
                  <TableRow key={encounter.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {encounter.encounter_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                          <Person />
                        </Avatar>
                        <Box>
                          <Typography variant="body1">
                            患者ID: {encounter.patient_id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1">
                        担当医ID: {encounter.practitioner_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarToday sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="body2">
                            {date}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {time}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1">
                        {encounter.chief_complaint}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {encounter.assessment}
                      </Typography>
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
                      <IconButton
                        color="secondary"
                        title="編集"
                      >
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredEncounters.length}
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
        aria-label="add encounter"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleAddEncounter}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default Encounters;
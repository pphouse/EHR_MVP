import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Collapse,
  List,
  ListItem,
} from '@mui/material';
import {
  Add,
  Visibility,
  Edit,
  Delete,
  MoreVert,
  LocalPharmacy,
  Assignment,
  ExpandMore,
  ExpandLess,
  Search,
  FilterList,
  Psychology,
} from '@mui/icons-material';
import { prescriptionsAPI, handleAPIError } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNotificationSound } from '../hooks/useNotificationSound';
import AIAssistant from '../components/AIAssistant';
import DiagnosisAssistant from '../components/DiagnosisAssistant';

const Prescriptions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { playDataLoad, playError } = useNotificationSound();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    date_from: '',
    date_to: '',
  });

  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const limit = 20;

  useEffect(() => {
    fetchPrescriptions();
    if (location.pathname === '/prescriptions') {
      playDataLoad();
    }
  }, [page, filters, location.pathname]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        limit,
        offset: (page - 1) * limit,
      };

      if (filters.status) params.status = filters.status;
      if (filters.date_from) params.prescription_date_from = filters.date_from + 'T00:00:00';
      if (filters.date_to) params.prescription_date_to = filters.date_to + 'T23:59:59';

      const response = await prescriptionsAPI.getPrescriptions(params);
      const data = response.data;
      
      setPrescriptions(data?.items || []);
      setTotalPages(Math.ceil((data?.total || 0) / limit));
      
    } catch (err) {
      console.error('Failed to fetch prescriptions:', err);
      const errorData = handleAPIError(err);
      setError(errorData.message);
      playError();
      
      // Fallback: mock data for demonstration
      const mockPrescriptions = [];
      setPrescriptions(mockPrescriptions);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field) => (event) => {
    setFilters({
      ...filters,
      [field]: event.target.value,
    });
    setPage(1);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const toggleRowExpansion = (prescriptionId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(prescriptionId)) {
      newExpanded.delete(prescriptionId);
    } else {
      newExpanded.add(prescriptionId);
    }
    setExpandedRows(newExpanded);
  };

  const handleMenuOpen = (event, prescription) => {
    setAnchorEl(event.currentTarget);
    setSelectedPrescription(prescription);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPrescription(null);
  };

  const handleViewPrescription = () => {
    if (selectedPrescription) {
      navigate(`/prescriptions/${selectedPrescription.id}`);
    }
    handleMenuClose();
  };

  const handleEditPrescription = () => {
    if (selectedPrescription) {
      navigate(`/prescriptions/${selectedPrescription.id}/edit`);
    }
    handleMenuClose();
  };

  const handleDispense = () => {
    if (selectedPrescription) {
      navigate(`/prescriptions/${selectedPrescription.id}/dispense`);
    }
    handleMenuClose();
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'pending': 'warning',
      'approved': 'info', 
      'dispensed': 'success',
      'partially_dispensed': 'secondary',
      'cancelled': 'error',
      'expired': 'default',
    };
    return statusColors[status] || 'default';
  };

  const getStatusText = (status) => {
    const statusTexts = {
      'pending': '処方待ち',
      'approved': '承認済み',
      'dispensed': '調剤完了',
      'partially_dispensed': '部分調剤',
      'cancelled': '中止',
      'expired': '期限切れ',
    };
    return statusTexts[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  if (success) {
    return (
      <Alert severity="success" sx={{ mb: 2 }}>
        操作が正常に完了しました。
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          処方箋管理
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Psychology />}
            onClick={() => setShowAIAssistant(!showAIAssistant)}
            color={showAIAssistant ? "primary" : "inherit"}
          >
            AI診断補助
          </Button>
          {(user?.role === 'doctor' || user?.role === 'admin') && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/prescriptions/create')}
            >
              新しい処方箋
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {typeof error === 'string' ? error : JSON.stringify(error)}
        </Alert>
      )}

      {/* AI Assistant for Diagnosis */}
      {showAIAssistant && (
        <Box sx={{ mb: 3 }}>
          <DiagnosisAssistant 
            patientContext={{
              context_type: "prescription_management"
            }}
            onDiagnosisGenerated={(diagnosis) => {
              console.log('Diagnosis generated:', diagnosis);
            }}
          />
          
          <Box sx={{ mt: 2 }}>
            <AIAssistant 
              context={{
                operation: "prescription_support",
                context_type: "prescription_management"
              }}
            />
          </Box>
        </Box>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <FilterList sx={{ mr: 1, verticalAlign: 'middle' }} />
            フィルター・検索
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>ステータス</InputLabel>
                <Select
                  value={filters.status}
                  onChange={handleFilterChange('status')}
                  label="ステータス"
                >
                  <MenuItem value="">すべて</MenuItem>
                  <MenuItem value="pending">処方待ち</MenuItem>
                  <MenuItem value="approved">承認済み</MenuItem>
                  <MenuItem value="dispensed">調剤完了</MenuItem>
                  <MenuItem value="partially_dispensed">部分調剤</MenuItem>
                  <MenuItem value="cancelled">中止</MenuItem>
                  <MenuItem value="expired">期限切れ</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="処方日（開始）"
                type="date"
                value={filters.date_from}
                onChange={handleFilterChange('date_from')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="処方日（終了）"
                type="date"
                value={filters.date_to}
                onChange={handleFilterChange('date_to')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setFilters({ status: '', search: '', date_from: '', date_to: '' });
                  setPage(1);
                }}
              >
                フィルターをクリア
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Prescriptions List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            処方箋一覧 ({prescriptions.length}件)
          </Typography>
          
          {loading ? (
            <Typography sx={{ textAlign: 'center', py: 3 }}>
              読み込み中...
            </Typography>
          ) : prescriptions.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              処方箋が見つかりませんでした
            </Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>処方箋番号</TableCell>
                    <TableCell>患者名</TableCell>
                    <TableCell>処方日</TableCell>
                    <TableCell>ステータス</TableCell>
                    <TableCell>処方者</TableCell>
                    <TableCell>薬剤数</TableCell>
                    <TableCell>総額</TableCell>
                    <TableCell>詳細</TableCell>
                    <TableCell>アクション</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {prescriptions.map((prescription) => (
                    <React.Fragment key={prescription.id}>
                      <TableRow hover>
                        <TableCell>
                          <Typography variant="body2">
                            {prescription.prescription_number}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {prescription.patient?.full_name || 
                             `${prescription.patient?.first_name} ${prescription.patient?.last_name}` ||
                             'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {prescription.patient?.patient_id}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatDate(prescription.prescription_date)}</TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusText(prescription.status)}
                            color={getStatusColor(prescription.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {prescription.prescriber?.full_name || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {prescription.prescription_items?.length || 0}
                        </TableCell>
                        <TableCell>
                          ¥{prescription.total_cost?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => toggleRowExpansion(prescription.id)}
                          >
                            {expandedRows.has(prescription.id) ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, prescription)}
                          >
                            <MoreVert />
                          </IconButton>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Row - Prescription Details */}
                      <TableRow>
                        <TableCell colSpan={9} sx={{ p: 0, border: 0 }}>
                          <Collapse in={expandedRows.has(prescription.id)}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                              <Typography variant="subtitle2" gutterBottom>
                                処方薬剤詳細
                              </Typography>
                              
                              {prescription.prescription_items && prescription.prescription_items.length > 0 ? (
                                <List dense>
                                  {prescription.prescription_items.map((item, index) => (
                                    <ListItem key={index} sx={{ py: 0.5 }}>
                                      <Grid container spacing={2}>
                                        <Grid item xs={4}>
                                          <Typography variant="body2">
                                            {item.medication?.drug_name || 'N/A'}
                                          </Typography>
                                          <Chip
                                            label={item.medication?.form || 'N/A'}
                                            size="small"
                                            variant="outlined"
                                          />
                                        </Grid>
                                        <Grid item xs={2}>
                                          <Typography variant="body2">
                                            {item.dosage || 'N/A'}
                                          </Typography>
                                        </Grid>
                                        <Grid item xs={2}>
                                          <Typography variant="body2">
                                            {item.frequency || 'N/A'}
                                          </Typography>
                                        </Grid>
                                        <Grid item xs={2}>
                                          <Typography variant="body2">
                                            {item.quantity}個 / {item.duration_days}日間
                                          </Typography>
                                        </Grid>
                                        <Grid item xs={2}>
                                          <Typography variant="body2">
                                            ¥{(item.total_cost || 0).toLocaleString()}
                                          </Typography>
                                        </Grid>
                                      </Grid>
                                    </ListItem>
                                  ))}
                                </List>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  処方薬剤の詳細情報がありません
                                </Typography>
                              )}

                              {prescription.instructions && (
                                <Box sx={{ mt: 2 }}>
                                  <Typography variant="subtitle2">処方指示:</Typography>
                                  <Typography variant="body2">{prescription.instructions}</Typography>
                                </Box>
                              )}

                              {prescription.notes && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="subtitle2">備考:</Typography>
                                  <Typography variant="body2">{prescription.notes}</Typography>
                                </Box>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewPrescription}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>詳細表示</ListItemText>
        </MenuItem>
        
        {(user?.role === 'doctor' || user?.role === 'admin') && (
          <MenuItem onClick={handleEditPrescription}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            <ListItemText>編集</ListItemText>
          </MenuItem>
        )}

        {(user?.role === 'pharmacist' || user?.role === 'admin') && 
         selectedPrescription?.status !== 'dispensed' && (
          <MenuItem onClick={handleDispense}>
            <ListItemIcon>
              <LocalPharmacy fontSize="small" />
            </ListItemIcon>
            <ListItemText>調剤処理</ListItemText>
          </MenuItem>
        )}

        <Divider />
        
        {(user?.role === 'doctor' || user?.role === 'admin') && 
         selectedPrescription?.status === 'pending' && (
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <Delete fontSize="small" />
            </ListItemIcon>
            <ListItemText>中止</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default Prescriptions;
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Psychology,
  ExpandMore,
  LocalHospital,
  Assignment,
  Warning,
  CheckCircle,
  ContentCopy,
  Science,
} from '@mui/icons-material';
import { aiAssistantAPI, handleAPIError } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const DiagnosisAssistant = ({ patientContext, onDiagnosisGenerated }) => {
  const { user } = useAuth();
  const [symptoms, setSymptoms] = useState('');
  const [patientInfo, setPatientInfo] = useState('');
  const [labResults, setLabResults] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleDiagnosisAssist = async () => {
    if (!symptoms.trim()) {
      setError('症状を入力してください');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await aiAssistantAPI.assistDiagnosis({
        symptoms: symptoms.split(',').map(s => s.trim()).filter(s => s),
        patient_context: {
          ...patientContext,
          additional_info: patientInfo
        },
        lab_results: labResults ? JSON.parse(labResults) : undefined
      });

      setResult(response.data);
      
      if (onDiagnosisGenerated) {
        onDiagnosisGenerated(response.data);
      }

    } catch (err) {
      console.error('Diagnosis assistance failed:', err);
      const errorData = handleAPIError(err);
      setError(errorData.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSummaryGeneration = async () => {
    if (!result) return;

    try {
      setLoading(true);
      
      const encounterData = {
        chief_complaint: symptoms,
        history_present_illness: patientInfo,
        assessment: result.differential_diagnoses?.map(d => d.diagnosis).join(', '),
        plan: result.differential_diagnoses?.map(d => 
          d.recommended_tests?.join(', ')
        ).join('; '),
        lab_results: labResults
      };

      const response = await aiAssistantAPI.generateSummary({
        encounter_data: encounterData,
        summary_type: 'diagnosis_summary',
        include_medications: true
      });

      setResult(prev => ({
        ...prev,
        generated_summary: response.data
      }));

    } catch (err) {
      console.error('Summary generation failed:', err);
      const errorData = handleAPIError(err);
      setError(errorData.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const getRiskColor = (probability) => {
    if (probability >= 0.7) return 'error';
    if (probability >= 0.5) return 'warning';
    if (probability >= 0.3) return 'info';
    return 'success';
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Psychology color="primary" />
          <Typography variant="h6">AI診断補助システム</Typography>
          {user?.role === 'doctor' || user?.role === 'admin' ? (
            <Chip label="利用可能" color="success" size="small" />
          ) : (
            <Chip label="医師・管理者のみ" color="warning" size="small" />
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="症状（カンマ区切りで入力）"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="発熱, 頭痛, 咳嗽, 呼吸困難..."
              helperText="患者の主な症状をカンマで区切って入力してください"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="患者情報・既往歴"
              value={patientInfo}
              onChange={(e) => setPatientInfo(e.target.value)}
              placeholder="年齢、性別、既往歴、服薬歴など..."
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="検査結果（JSON形式）"
              value={labResults}
              onChange={(e) => setLabResults(e.target.value)}
              placeholder='{"WBC": 12000, "CRP": 5.2, "体温": 38.5}'
              helperText="検査結果をJSON形式で入力（オプション）"
            />
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                onClick={handleDiagnosisAssist}
                disabled={loading || !symptoms.trim() || (user?.role !== 'doctor' && user?.role !== 'admin')}
                startIcon={<Psychology />}
              >
                {loading ? '分析中...' : 'AI診断補助実行'}
              </Button>
              
              {result && (
                <Button
                  variant="outlined"
                  onClick={handleSummaryGeneration}
                  disabled={loading}
                  startIcon={<Assignment />}
                >
                  診断サマリー生成
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>

        {result && (
          <Box mt={3}>
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              AI診断分析結果
            </Typography>

            {/* Safety Status */}
            <Box mb={2}>
              <Alert severity={result.safety_status?.risk_level === 'low' ? 'success' : 'warning'}>
                セーフティチェック: {result.safety_status?.risk_level?.toUpperCase()} 
                (信頼度: {(result.safety_status?.confidence * 100).toFixed(1)}%)
              </Alert>
            </Box>

            {/* Differential Diagnoses */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1">
                  <LocalHospital sx={{ mr: 1, verticalAlign: 'middle' }} />
                  鑑別診断候補
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {result.differential_diagnoses?.map((diagnosis, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Chip 
                          label={`${(diagnosis.probability * 100).toFixed(0)}%`}
                          color={getRiskColor(diagnosis.probability)}
                          size="small"
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={diagnosis.diagnosis}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              根拠: {diagnosis.reasoning}
                            </Typography>
                            {diagnosis.recommended_tests && (
                              <Box mt={1}>
                                <Typography variant="caption" color="primary">
                                  推奨検査: {diagnosis.recommended_tests.join(', ')}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  )) || (
                    <Typography color="text.secondary">
                      診断候補が生成されませんでした
                    </Typography>
                  )}
                </List>
              </AccordionDetails>
            </Accordion>

            {/* Generated Summary */}
            {result.generated_summary && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">
                    <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
                    生成された診断サマリー
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Typography variant="subtitle2">
                        構造化サマリー:
                      </Typography>
                      <Tooltip title="クリップボードにコピー">
                        <IconButton 
                          size="small"
                          onClick={() => copyToClipboard(JSON.stringify(result.generated_summary.summary, null, 2))}
                        >
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    {result.generated_summary.summary?.sections && (
                      <Grid container spacing={2}>
                        {Object.entries(result.generated_summary.summary.sections).map(([key, value]) => (
                          <Grid item xs={12} sm={6} key={key}>
                            <Typography variant="subtitle2" color="primary">
                              {key}:
                            </Typography>
                            <Typography variant="body2">
                              {value}
                            </Typography>
                          </Grid>
                        ))}
                      </Grid>
                    )}

                    <Box mt={2}>
                      <Typography variant="caption" color="text.secondary">
                        生成者: {result.generated_summary.metadata?.generated_by} | 
                        処理時間: {result.generated_summary.metadata?.processing_time_ms}ms |
                        セーフティレベル: {result.generated_summary.safety_status?.risk_level}
                      </Typography>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Recommendations */}
            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>
                推奨事項:
              </Typography>
              <List dense>
                {result.recommendations?.map((rec, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircle color="info" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={rec} />
                  </ListItem>
                )) || (
                  <Typography variant="body2" color="text.secondary">
                    追加の推奨事項はありません
                  </Typography>
                )}
              </List>
            </Box>

            {/* Disclaimer */}
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
                この診断補助結果は参考情報です。最終的な診断と治療方針は医師の総合的な判断により決定してください。
              </Typography>
            </Alert>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default DiagnosisAssistant;
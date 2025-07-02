import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  IconButton,
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  Description,
  ExpandMore,
  Download,
  Print,
  ContentCopy,
  Save,
  Preview,
  CheckCircle,
  Warning,
  Assignment,
} from '@mui/icons-material';
import { aiAssistantAPI, handleAPIError } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const DischargeSummaryGenerator = ({ encounterId, encounterData, onSummaryGenerated }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  
  const [encounterInfo, setEncounterInfo] = useState({
    chief_complaint: encounterData?.chief_complaint || '',
    history: encounterData?.history_present_illness || '',
    physical_exam: encounterData?.physical_examination || '',
    assessment: encounterData?.assessment || '',
    plan: encounterData?.plan || '',
    medications: encounterData?.medications || '',
    notes: encounterData?.notes || ''
  });

  const [options, setOptions] = useState({
    include_medications: true,
    include_follow_up: true,
    include_instructions: true,
    summary_type: 'discharge'
  });

  const handleGenerateSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      const requestData = {
        encounter_data: {
          encounter_id: encounterId,
          ...encounterInfo
        },
        summary_type: options.summary_type,
        include_medications: options.include_medications
      };

      console.log('Generating summary with:', requestData);

      const response = await aiAssistantAPI.generateSummary(requestData);
      
      setSummary(response.data);
      
      if (onSummaryGenerated) {
        onSummaryGenerated(response.data);
      }

    } catch (err) {
      console.error('Summary generation failed:', err);
      const errorData = handleAPIError(err);
      setError(errorData.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field) => (event) => {
    setEncounterInfo({
      ...encounterInfo,
      [field]: event.target.value
    });
  };

  const handleOptionChange = (option) => (event) => {
    setOptions({
      ...options,
      [option]: event.target.checked
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const generateStructuredText = (summaryData) => {
    if (!summaryData?.summary?.sections) return '';
    
    const sections = summaryData.summary.sections;
    
    return `
退院サマリー

患者情報: ${sections.patient_info || 'N/A'}
入院期間: ${sections.admission_period || 'N/A'}

主訴: ${sections.chief_complaint || 'N/A'}

現病歴・経過:
${sections.history || 'N/A'}

診断:
${sections.diagnosis || 'N/A'}

治療:
${sections.treatment || 'N/A'}

転帰・状態:
${sections.outcome || 'N/A'}

退院後指導・フォローアップ:
${sections.follow_up || 'N/A'}

作成日時: ${summaryData.metadata?.generated_at}
作成者: ${summaryData.metadata?.generated_by}
    `.trim();
  };

  const getSafetyStatusColor = (riskLevel) => {
    const colors = {
      'low': 'success',
      'medium': 'warning',
      'high': 'error',
      'critical': 'error'
    };
    return colors[riskLevel] || 'default';
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Description color="primary" />
          <Typography variant="h6">退院サマリー自動生成</Typography>
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

        {/* Input Section */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">診療情報入力</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="主訴"
                  value={encounterInfo.chief_complaint}
                  onChange={handleInputChange('chief_complaint')}
                  placeholder="患者の主な訴え"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="現病歴・経過"
                  value={encounterInfo.history}
                  onChange={handleInputChange('history')}
                  placeholder="症状の経過、入院の経緯など"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="身体所見"
                  value={encounterInfo.physical_exam}
                  onChange={handleInputChange('physical_exam')}
                  placeholder="身体診察の結果"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="評価・診断"
                  value={encounterInfo.assessment}
                  onChange={handleInputChange('assessment')}
                  placeholder="診断名、病状評価"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="治療・計画"
                  value={encounterInfo.plan}
                  onChange={handleInputChange('plan')}
                  placeholder="治療内容、今後の計画"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="処方薬剤"
                  value={encounterInfo.medications}
                  onChange={handleInputChange('medications')}
                  placeholder="処方された薬剤の詳細"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="追加メモ"
                  value={encounterInfo.notes}
                  onChange={handleInputChange('notes')}
                  placeholder="その他の特記事項"
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Options */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">生成オプション</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={options.include_medications}
                      onChange={handleOptionChange('include_medications')}
                    />
                  }
                  label="処方薬剤を含む"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={options.include_follow_up}
                      onChange={handleOptionChange('include_follow_up')}
                    />
                  }
                  label="フォローアップ指示を含む"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={options.include_instructions}
                      onChange={handleOptionChange('include_instructions')}
                    />
                  }
                  label="患者指導内容を含む"
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Generate Button */}
        <Box sx={{ mt: 2, mb: 2 }}>
          <Button
            variant="contained"
            onClick={handleGenerateSummary}
            disabled={loading || (user?.role !== 'doctor' && user?.role !== 'admin')}
            startIcon={loading ? <Assignment /> : <Description />}
            size="large"
          >
            {loading ? '生成中...' : '退院サマリー自動生成'}
          </Button>
        </Box>

        {/* Generated Summary */}
        {summary && (
          <Box>
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              生成された退院サマリー
            </Typography>

            {/* Safety Status */}
            {summary.safety_status && (
              <Alert 
                severity={summary.safety_status.risk_level === 'low' ? 'success' : 'warning'}
                sx={{ mb: 2 }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  {summary.safety_status.risk_level === 'low' ? 
                    <CheckCircle fontSize="small" /> : 
                    <Warning fontSize="small" />
                  }
                  セーフティチェック: {summary.safety_status.risk_level?.toUpperCase()} | 
                  実行されたアクション: {summary.safety_status.action_taken?.toUpperCase()} |
                  信頼度: {(summary.safety_status.confidence * 100).toFixed(1)}%
                </Box>
              </Alert>
            )}

            {/* Structured Summary Display */}
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
                <Typography variant="subtitle1" color="primary">
                  構造化サマリー
                </Typography>
                <Box>
                  <Tooltip title="クリップボードにコピー">
                    <IconButton 
                      size="small"
                      onClick={() => copyToClipboard(generateStructuredText(summary))}
                    >
                      <ContentCopy />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="プレビュー">
                    <IconButton size="small">
                      <Preview />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="印刷">
                    <IconButton size="small">
                      <Print />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="ダウンロード">
                    <IconButton size="small">
                      <Download />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {summary.summary?.sections && (
                <Grid container spacing={2}>
                  {Object.entries(summary.summary.sections).map(([key, value]) => (
                    <Grid item xs={12} sm={6} key={key}>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        {key.replace(/_/g, ' ').toUpperCase()}:
                      </Typography>
                      <Typography variant="body2" paragraph>
                        {value || 'N/A'}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
              )}

              {/* Keywords */}
              {summary.summary?.keywords && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    キーワード:
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {summary.summary.keywords.map((keyword, index) => (
                      <Chip key={index} label={keyword} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>

            {/* Metadata */}
            <Paper elevation={0} sx={{ bgcolor: 'grey.50', p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                生成情報:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    生成日時: {summary.metadata?.generated_at}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    生成者: {summary.metadata?.generated_by}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    サマリータイプ: {summary.metadata?.summary_type}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    処理時間: {summary.metadata?.processing_time_ms}ms
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Save Actions */}
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Save />}
                onClick={() => {
                  // TODO: Save to encounter record
                  console.log('Save summary to encounter');
                }}
              >
                診療記録に保存
              </Button>
              <Button
                variant="outlined"
                startIcon={<ContentCopy />}
                onClick={() => copyToClipboard(generateStructuredText(summary))}
              >
                全文コピー
              </Button>
            </Box>

            {/* Disclaimer */}
            <Alert severity="info" sx={{ mt: 2 }}>
              この退院サマリーはAIにより生成されたものです。内容を十分確認し、必要に応じて修正してからご使用ください。
            </Alert>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default DischargeSummaryGenerator;
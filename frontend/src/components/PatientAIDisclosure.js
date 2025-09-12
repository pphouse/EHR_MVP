import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Info as InfoIcon,
  Security as SecurityIcon,
  VerifiedUser as VerifiedUserIcon,
  HelpOutline as HelpIcon,
  LocalHospital as HospitalIcon,
  SmartToy as AIIcon,
} from '@mui/icons-material';

const PatientAIDisclosure = ({ open, onClose, language = 'ja' }) => {
  const content = {
    ja: {
      title: '診療におけるAI活用について',
      aiUsage: {
        title: '診断について',
        points: [
          'AI は診断の補助として使用されています',
          '最終的な診断は医師が行っています',
          'ご不明な点はお気軽にお尋ねください'
        ]
      },
      responsibility: {
        title: '責任の所在',
        main: '診断・治療の最終責任は担当医師にあります',
        sub: 'AI はあくまで診療を支援するツールです'
      },
      benefits: {
        title: 'AIを活用することのメリット',
        points: [
          '診断の精度向上：複数の視点から病状を分析',
          '見落としの防止：AIが気づいた点を医師が再確認',
          '最新の医学知識：常に更新される医療情報を参照',
          '効率的な診療：より多くの時間を患者様との対話に'
        ]
      },
      privacy: {
        title: 'プライバシー保護',
        points: [
          '個人情報は厳重に保護されています',
          'AIは匿名化されたデータのみを処理します',
          '第三者への情報提供は行いません'
        ]
      },
      understand: 'ご理解いただけました',
      moreInfo: '詳しく知りたい',
      close: '閉じる'
    },
    en: {
      title: 'About AI Usage in Medical Care',
      aiUsage: {
        title: 'About Diagnosis',
        points: [
          'AI is used as an assistant for diagnosis',
          'Final diagnosis is made by the physician',
          'Please feel free to ask if you have any questions'
        ]
      },
      responsibility: {
        title: 'Responsibility',
        main: 'The attending physician has final responsibility for diagnosis and treatment',
        sub: 'AI is merely a tool to support medical care'
      },
      benefits: {
        title: 'Benefits of Using AI',
        points: [
          'Improved diagnostic accuracy: Analysis from multiple perspectives',
          'Prevention of oversights: Physician reviews AI findings',
          'Latest medical knowledge: References constantly updated information',
          'Efficient care: More time for patient dialogue'
        ]
      },
      privacy: {
        title: 'Privacy Protection',
        points: [
          'Personal information is strictly protected',
          'AI processes only anonymized data',
          'No information is provided to third parties'
        ]
      },
      understand: 'I Understand',
      moreInfo: 'Learn More',
      close: 'Close'
    }
  };

  const t = content[language];

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ 
        backgroundColor: 'primary.main', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <AIIcon />
        {t.title}
      </DialogTitle>
      
      <DialogContent sx={{ mt: 2 }}>
        {/* AI使用について */}
        <Paper elevation={0} sx={{ p: 3, mb: 3, backgroundColor: 'grey.50' }}>
          <Box display="flex" alignItems="center" mb={2}>
            <InfoIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" color="primary">
              {t.aiUsage.title}
            </Typography>
          </Box>
          <List dense>
            {t.aiUsage.points.map((point, index) => (
              <ListItem key={index}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Typography color="primary">•</Typography>
                </ListItemIcon>
                <ListItemText 
                  primary={point}
                  primaryTypographyProps={{ fontSize: '1.1rem' }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* 責任の所在 */}
        <Alert 
          severity="info" 
          icon={<VerifiedUserIcon />}
          sx={{ mb: 3 }}
        >
          <Typography variant="h6" gutterBottom>
            {t.responsibility.title}
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {t.responsibility.main}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t.responsibility.sub}
          </Typography>
        </Alert>

        <Divider sx={{ my: 3 }} />

        {/* AIのメリット */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <HospitalIcon sx={{ mr: 1 }} color="success" />
            {t.benefits.title}
          </Typography>
          <List>
            {t.benefits.points.map((benefit, index) => (
              <ListItem key={index} sx={{ pl: 4 }}>
                <ListItemText 
                  primary={benefit}
                  primaryTypographyProps={{ 
                    fontSize: '0.95rem',
                    color: 'text.secondary' 
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* プライバシー保護 */}
        <Paper elevation={0} sx={{ p: 2, backgroundColor: 'info.lighter' }}>
          <Box display="flex" alignItems="center" mb={1}>
            <SecurityIcon color="info" sx={{ mr: 1 }} />
            <Typography variant="subtitle1" fontWeight="bold">
              {t.privacy.title}
            </Typography>
          </Box>
          <List dense sx={{ ml: 2 }}>
            {t.privacy.points.map((point, index) => (
              <ListItem key={index} disableGutters>
                <ListItemText 
                  primary={`• ${point}`}
                  primaryTypographyProps={{ fontSize: '0.9rem' }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<HelpIcon />}
          href="/ai-info"
          target="_blank"
        >
          {t.moreInfo}
        </Button>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{ minWidth: 150 }}
        >
          {t.understand}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// コンパクト版（診療画面に埋め込み用）
export const PatientAIDisclosureCompact = ({ language = 'ja' }) => {
  const [open, setOpen] = React.useState(false);

  const content = {
    ja: {
      title: 'AI診療支援について',
      message: 'この診療ではAIが診断を支援しています',
      details: '詳細を見る'
    },
    en: {
      title: 'About AI Medical Support',
      message: 'AI is assisting with diagnosis in this consultation',
      details: 'View Details'
    }
  };

  const t = content[language];

  return (
    <>
      <Alert 
        severity="info" 
        sx={{ 
          mb: 2,
          backgroundColor: 'rgba(25, 118, 210, 0.08)',
          '& .MuiAlert-icon': {
            color: 'info.main'
          }
        }}
        action={
          <Button 
            size="small" 
            onClick={() => setOpen(true)}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {t.details}
          </Button>
        }
      >
        <Typography variant="body2" fontWeight="medium">
          {t.title}
        </Typography>
        <Typography variant="body2">
          {t.message}
        </Typography>
      </Alert>

      <PatientAIDisclosure 
        open={open} 
        onClose={() => setOpen(false)}
        language={language}
      />
    </>
  );
};

export default PatientAIDisclosure;
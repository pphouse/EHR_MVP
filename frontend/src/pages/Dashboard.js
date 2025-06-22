import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Avatar,
  Divider,
} from '@mui/material';
import {
  People,
  Assignment,
  TrendingUp,
  Schedule,
  Person,
  CalendarToday,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

// Sample data - in real app, this would come from API
const dashboardStats = [
  {
    title: '本日の患者数',
    value: '24',
    icon: <People />,
    color: '#1976d2',
    change: '+12%',
  },
  {
    title: '新規診療記録',
    value: '18',
    icon: <Assignment />,
    color: '#2e7d32',
    change: '+8%',
  },
  {
    title: '今月の診療数',
    value: '156',
    icon: <TrendingUp />,
    color: '#ed6c02',
    change: '+15%',
  },
  {
    title: '予約待ち',
    value: '7',
    icon: <Schedule />,
    color: '#9c27b0',
    change: '-3%',
  },
];

const recentPatients = [
  {
    id: 1,
    name: '田中 太郎',
    age: 45,
    lastVisit: '2024-01-15',
    status: 'completed',
  },
  {
    id: 2,
    name: '佐藤 花子',
    age: 32,
    lastVisit: '2024-01-15',
    status: 'in-progress',
  },
  {
    id: 3,
    name: '山田 次郎',
    age: 67,
    lastVisit: '2024-01-14',
    status: 'scheduled',
  },
];

const StatCard = ({ title, value, icon, color, change }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="text.secondary" gutterBottom variant="h6">
            {title}
          </Typography>
          <Typography variant="h4" component="div" fontWeight="bold">
            {value}
          </Typography>
          <Typography variant="body2" color={change.startsWith('+') ? 'success.main' : 'error.main'}>
            {change} from last week
          </Typography>
        </Box>
        <Avatar
          sx={{
            backgroundColor: color,
            width: 56,
            height: 56,
          }}
        >
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const getStatusChip = (status) => {
  switch (status) {
    case 'completed':
      return <Chip label="完了" color="success" size="small" />;
    case 'in-progress':
      return <Chip label="診療中" color="warning" size="small" />;
    case 'scheduled':
      return <Chip label="予約済" color="info" size="small" />;
    default:
      return <Chip label={status} size="small" />;
  }
};

const Dashboard = () => {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'おはようございます';
    if (hour < 18) return 'こんにちは';
    return 'こんばんは';
  };

  return (
    <Box>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {getGreeting()}、{user?.full_name || user?.username}さん
        </Typography>
        <Typography variant="body1" color="text.secondary">
          本日の医療活動の概要です
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {dashboardStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Patients */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '400px' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Person sx={{ mr: 1 }} />
              最近の患者
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              {recentPatients.map((patient, index) => (
                <ListItem key={patient.id} divider={index < recentPatients.length - 1}>
                  <Avatar sx={{ mr: 2 }}>
                    {patient.name.charAt(0)}
                  </Avatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">{patient.name}</Typography>
                        {getStatusChip(patient.status)}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2">
                          年齢: {patient.age}歳
                        </Typography>
                        <Typography variant="body2">
                          最終来院: {patient.lastVisit}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Today's Schedule */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '400px' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <CalendarToday sx={{ mr: 1 }} />
              本日のスケジュール
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              <ListItem>
                <ListItemText
                  primary="09:00 - 定期検診"
                  secondary="田中 太郎 (P000001)"
                />
                <Chip label="完了" color="success" size="small" />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="10:30 - 新患診察"
                  secondary="佐藤 花子 (P000002)"
                />
                <Chip label="診療中" color="warning" size="small" />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="14:00 - フォローアップ"
                  secondary="山田 次郎 (P000003)"
                />
                <Chip label="予約済" color="info" size="small" />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="15:30 - 相談"
                  secondary="鈴木 美穂 (P000004)"
                />
                <Chip label="予約済" color="info" size="small" />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
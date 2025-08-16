import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  Divider,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Login() {
  const [tabValue, setTabValue] = useState(0);
  const [loginData, setLoginData] = useState({
    login: '',
    password: '',
  });
  const [registerData, setRegisterData] = useState({
    email: '',
    username: '',
    password: '',
    name: '',
  });

  const navigate = useNavigate();
  const { 
    login, 
    register, 
    isLoginLoading, 
    isRegisterLoading, 
    loginError, 
    registerError,
    isAuthenticated 
  } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/');
    return null;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(loginData, {
      onSuccess: () => {
        navigate('/');
      }
    });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    register(registerData, {
      onSuccess: () => {
        navigate('/');
      }
    });
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" align="center" gutterBottom>
            Agent Studio
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" align="center" paragraph>
            AI-Driven Development Framework
          </Typography>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
              <Tab label="Login" id="auth-tab-0" />
              <Tab label="Register" id="auth-tab-1" />
            </Tabs>
          </Box>

          {/* Login Tab */}
          <TabPanel value={tabValue} index={0}>
            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="Username or Email"
                value={loginData.login}
                onChange={(e) => setLoginData({ ...loginData, login: e.target.value })}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                type="password"
                label="Password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                margin="normal"
                required
              />
              
              {loginError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {(loginError as any)?.response?.data?.message || 'Login failed'}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3 }}
                disabled={isLoginLoading || !loginData.login || !loginData.password}
              >
                {isLoginLoading ? <CircularProgress size={24} /> : 'Login'}
              </Button>
            </form>
          </TabPanel>

          {/* Register Tab */}
          <TabPanel value={tabValue} index={1}>
            <form onSubmit={handleRegister}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Username"
                value={registerData.username}
                onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Full Name"
                value={registerData.name}
                onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                type="password"
                label="Password"
                value={registerData.password}
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                margin="normal"
                required
              />

              {registerError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {(registerError as any)?.response?.data?.message || 'Registration failed'}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3 }}
                disabled={isRegisterLoading || !registerData.email || !registerData.username || !registerData.password}
              >
                {isRegisterLoading ? <CircularProgress size={24} /> : 'Register'}
              </Button>
            </form>
          </TabPanel>

          <Divider sx={{ my: 3 }} />
          
          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Demo Account: username: <strong>demo</strong>, password: <strong>demo123</strong>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
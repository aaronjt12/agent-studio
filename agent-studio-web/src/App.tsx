import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CircularProgress, Box } from '@mui/material';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AgentWorkspace from './pages/AgentWorkspace';
import StoryManager from './pages/StoryManager';
import BMADWorkflows from './pages/BMADWorkflows';
import ExpansionPacks from './pages/ExpansionPacks';
import CodebaseFlattener from './pages/CodebaseFlattener';
import Projects from './pages/Projects';
import Login from './pages/Login';
import { useAuth } from './hooks/useAuth';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb',
    },
    secondary: {
      main: '#f59e0b',
    },
    background: {
      default: '#f8fafc',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/agents" element={<AgentWorkspace />} />
                      <Route path="/projects" element={<Projects />} />
                      <Route path="/stories" element={<StoryManager />} />
                      <Route path="/workflows" element={<BMADWorkflows />} />
                      <Route path="/expansion-packs" element={<ExpansionPacks />} />
                      <Route path="/codebase-flattener" element={<CodebaseFlattener />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

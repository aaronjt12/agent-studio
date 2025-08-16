import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  SmartToy as SmartToyIcon,
  Description as DescriptionIcon,
  FolderOpen as FolderOpenIcon,
  Extension as ExtensionIcon,
  Code as CodeIcon,
  GitHub as GitHubIcon,
  Terminal as TerminalIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Terminal from './Terminal';

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Projects', icon: <FolderOpenIcon />, path: '/projects' },
  { text: 'Agent Workspace', icon: <SmartToyIcon />, path: '/agents' },
  { text: 'Story Manager', icon: <DescriptionIcon />, path: '/stories' },
  { text: 'BMAD Workflows', icon: <CodeIcon />, path: '/workflows' },
  { text: 'Expansion Packs', icon: <ExtensionIcon />, path: '/expansion-packs' },
  { text: 'Codebase Flattener', icon: <CodeIcon />, path: '/codebase-flattener' },
];

export default function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleTerminalToggle = () => {
    setTerminalOpen(!terminalOpen);
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          BMAD Studio
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            BMAD Studio
          </Typography>
          <IconButton
            color="inherit"
            onClick={handleTerminalToggle}
            title="Open BMAD Terminal"
          >
            <TerminalIcon />
          </IconButton>
          <IconButton
            color="inherit"
            component="a"
            href="https://github.com/bmad-code-org/BMAD-METHOD"
            target="_blank"
            rel="noopener noreferrer"
            title="View on GitHub"
          >
            <GitHubIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mb: terminalOpen ? '400px' : 0,
          transition: 'margin-bottom 0.3s ease',
        }}
      >
        <Toolbar />
        {children}
      </Box>
      
      <Terminal 
        open={terminalOpen} 
        onClose={() => setTerminalOpen(false)}
        height={400}
      />
    </Box>
  );
}
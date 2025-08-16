import { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tabs,
  Tab,
  Paper,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  GetApp as GetAppIcon,
  Star as StarIcon,
  Business as BusinessIcon,
  School as SchoolIcon,
  Code as CodeIcon,
  FitnessCenter as HealthIcon,
  Create as CreateIcon,
} from '@mui/icons-material';

interface ExpansionPack {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'education' | 'creative' | 'development' | 'wellness';
  rating: number;
  downloads: number;
  author: string;
  version: string;
  installed: boolean;
  price: 'free' | 'premium';
  features: string[];
}

const mockExpansionPacks: ExpansionPack[] = [
  {
    id: '1',
    name: 'Agent Studio Business Strategy Pack',
    description: 'Specialized agents for business planning, market analysis, and strategic decision making',
    category: 'business',
    rating: 4.8,
    downloads: 1234,
    author: 'Agent Studio Team',
    version: '1.2.0',
    installed: true,
    price: 'free',
    features: ['Market Analysis Agent', 'Agent Studio Business Plan Generator', 'SWOT Analysis Tool', 'Financial Projections'],
  },
  {
    id: '2',
    name: 'Creative Writing Suite',
    description: 'AI agents specialized in creative writing, storytelling, and content creation',
    category: 'creative',
    rating: 4.6,
    downloads: 856,
    author: 'Creative Labs',
    version: '2.1.0',
    installed: false,
    price: 'premium',
    features: ['Story Structure Agent', 'Character Development', 'Plot Generator', 'Style Editor'],
  },
  {
    id: '3',
    name: 'Education Toolkit',
    description: 'Curriculum planning, lesson design, and educational content development agents',
    category: 'education',
    rating: 4.9,
    downloads: 2156,
    author: 'EduTech',
    version: '1.5.0',
    installed: false,
    price: 'free',
    features: ['Curriculum Planner', 'Assessment Creator', 'Learning Path Designer', 'Progress Tracker'],
  },
  {
    id: '4',
    name: 'Wellness & Health',
    description: 'Agents for wellness planning, health tracking, and lifestyle optimization',
    category: 'wellness',
    rating: 4.4,
    downloads: 634,
    author: 'WellnessAI',
    version: '1.0.3',
    installed: false,
    price: 'premium',
    features: ['Nutrition Planner', 'Workout Designer', 'Mental Health Tracker', 'Goal Setting'],
  },
  {
    id: '5',
    name: 'Advanced Development',
    description: 'Specialized development agents for complex software architecture and DevOps',
    category: 'development',
    rating: 4.7,
    downloads: 1893,
    author: 'DevOps Pro',
    version: '3.0.0',
    installed: true,
    price: 'premium',
    features: ['Architecture Reviewer', 'Security Auditor', 'Performance Optimizer', 'CI/CD Designer'],
  },
];

const categoryIcons = {
  business: <BusinessIcon />,
  education: <SchoolIcon />,
  creative: <CreateIcon />,
  development: <CodeIcon />,
  wellness: <HealthIcon />,
};

export default function ExpansionPacks() {
  const [packs, setPacks] = useState<ExpansionPack[]>(mockExpansionPacks);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPack, setSelectedPack] = useState<ExpansionPack | null>(null);

  const categories = [
    { value: 'all', label: 'All Packs' },
    { value: 'business', label: 'Agent Studio Business' },
    { value: 'creative', label: 'Creative' },
    { value: 'education', label: 'Education' },
    { value: 'development', label: 'Development' },
    { value: 'wellness', label: 'Wellness' },
  ];

  const filteredPacks = packs.filter(pack => {
    const matchesSearch = pack.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pack.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = tabValue === 0 || pack.category === categories[tabValue].value;
    return matchesSearch && matchesCategory;
  });

  const handleInstall = (packId: string) => {
    setPacks(packs.map(pack => 
      pack.id === packId ? { ...pack, installed: true, downloads: pack.downloads + 1 } : pack
    ));
  };

  const handleUninstall = (packId: string) => {
    setPacks(packs.map(pack => 
      pack.id === packId ? { ...pack, installed: false } : pack
    ));
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Expansion Packs
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Extend Agent Studio Method with specialized agent packs for different domains and use cases
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search expansion packs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <Box sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          {categories.map((category) => (
            <Tab key={category.value} label={category.label} />
          ))}
        </Tabs>
      </Box>

      <Grid container spacing={3}>
        {filteredPacks.map((pack) => (
          <Grid item xs={12} sm={6} md={4} key={pack.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    {categoryIcons[pack.category]}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" noWrap>
                      {pack.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      by {pack.author} • v{pack.version}
                    </Typography>
                  </Box>
                  <Chip
                    label={pack.price}
                    color={pack.price === 'free' ? 'success' : 'primary'}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" paragraph>
                  {pack.description}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Rating value={pack.rating} readOnly size="small" />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    ({pack.rating}) • {pack.downloads.toLocaleString()} downloads
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Key Features:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {pack.features.slice(0, 2).map((feature, idx) => (
                      <Chip key={idx} label={feature} size="small" variant="outlined" />
                    ))}
                    {pack.features.length > 2 && (
                      <Chip
                        label={`+${pack.features.length - 2} more`}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    )}
                  </Box>
                </Box>
              </CardContent>

              <Box sx={{ p: 2, pt: 0 }}>
                {pack.installed ? (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => handleUninstall(pack.id)}
                    >
                      Uninstall
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      disabled
                      sx={{ minWidth: 100 }}
                    >
                      Installed
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => setSelectedPack(pack)}
                    >
                      Details
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<GetAppIcon />}
                      onClick={() => handleInstall(pack.id)}
                      sx={{ minWidth: 100 }}
                    >
                      Install
                    </Button>
                  </Box>
                )}
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog 
        open={!!selectedPack} 
        onClose={() => setSelectedPack(null)} 
        maxWidth="md" 
        fullWidth
      >
        {selectedPack && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  {categoryIcons[selectedPack.category]}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedPack.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    by {selectedPack.author} • v{selectedPack.version}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" paragraph>
                {selectedPack.description}
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Rating value={selectedPack.rating} readOnly />
                <Typography variant="body2" color="text.secondary">
                  {selectedPack.rating} out of 5 stars ({selectedPack.downloads.toLocaleString()} downloads)
                </Typography>
              </Box>

              <Typography variant="h6" gutterBottom>
                Features Included:
              </Typography>
              <List>
                {selectedPack.features.map((feature, index) => (
                  <ListItem key={index}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'success.main', width: 24, height: 24 }}>
                        <StarIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={feature} />
                  </ListItem>
                ))}
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedPack(null)}>
                Close
              </Button>
              <Button 
                variant="contained" 
                startIcon={<GetAppIcon />}
                onClick={() => {
                  handleInstall(selectedPack.id);
                  setSelectedPack(null);
                }}
              >
                Install Pack
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
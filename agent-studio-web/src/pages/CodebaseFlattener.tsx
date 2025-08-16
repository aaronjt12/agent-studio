import { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  FolderOpen as FolderOpenIcon,
  PlayArrow as PlayArrowIcon,
  Download as DownloadIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  ExpandMore as ExpandMoreIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';

interface FileItem {
  name: string;
  type: 'file' | 'folder';
  path: string;
  size?: number;
  included: boolean;
  children?: FileItem[];
}

const mockFileStructure: FileItem[] = [
  {
    name: 'src',
    type: 'folder',
    path: '/src',
    included: true,
    children: [
      { name: 'components', type: 'folder', path: '/src/components', included: true },
      { name: 'pages', type: 'folder', path: '/src/pages', included: true },
      { name: 'utils', type: 'folder', path: '/src/utils', included: true },
      { name: 'App.tsx', type: 'file', path: '/src/App.tsx', size: 2048, included: true },
      { name: 'main.tsx', type: 'file', path: '/src/main.tsx', size: 512, included: true },
    ],
  },
  {
    name: 'public',
    type: 'folder',
    path: '/public',
    included: false,
    children: [
      { name: 'index.html', type: 'file', path: '/public/index.html', size: 1024, included: false },
    ],
  },
  { name: 'package.json', type: 'file', path: '/package.json', size: 1536, included: true },
  { name: 'tsconfig.json', type: 'file', path: '/tsconfig.json', size: 768, included: true },
  { name: 'README.md', type: 'file', path: '/README.md', size: 2048, included: false },
];

export default function CodebaseFlattener() {
  const [projectPath, setProjectPath] = useState('');
  const [fileStructure, setFileStructure] = useState<FileItem[]>(mockFileStructure);
  const [activeStep, setActiveStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const outputFormat = 'xml';
  const [includeComments, setIncludeComments] = useState(true);
  const [minifyOutput, setMinifyOutput] = useState(false);

  const steps = ['Select Project', 'Configure Files', 'Process & Export'];

  const handleSelectProject = () => {
    setActiveStep(1);
  };

  const handleStartProcessing = () => {
    setProcessing(true);
    setActiveStep(2);
    
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setProgress(currentProgress);
      if (currentProgress >= 100) {
        clearInterval(interval);
        setProcessing(false);
      }
    }, 200);
  };

  const toggleFileInclusion = (path: string) => {
    const updateItem = (items: FileItem[]): FileItem[] => {
      return items.map(item => {
        if (item.path === path) {
          return { ...item, included: !item.included };
        }
        if (item.children) {
          return { ...item, children: updateItem(item.children) };
        }
        return item;
      });
    };
    setFileStructure(updateItem(fileStructure));
  };

  const renderFileTree = (items: FileItem[], level = 0) => {
    return items.map((item) => (
      <Box key={item.path}>
        <ListItem sx={{ pl: 2 + level * 2 }}>
          <ListItemIcon>
            {item.type === 'folder' ? <FolderIcon /> : <FileIcon />}
          </ListItemIcon>
          <ListItemText
            primary={item.name}
            secondary={item.type === 'file' && item.size ? `${(item.size / 1024).toFixed(1)} KB` : undefined}
          />
          <FormControlLabel
            control={
              <Switch
                checked={item.included}
                onChange={() => toggleFileInclusion(item.path)}
                size="small"
              />
            }
            label=""
          />
        </ListItem>
        {item.children && renderFileTree(item.children, level + 1)}
      </Box>
    ));
  };

  const getTotalFiles = () => {
    const count = (items: FileItem[]): number => {
      return items.reduce((total, item) => {
        if (item.type === 'file' && item.included) {
          return total + 1;
        }
        if (item.children) {
          return total + count(item.children);
        }
        return total;
      }, 0);
    };
    return count(fileStructure);
  };

  const getTotalSize = () => {
    const size = (items: FileItem[]): number => {
      return items.reduce((total, item) => {
        if (item.type === 'file' && item.included && item.size) {
          return total + item.size;
        }
        if (item.children) {
          return total + size(item.children);
        }
        return total;
      }, 0);
    };
    return (size(fileStructure) / 1024).toFixed(1);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Codebase Flattener
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Convert your entire codebase into AI-friendly XML format for context preparation
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {activeStep === 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Select Project Directory
                </Typography>
                <TextField
                  fullWidth
                  label="Project Path"
                  value={projectPath}
                  onChange={(e) => setProjectPath(e.target.value)}
                  placeholder="/path/to/your/project"
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<FolderOpenIcon />}
                    onClick={() => setProjectPath('/example/project/path')}
                  >
                    Browse
                  </Button>
                  <Button
                    variant="contained"
                    disabled={!projectPath}
                    onClick={handleSelectProject}
                  >
                    Load Project
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {activeStep === 1 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Configure Files & Settings
                </Typography>
                
                <Accordion sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Output Settings</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={includeComments}
                              onChange={(e) => setIncludeComments(e.target.checked)}
                            />
                          }
                          label="Include Comments"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={minifyOutput}
                              onChange={(e) => setMinifyOutput(e.target.checked)}
                            />
                          }
                          label="Minify Output"
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>

                <Typography variant="subtitle2" gutterBottom>
                  File Selection
                </Typography>
                <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto', mb: 2 }}>
                  <List dense>
                    {renderFileTree(fileStructure)}
                  </List>
                </Paper>

                <Button
                  variant="contained"
                  startIcon={<PlayArrowIcon />}
                  onClick={handleStartProcessing}
                  disabled={getTotalFiles() === 0}
                >
                  Start Processing
                </Button>
              </CardContent>
            </Card>
          )}

          {activeStep === 2 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Processing Codebase
                </Typography>
                
                {processing ? (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Flattening codebase... {progress}%
                    </Typography>
                    <LinearProgress variant="determinate" value={progress} sx={{ mb: 2 }} />
                    <Typography variant="caption" color="text.secondary">
                      Processing files and converting to XML format
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Alert severity="success" sx={{ mb: 2 }}>
                      Codebase successfully flattened! Your XML file is ready for download.
                    </Alert>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        color="success"
                      >
                        Download XML
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<ContentCopyIcon />}
                      >
                        Copy to Clipboard
                      </Button>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Project Summary
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Selected Files"
                    secondary={getTotalFiles()}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Total Size"
                    secondary={`${getTotalSize()} KB`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Output Format"
                    secondary="XML"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Include Comments"
                    secondary={includeComments ? 'Yes' : 'No'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                What is Codebase Flattening?
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Codebase flattening converts your entire project into a single XML file that AI models can easily understand and work with.
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Benefits:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Full Context"
                    secondary="Provides complete codebase context to AI"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Structured Format"
                    secondary="XML format preserves file structure"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Easy Analysis"
                    secondary="Enables comprehensive code analysis"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
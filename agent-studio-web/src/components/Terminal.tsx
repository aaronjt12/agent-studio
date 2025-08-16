import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Drawer,
  Toolbar,
  TextField,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  Clear as ClearIcon,
  Minimize as MinimizeIcon,
  Launch as LaunchIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { apiClient } from '../services/api';

interface TerminalProps {
  open: boolean;
  onClose: () => void;
  height?: number;
}

interface CommandHistoryItem {
  command: string;
  output: string;
  timestamp: Date;
  type: 'command' | 'output' | 'error';
}

const TerminalContainer = styled(Paper)(({ theme }) => ({
  backgroundColor: '#0d1117',
  color: '#f0f6fc',
  fontFamily: '"Fira Code", "Monaco", "Cascadia Code", monospace',
  fontSize: '14px',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 0,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const TerminalHeader = styled(Box)(({ theme }) => ({
  backgroundColor: '#21262d',
  padding: theme.spacing(1, 2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: `1px solid ${theme.palette.divider}`,
  minHeight: 48,
}));

const TerminalContent = styled(Box)({
  flex: 1,
  overflow: 'auto',
  padding: '8px 16px',
  '& .command': {
    color: '#7dd3fc',
  },
  '& .output': {
    color: '#f0f6fc',
    whiteSpace: 'pre-wrap',
  },
  '& .error': {
    color: '#f87171',
  },
  '& .prompt': {
    color: '#34d399',
    fontWeight: 'bold',
  },
});

const TerminalInput = styled(TextField)({
  '& .MuiInputBase-root': {
    backgroundColor: 'transparent',
    color: '#f0f6fc',
    fontFamily: '"Fira Code", "Monaco", "Cascadia Code", monospace',
    fontSize: '14px',
    '& fieldset': {
      border: 'none',
    },
  },
  '& .MuiInputBase-input': {
    padding: '8px 0',
  },
});

const mockCommands: Record<string, string> = {
  'bmad --help': `____  __  __    _    ____        __  __ _____ _____ _   _  ___  ____  
 | __ )|  \/  |  / \\  |  _ \\      |  \\/  | ____|_   _| | | |/ _ \\|  _ \\ 
 |  _ \\| |\\/| | / _ \\ | | | |_____| |\\/| |  _|   | | | |_| | | | | | | |
 | |_) | |  | |/ ___ \\| |_| |_____| |  | | |___  | | |  _  | |_| | |_| |
 |____/|_|  |_/_/   \\_\\____/      |_|  |_|_____| |_| |_| |_|\\___/|____/ 

🤖 AI-Driven Development Framework
Collaborative agents for planning and development

Usage: bmad [options] [command]

Commands:
  init [project-name]        🏗️  Initialize a new BMAD-METHOD project
  agent                      🤖 Manage AI agents
  project                    📁 Manage BMAD projects
  flatten [directory]        🔧 Convert codebase to AI-friendly format
  interactive                🎮 Interactive BMAD session
  version                    📋 Show version information
  quickstart                 🚀 Quick start guide for new users`,

  'bmad quickstart': `🚀 BMAD-METHOD Quick Start

1. Initialize a new project:
   bmad init my-project

2. Create AI agents:
   bmad agent create --type analyst --name "Requirements Analyst"
   bmad agent create --type pm --name "Product Manager"

3. Start interactive mode:
   bmad interactive

4. Generate development stories:
   bmad project collaborate "Build user authentication system"

📚 For more help: bmad --help`,

  'bmad agent list': `🤖 Found 3 agent(s):

🟢 Requirements Analyst (4f8a2b1c...)
   Type: analyst | Status: active
   Analyzes requirements and creates detailed specifications
   Last active: 5 minutes ago

🟡 Product Manager (7e3d9f2a...)
   Type: pm | Status: idle
   Manages product roadmap and stakeholder communication
   Last active: 1 hour ago

🔴 System Architect (2c5b8e4f...)
   Type: architect | Status: stopped
   Designs system architecture and technical specifications
   Last active: Never`,

  'bmad project status': `📊 Project Status

📁 Project Information:
  Name: BMAD Web Application
  Description: AI-driven development framework web interface
  Created: 2024-01-13

📖 Stories Summary:
  Total: 5
  Completed: 2 (40%)
  In Progress: 2
  Planning: 1

🤖 Agents Summary:
  Total: 3
  Active: 1
  Idle: 1
  Stopped: 1`,

  'bmad interactive': `🎮 Welcome to BMAD Interactive Mode
Type "help" for commands, "exit" to quit

bmad > `,

  'ls': `total 12
drwxr-xr-x  3 user  staff   96 Jan 13 10:30 src/
drwxr-xr-x  2 user  staff   64 Jan 13 10:30 public/
-rw-r--r--  1 user  staff 1024 Jan 13 10:30 package.json
-rw-r--r--  1 user  staff  512 Jan 13 10:30 README.md
-rw-r--r--  1 user  staff  256 Jan 13 10:30 tsconfig.json`,

  'pwd': '/Users/user/bmad-method-web',

  'clear': '', // Special command to clear terminal

  'help': `Available Commands:
  bmad --help           Show BMAD CLI help
  bmad quickstart       Quick start guide
  bmad agent list       List AI agents
  bmad project status   Show project status
  bmad interactive      Start interactive mode
  ls                    List directory contents
  pwd                   Show current directory
  clear                 Clear terminal
  help                  Show this help`,
};

export default function Terminal({ open, onClose, height = 400 }: TerminalProps) {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<CommandHistoryItem[]>([
    {
      command: '',
      output: '🤖 BMAD-METHOD Terminal\nWelcome to the BMAD CLI interface!\nType "help" for available commands or "bmad --help" for full CLI documentation.\n',
      timestamp: new Date(),
      type: 'output'
    }
  ]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [minimized, setMinimized] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && inputRef.current && !minimized) {
      inputRef.current.focus();
    }
  }, [open, minimized]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [history]);

  const executeCommand = async (cmd: string) => {
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return;

    // Add command to history
    const newCommandHistory = [...commandHistory, trimmedCmd];
    setCommandHistory(newCommandHistory);
    setHistoryIndex(-1);

    // Add command to display history
    const commandItem: CommandHistoryItem = {
      command: trimmedCmd,
      output: '',
      timestamp: new Date(),
      type: 'command'
    };

    if (trimmedCmd === 'clear') {
      setHistory([]);
      return;
    }

    // Alias normalization
    let normalized = trimmedCmd;
    if (trimmedCmd === 'check') normalized = 'cli:check';
    if (trimmedCmd.startsWith('claude')) normalized = `cli:${trimmedCmd}`;
    if (trimmedCmd.startsWith('openai')) normalized = `cli:${trimmedCmd}`;

    // Handle special built-ins that call backend
    // Syntax: cli:claude <args...> OR cli:openai <args...>
    if (normalized.startsWith('cli:')) {
      const parts = normalized.split(/\s+/);
      const first = parts[0];
      const cli = first.slice(4);
      const args = parts.slice(1);
      try {
        const { exitCode, stdout, stderr } = await apiClient.execTerminalCommand({
          command: cli as any,
          args,
        });
        const combined = [stdout, stderr && stderr.trim().length ? `\n[stderr]\n${stderr}` : '']
          .filter(Boolean)
          .join('');
        const outputItem: CommandHistoryItem = {
          command: '',
          output: combined || `(exit ${exitCode})`,
          timestamp: new Date(),
          type: exitCode === 0 ? 'output' : 'error'
        };
        setHistory(prev => [...prev, commandItem, outputItem]);
        return;
      } catch (e: any) {
        const outputItem: CommandHistoryItem = {
          command: '',
          output: `cli error: ${e?.response?.data?.error || e?.message || String(e)}`,
          timestamp: new Date(),
          type: 'error'
        };
        setHistory(prev => [...prev, commandItem, outputItem]);
        return;
      }
    }

    // Built-in: tools check
    if (normalized === 'cli:check') {
      try {
        const { tools } = await apiClient.checkTerminalTools();
        const rows = tools
          .map(t => `${t.id}\t${t.installed ? 'installed' : 'missing'}\t${t.version || ''}`)
          .join('\n');
        const outputItem: CommandHistoryItem = {
          command: '',
          output: `Tool\tStatus\tVersion\n${rows}`,
          timestamp: new Date(),
          type: 'output'
        };
        setHistory(prev => [...prev, commandItem, outputItem]);
        return;
      } catch (e: any) {
        const outputItem: CommandHistoryItem = {
          command: '',
          output: `cli error: ${e?.response?.data?.error || e?.message || String(e)}`,
          timestamp: new Date(),
          type: 'error'
        };
        setHistory(prev => [...prev, commandItem, outputItem]);
        return;
      }
    }

    // Default mock commands
    const output = mockCommands[trimmedCmd] || 
      `bmad: command not found: ${trimmedCmd}\nType "help" for available commands.\nUse check, claude <args>, openai <args> (or prefixed with cli:).`;

    const outputItem: CommandHistoryItem = {
      command: '',
      output: output,
      timestamp: new Date(),
      type: output.includes('not found') ? 'error' : 'output'
    };

    setHistory(prev => [...prev, commandItem, outputItem]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(command);
      setCommand('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  const handleClear = () => {
    setHistory([]);
  };

  const openExternalTerminal = () => {
    // In a real implementation, this could:
    // 1. Open system terminal with bmad CLI
    // 2. Download CLI installer
    // 3. Show installation instructions
    window.open('https://github.com/bmad-code-org/BMAD-METHOD', '_blank');
  };

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      variant="persistent"
      PaperProps={{
        sx: {
          height: minimized ? 48 : height,
          transition: 'height 0.3s ease',
        }
      }}
    >
      <TerminalContainer>
        <TerminalHeader>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: '#ff5f56',
                cursor: 'pointer'
              }}
              onClick={onClose}
            />
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: '#ffbd2e',
                cursor: 'pointer'
              }}
              onClick={() => setMinimized(!minimized)}
            />
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: '#27ca3f',
                cursor: 'pointer'
              }}
              onClick={openExternalTerminal}
            />
            <Typography variant="body2" sx={{ ml: 2, color: '#8b949e' }}>
              BMAD Terminal
            </Typography>
            <Chip 
              label="CLI" 
              size="small" 
              sx={{ 
                backgroundColor: '#1f6feb',
                color: 'white',
                fontSize: '11px'
              }} 
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton size="small" onClick={handleClear} sx={{ color: '#8b949e' }}>
              <ClearIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => setMinimized(!minimized)} sx={{ color: '#8b949e' }}>
              <MinimizeIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={openExternalTerminal} sx={{ color: '#8b949e' }}>
              <LaunchIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={onClose} sx={{ color: '#8b949e' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </TerminalHeader>

        {!minimized && (
          <TerminalContent ref={contentRef}>
            {history.map((item, index) => (
              <Box key={index} sx={{ mb: 1 }}>
                {item.type === 'command' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span className="prompt">bmad-web $</span>
                    <span className="command">{item.command}</span>
                  </Box>
                )}
                {item.type === 'output' && (
                  <Box className="output" sx={{ ml: 0, whiteSpace: 'pre-wrap' }}>
                    {item.output}
                  </Box>
                )}
                {item.type === 'error' && (
                  <Box className="error" sx={{ ml: 0 }}>
                    {item.output}
                  </Box>
                )}
              </Box>
            ))}
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <span className="prompt">bmad-web $</span>
              <TerminalInput
                ref={inputRef}
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                fullWidth
                placeholder="Type a command..."
                autoComplete="off"
                variant="standard"
              />
            </Box>
          </TerminalContent>
        )}
      </TerminalContainer>
    </Drawer>
  );
}
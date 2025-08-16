# BMAD-METHOD CLI

🤖 AI-Driven Development Framework - Command Line Interface

The BMAD CLI provides a powerful command-line interface for interacting with AI agents, managing projects, and automating development workflows through collaborative AI agents.

## Quick Start

```bash
# Install globally
npm install -g bmad-cli

# Or run directly  
npx bmad-cli

# Initialize a new project
bmad init my-project

# Create AI agents
bmad agent create --type analyst --name "Requirements Analyst"
bmad agent create --type pm --name "Product Manager"

# Start interactive mode
bmad interactive

# Begin collaboration
bmad project collaborate "Build user authentication system"
```

## Core Features

### 🤖 AI Agent Management
- Create and configure specialized AI agents (Analyst, PM, Architect, Scrum Master)
- Start, stop, and monitor agent status
- Interactive chat with individual agents
- Template-based agent creation

### 📁 Project Management
- Initialize BMAD projects with multiple templates
- Track project status and metrics
- Generate development stories collaboratively
- Export project data in multiple formats

### 🤝 Agent Collaboration
- Orchestrate multiple agents working together
- Sequential and parallel collaboration flows
- Generate comprehensive development artifacts
- Real-time progress tracking

### 🔧 Codebase Integration
- Flatten entire codebases into AI-friendly formats
- Support for XML, JSON, and Markdown output
- Intelligent file filtering and processing
- Directory tree generation and analysis

### 🎮 Interactive Mode
- Full-featured interactive CLI environment
- Real-time agent communication
- Command completion and history
- Context-aware help system

## Commands Reference

### Project Commands

```bash
# Initialize new project
bmad init [project-name] [--template <type>] [--force]

# Show project status
bmad project status [--json]

# Start agent collaboration
bmad project collaborate <task-description> [--agents <list>] [--flow <type>]

# Generate development story
bmad project story <title> [--priority <level>] [--estimate <hours>]

# Export project data
bmad project export [--format <format>] [--output <file>]
```

### Agent Commands

```bash
# Create new agent
bmad agent create [--type <type>] [--name <name>] [--template <template>]

# List all agents
bmad agent list [--status <status>] [--type <type>] [--json]

# Start/stop agents
bmad agent start <agent-id>
bmad agent stop <agent-id> [--force]

# Chat with agent
bmad agent chat <agent-id> [--message <msg>] [--context <file>]

# Configure agent settings
bmad agent configure <agent-id> [--prompt <file>] [--temperature <value>]

# Remove agent
bmad agent remove <agent-id> [--force]
```

### Codebase Commands

```bash
# Flatten codebase
bmad flatten [directory] [--output <file>] [--format <format>]

# Generate directory tree
bmad flatten tree [directory] [--depth <number>] [--icons]

# Analyze codebase metrics
bmad flatten analyze [directory] [--json]

# Interactive flattening
bmad flatten --interactive
```

### Utility Commands

```bash
# Interactive mode
bmad interactive [--agent <id>] [--no-banner]

# Show version information
bmad version [--json]

# Quick start guide
bmad quickstart

# Show help
bmad --help
bmad <command> --help
```

## Agent Types

### 🔍 Requirements Analyst
- Gathers and analyzes business requirements
- Creates detailed specifications
- Defines acceptance criteria
- Maps user stories to business needs

### 📋 Product Manager
- Manages product roadmap and strategy
- Prioritizes features and initiatives
- Communicates with stakeholders
- Defines success metrics

### 🏗️ System Architect
- Designs scalable system architectures
- Selects appropriate technologies
- Considers performance and security
- Creates technical specifications

### 🎯 Scrum Master
- Breaks down features into stories
- Manages development workflow
- Facilitates team processes
- Identifies risks and dependencies

## Project Templates

### Web Application (`web`)
- React/TypeScript frontend
- Modern build tooling (Vite)
- Component-based architecture
- Testing and linting setup

### API Service (`api`)
- Node.js/Express backend
- RESTful API structure
- Middleware and security
- Database integration ready

### Full-Stack (`fullstack`)
- Combined frontend and backend
- Shared types and utilities
- Docker configuration
- Deployment ready

### Microservice (`microservice`)
- Containerized service architecture
- Kubernetes deployment configs
- Health checks and monitoring
- Service mesh ready

### CLI Tool (`cli`)
- Command-line application structure
- Argument parsing and validation
- Interactive prompts
- Distribution ready

## Configuration

BMAD projects use `.bmad/config.yaml` for configuration:

```yaml
project:
  name: "My Project"
  description: "AI-driven development project"
  template: "web"
  version: "1.0.0"

agents:
  enabled: ["analyst", "pm", "architect", "scrum-master"]
  autoStart: false
  collaborationMode: "sequential"

development:
  autoSave: true
  backupStories: true
  verboseLogging: false

output:
  format: "markdown"
  includeTimestamps: true
```

## Interactive Mode

Interactive mode provides a rich CLI environment:

```bash
bmad interactive

# Available in interactive mode:
bmad > agent list                    # List agents
bmad > agent connect analyst-123     # Connect to agent
analyst > Hello, help me analyze...  # Chat with agent
analyst > agent disconnect           # Disconnect
bmad > project status                # Show project status
bmad > help                          # Show help
bmad > exit                          # Exit interactive mode
```

## Collaboration Workflows

### Full Analysis Flow
Complete analysis from requirements to implementation:
1. Requirements Analyst gathers and analyzes requirements
2. Product Manager creates product strategy
3. System Architect designs technical architecture
4. Scrum Master breaks down into development stories

### Quick Planning
Rapid planning for simple features:
1. Product Manager defines feature scope
2. Scrum Master creates implementation tasks

### Technical Deep Dive
Architecture-focused analysis:
1. System Architect designs solution
2. Requirements Analyst validates technical requirements
3. Scrum Master plans implementation approach

## Codebase Flattening

Convert your entire codebase into AI-friendly formats:

```bash
# Basic flattening
bmad flatten . --output codebase.xml

# Interactive mode with file selection
bmad flatten --interactive

# Custom patterns
bmad flatten . --include "src/**/*.ts" --exclude "**/node_modules/**"

# Different output formats
bmad flatten . --format json --output codebase.json
bmad flatten . --format markdown --output codebase.md

# Analysis only
bmad flatten analyze . --json
```

## Development

```bash
# Clone and setup
git clone <repository>
cd bmad-cli
npm install

# Development mode
npm run dev

# Build
npm run build

# Test
npm test

# Link for local testing
npm link
```

## Examples

### Create and Use Agents

```bash
# Initialize project
bmad init my-app --template web

# Create agents
bmad agent create --type analyst --name "Business Analyst"
bmad agent create --type architect --name "Tech Lead"

# Start agents
bmad agent start analyst-123
bmad agent start architect-456

# Collaborate on feature
bmad project collaborate "User authentication with OAuth2 and JWT tokens"
```

### Interactive Development Session

```bash
bmad interactive

# In interactive mode:
bmad > agent list
bmad > agent connect analyst-123
analyst > I need to analyze requirements for a new dashboard feature
analyst > The dashboard should show user analytics and metrics
analyst > agent disconnect
bmad > project story "Analytics Dashboard" --priority high
bmad > flatten . --interactive
```

### Codebase Analysis

```bash
# Analyze current project
bmad flatten analyze .

# Generate documentation
bmad flatten . --format markdown --output docs/codebase.md

# Prepare for AI review
bmad flatten . --comments --output review.xml
```

## API Integration

The CLI can be extended to integrate with actual AI services:

```typescript
// Example: Custom agent provider
import { AgentManager } from 'bmad-cli';

const agentManager = new AgentManager();

// Create agent with custom configuration
const agent = await agentManager.createAgent({
  type: 'analyst',
  name: 'Custom Analyst',
  configuration: {
    provider: 'openai',
    model: 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0.7
  }
});
```

## Troubleshooting

### Common Issues

**Command not found: bmad**
```bash
# Install globally
npm install -g bmad-cli

# Or check PATH
echo $PATH
```

**Permission denied**
```bash
# On Unix systems
chmod +x /usr/local/bin/bmad

# Or use sudo
sudo npm install -g bmad-cli
```

**TypeScript errors**
```bash
# Rebuild
npm run build

# Clear cache
rm -rf dist/ node_modules/
npm install
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- 📚 [Documentation](https://bmad-method.org/docs)
- 💬 [Discord Community](https://discord.gg/bmad-method)
- 🐛 [Issue Tracker](https://github.com/bmad-code-org/BMAD-METHOD/issues)
- 📧 [Email Support](mailto:support@bmad-method.org)

---

**🤖 Built with BMAD-METHOD - AI-Driven Development for the Future**
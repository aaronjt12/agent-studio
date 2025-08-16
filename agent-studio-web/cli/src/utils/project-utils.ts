import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';

export interface ProjectConfig {
  name: string;
  description: string;
  template: string;
  agents: string[];
  useExpansionPacks: boolean;
  enableTelemetry: boolean;
  createdAt: string;
}

export async function createProjectStructure(projectPath: string, template: string): Promise<void> {
  const templateStructures = {
    web: {
      directories: [
        'src',
        'src/components',
        'src/pages',
        'src/utils',
        'src/types',
        'public',
        '.bmad',
        '.bmad/agents',
        '.bmad/stories',
        'docs'
      ],
      files: {
        'package.json': generatePackageJson('web'),
        'README.md': generateReadme('web'),
        '.gitignore': generateGitignore('web'),
        'tsconfig.json': generateTsConfig(),
        'src/App.tsx': generateAppComponent(),
        'src/index.tsx': generateIndexFile(),
        'public/index.html': generateIndexHtml(),
        '.bmad/config.yaml': '', // Will be generated separately
        'docs/getting-started.md': generateGettingStarted()
      }
    },
    api: {
      directories: [
        'src',
        'src/controllers',
        'src/models',
        'src/routes',
        'src/middleware',
        'src/utils',
        'src/types',
        'tests',
        '.bmad',
        '.bmad/agents',
        '.bmad/stories',
        'docs'
      ],
      files: {
        'package.json': generatePackageJson('api'),
        'README.md': generateReadme('api'),
        '.gitignore': generateGitignore('api'),
        'tsconfig.json': generateTsConfig(),
        'src/app.ts': generateApiApp(),
        'src/server.ts': generateServerFile(),
        '.env.example': generateEnvExample(),
        '.bmad/config.yaml': '',
        'docs/api-documentation.md': generateApiDocs()
      }
    },
    fullstack: {
      directories: [
        'frontend',
        'frontend/src',
        'frontend/src/components',
        'frontend/src/pages',
        'frontend/public',
        'backend',
        'backend/src',
        'backend/src/controllers',
        'backend/src/models',
        'backend/src/routes',
        'shared',
        'shared/types',
        '.bmad',
        '.bmad/agents',
        '.bmad/stories',
        'docs'
      ],
      files: {
        'package.json': generatePackageJson('fullstack'),
        'README.md': generateReadme('fullstack'),
        '.gitignore': generateGitignore('fullstack'),
        'frontend/package.json': generatePackageJson('web'),
        'backend/package.json': generatePackageJson('api'),
        'frontend/tsconfig.json': generateTsConfig(),
        'backend/tsconfig.json': generateTsConfig(),
        '.bmad/config.yaml': '',
        'docs/architecture.md': generateArchitectureDocs()
      }
    },
    microservice: {
      directories: [
        'src',
        'src/handlers',
        'src/services',
        'src/models',
        'src/utils',
        'src/types',
        'tests',
        'deployment',
        '.bmad',
        '.bmad/agents',
        '.bmad/stories',
        'docs'
      ],
      files: {
        'package.json': generatePackageJson('microservice'),
        'README.md': generateReadme('microservice'),
        '.gitignore': generateGitignore('microservice'),
        'Dockerfile': generateDockerfile(),
        'docker-compose.yml': generateDockerCompose(),
        '.bmad/config.yaml': '',
        'deployment/kubernetes.yaml': generateKubernetesConfig(),
        'docs/service-documentation.md': generateServiceDocs()
      }
    },
    cli: {
      directories: [
        'src',
        'src/commands',
        'src/utils',
        'src/types',
        'tests',
        'bin',
        '.bmad',
        '.bmad/agents',
        '.bmad/stories',
        'docs'
      ],
      files: {
        'package.json': generatePackageJson('cli'),
        'README.md': generateReadme('cli'),
        '.gitignore': generateGitignore('cli'),
        'tsconfig.json': generateTsConfig(),
        'src/index.ts': generateCliIndex(),
        'bin/cli.js': generateCliBin(),
        '.bmad/config.yaml': '',
        'docs/cli-usage.md': generateCliDocs()
      }
    }
  };

  const structure = templateStructures[template as keyof typeof templateStructures];
  if (!structure) {
    throw new Error(`Unknown template: ${template}`);
  }

  // Create directories
  for (const dir of structure.directories) {
    await fs.ensureDir(path.join(projectPath, dir));
  }

  // Create files
  for (const [filePath, content] of Object.entries(structure.files)) {
    if (content) { // Skip empty content (will be generated separately)
      await fs.writeFile(path.join(projectPath, filePath), content);
    }
  }
}

export async function generateConfigFile(projectPath: string, config: ProjectConfig): Promise<void> {
  const configPath = path.join(projectPath, '.bmad', 'config.yaml');
  
  const bmadConfig = {
    project: {
      name: config.name,
      description: config.description,
      template: config.template,
      version: '1.0.0',
      createdAt: config.createdAt
    },
    agents: {
      enabled: config.agents,
      autoStart: false,
      collaborationMode: 'sequential',
      defaultTimeout: 30000
    },
    expansionPacks: {
      enabled: config.useExpansionPacks,
      autoInstall: false,
      registry: 'https://registry.bmad-method.org'
    },
    telemetry: {
      enabled: config.enableTelemetry,
      endpoint: 'https://telemetry.bmad-method.org',
      anonymize: true
    },
    development: {
      autoSave: true,
      backupStories: true,
      verboseLogging: false
    },
    output: {
      format: 'markdown',
      includeTimestamps: true,
      includeMetadata: false
    }
  };

  await fs.writeFile(configPath, yaml.stringify(bmadConfig));
}

// Template generators
function generatePackageJson(type: string): string {
  const basePackage = {
    name: 'bmad-project',
    version: '1.0.0',
    description: 'A BMAD-METHOD project',
    scripts: {},
    dependencies: {},
    devDependencies: {}
  };

  const typeConfigs = {
    web: {
      scripts: {
        dev: 'vite',
        build: 'tsc && vite build',
        preview: 'vite preview',
        lint: 'eslint src --ext ts,tsx'
      },
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0'
      },
      devDependencies: {
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        '@vitejs/plugin-react': '^4.0.3',
        typescript: '^5.0.2',
        vite: '^4.4.5'
      }
    },
    api: {
      scripts: {
        dev: 'ts-node src/server.ts',
        build: 'tsc',
        start: 'node dist/server.js',
        test: 'jest'
      },
      dependencies: {
        express: '^4.18.2',
        cors: '^2.8.5',
        helmet: '^7.0.0'
      },
      devDependencies: {
        '@types/express': '^4.17.17',
        '@types/cors': '^2.8.13',
        '@types/node': '^20.0.0',
        'ts-node': '^10.9.1',
        typescript: '^5.0.2'
      }
    },
    cli: {
      bin: {
        'my-cli': './bin/cli.js'
      },
      scripts: {
        dev: 'ts-node src/index.ts',
        build: 'tsc',
        start: 'node dist/index.js'
      },
      dependencies: {
        commander: '^11.0.0',
        inquirer: '^9.2.0',
        chalk: '^5.3.0'
      },
      devDependencies: {
        '@types/node': '^20.0.0',
        '@types/inquirer': '^9.0.0',
        'ts-node': '^10.9.1',
        typescript: '^5.0.2'
      }
    }
  };

  const config = typeConfigs[type as keyof typeof typeConfigs] || {};
  return JSON.stringify({ ...basePackage, ...config }, null, 2);
}

function generateReadme(type: string): string {
  return `# BMAD-METHOD Project

A ${type} project built with the BMAD-METHOD AI-driven development framework.

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Set up BMAD agents:
   \`\`\`bash
   bmad agent create --type analyst --name "Requirements Analyst"
   bmad agent create --type pm --name "Product Manager"
   \`\`\`

3. Start interactive mode:
   \`\`\`bash
   bmad interactive
   \`\`\`

4. Begin development:
   \`\`\`bash
   bmad project collaborate "Your feature description"
   \`\`\`

## Project Structure

- \`.bmad/\` - BMAD configuration and data
- \`docs/\` - Project documentation
- \`src/\` - Source code

## BMAD Commands

- \`bmad agent list\` - List all agents
- \`bmad project status\` - Show project status
- \`bmad flatten\` - Flatten codebase for AI analysis
- \`bmad interactive\` - Start interactive mode

## Learn More

- [BMAD-METHOD Documentation](https://bmad-method.org/docs)
- [Community Discord](https://discord.gg/bmad-method)
`;
}

function generateGitignore(type: string): string {
  const common = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development
.env.test
.env.production

# Build outputs
dist/
build/

# Logs
*.log
logs/

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# BMAD temporary files
.bmad/temp/
.bmad/cache/
`;

  const typeSpecific = {
    web: `
# React specific
.eslintcache
`,
    api: `
# API specific
uploads/
temp/
`,
    cli: `
# CLI specific
*.tgz
`,
    fullstack: `
# Fullstack specific
.eslintcache
uploads/
temp/
`
  };

  return common + (typeSpecific[type as keyof typeof typeSpecific] || '');
}

function generateTsConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: 'ES2020',
      lib: ['ES2020', 'DOM'],
      allowJs: true,
      skipLibCheck: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      moduleResolution: 'node',
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: 'react-jsx'
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist', 'build']
  }, null, 2);
}

function generateAppComponent(): string {
  return `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>🤖 BMAD-METHOD Project</h1>
        <p>Your AI-driven development journey starts here!</p>
        <p>
          <code>bmad interactive</code> to begin
        </p>
      </header>
    </div>
  );
}

export default App;
`;
}

function generateIndexFile(): string {
  return `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;
}

function generateIndexHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BMAD-METHOD Project</title>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/src/index.tsx"></script>
</body>
</html>
`;
}

function generateGettingStarted(): string {
  return `# Getting Started

Welcome to your BMAD-METHOD project! This guide will help you get up and running quickly.

## Quick Start

1. **Create AI Agents**
   \`\`\`bash
   bmad agent create --type analyst
   bmad agent create --type pm  
   bmad agent create --type architect
   \`\`\`

2. **Start Interactive Mode**
   \`\`\`bash
   bmad interactive
   \`\`\`

3. **Collaborate on Features**
   \`\`\`bash
   bmad project collaborate "Build user authentication system"
   \`\`\`

## Next Steps

- Review the generated development stories
- Use the codebase flattener for AI analysis
- Explore expansion packs for specialized domains

Happy coding! 🚀
`;
}

function generateApiApp(): string {
  return `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: '🤖 BMAD-METHOD API Server',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

export default app;
`;
}

function generateServerFile(): string {
  return `import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(\`🤖 BMAD-METHOD API Server running on port \${PORT}\`);
  console.log(\`🚀 Visit http://localhost:\${PORT}\`);
});
`;
}

function generateEnvExample(): string {
  return `# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bmad_db

# API Keys
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h
`;
}

function generateDockerfile(): string {
  return `FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
`;
}

function generateDockerCompose(): string {
  return `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/bmad_db
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: bmad_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
`;
}

function generateKubernetesConfig(): string {
  return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: bmad-app
  labels:
    app: bmad-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bmad-app
  template:
    metadata:
      labels:
        app: bmad-app
    spec:
      containers:
      - name: bmad-app
        image: bmad-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          limits:
            memory: "512Mi"
            cpu: "500m"
          requests:
            memory: "256Mi"
            cpu: "250m"
---
apiVersion: v1
kind: Service
metadata:
  name: bmad-service
spec:
  selector:
    app: bmad-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer
`;
}

function generateCliIndex(): string {
  return `#!/usr/bin/env node

import { Command } from 'commander';

const program = new Command();

program
  .name('my-cli')
  .description('CLI tool built with BMAD-METHOD')
  .version('1.0.0');

program
  .command('hello')
  .description('Say hello')
  .argument('[name]', 'name to greet')
  .action((name) => {
    console.log(\`Hello \${name || 'World'}! 🤖\`);
  });

program.parse();
`;
}

function generateCliBin(): string {
  return `#!/usr/bin/env node

require('../dist/index.js');
`;
}

// Documentation generators
function generateApiDocs(): string {
  return `# API Documentation

## Endpoints

### GET /
Returns server information and status.

### GET /health
Health check endpoint.

## Development

\`\`\`bash
npm run dev
\`\`\`

## Deployment

\`\`\`bash
npm run build
npm start
\`\`\`
`;
}

function generateArchitectureDocs(): string {
  return `# Architecture

## Overview

This fullstack application follows a modern architecture with:

- **Frontend**: React with TypeScript
- **Backend**: Express.js API server
- **Shared**: Common types and utilities

## Structure

\`\`\`
├── frontend/          # React application
├── backend/           # Express API server  
├── shared/            # Shared types and utilities
└── docs/              # Documentation
\`\`\`

## Development Workflow

1. Start backend: \`cd backend && npm run dev\`
2. Start frontend: \`cd frontend && npm run dev\`
3. Use BMAD agents for feature development
`;
}

function generateServiceDocs(): string {
  return `# Microservice Documentation

## Service Overview

This microservice is designed to be:
- Scalable and stateless
- Container-ready
- Observable and monitorable

## Deployment

### Docker
\`\`\`bash
docker build -t bmad-service .
docker run -p 3000:3000 bmad-service
\`\`\`

### Kubernetes
\`\`\`bash
kubectl apply -f deployment/kubernetes.yaml
\`\`\`

## Monitoring

- Health check: GET /health
- Metrics: GET /metrics
- Logs: Structured JSON logging
`;
}

function generateCliDocs(): string {
  return `# CLI Usage

## Commands

### hello [name]
Greets the specified name (or "World" if no name provided).

\`\`\`bash
my-cli hello
my-cli hello Alice
\`\`\`

## Development

\`\`\`bash
npm run dev hello
\`\`\`

## Installation

\`\`\`bash
npm install -g .
\`\`\`
`;
}
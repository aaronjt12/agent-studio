# BMAD-METHOD Backend API

A comprehensive backend API for the BMAD-METHOD AI-driven development framework, providing real functionality for agent management, project collaboration, and AI-powered development workflows.

## Features

### 🤖 **Agent Management**
- Create, configure, and manage AI agents (Analyst, PM, Architect, Scrum Master, Developer, Tester, Designer, DevOps)
- Real AI integration with OpenAI GPT-4 and Anthropic Claude
- Agent conversations and chat history
- Agent assignment to projects and stories

### 📋 **Project Management**
- Create and manage development projects
- Project dashboard with comprehensive statistics
- Agent assignment and role management
- Project status tracking and reporting

### 📖 **Story Management**
- User story creation and management
- AI-powered story generation from requirements
- Story prioritization and estimation
- Agent assignment to stories
- Task breakdown and tracking

### 🔐 **Authentication & Security**
- JWT-based authentication
- Session management
- Rate limiting and security middleware
- Role-based access control

### 🔧 **Codebase Tools**
- Codebase flattening to AI-friendly formats (XML, JSON, Markdown)
- File upload and analysis
- Code review and explanation via AI
- Codebase snapshot management

### 🎯 **AI Services**
- Multiple AI provider support (OpenAI, Anthropic, Mock)
- Context-aware conversations
- Specialized prompts for different agent types
- Fallback to mock AI for development

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- SQLite (included)

### Installation

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Initialize database**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

The backend server will start on `http://localhost:5000`

### Environment Variables

```env
# Database
DATABASE_URL="file:./dev.db"

# Authentication
JWT_SECRET="your-secret-key"

# AI Providers (optional)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# Server
PORT=5000
FRONTEND_URL="http://localhost:3000"
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Agents
- `GET /api/agents` - List user's agents
- `POST /api/agents` - Create new agent
- `GET /api/agents/:id` - Get agent details
- `PUT /api/agents/:id` - Update agent
- `POST /api/agents/:id/start` - Start agent
- `POST /api/agents/:id/stop` - Stop agent  
- `POST /api/agents/:id/chat` - Chat with agent
- `DELETE /api/agents/:id` - Delete agent

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `POST /api/projects/:id/agents` - Add agent to project
- `GET /api/projects/:id/dashboard` - Get project dashboard
- `DELETE /api/projects/:id` - Delete project

### Stories
- `GET /api/stories` - List stories
- `POST /api/stories` - Create new story
- `POST /api/stories/generate` - Generate story from requirements
- `GET /api/stories/:id` - Get story details
- `PUT /api/stories/:id` - Update story
- `POST /api/stories/:id/agents` - Assign agent to story
- `DELETE /api/stories/:id` - Delete story

### AI Services
- `POST /api/ai/chat` - Generic AI chat
- `POST /api/ai/generate-story` - Generate user story
- `POST /api/ai/code-review` - AI code review
- `POST /api/ai/explain-code` - Explain code functionality
- `GET /api/ai/providers` - List AI providers

### Codebase Tools
- `POST /api/codebase/upload` - Upload codebase
- `POST /api/codebase/flatten` - Flatten codebase
- `GET /api/codebase/snapshots` - List snapshots
- `GET /api/codebase/snapshots/:id/download` - Download snapshot
- `POST /api/codebase/analyze` - Analyze codebase

## Database Schema

The backend uses Prisma with SQLite for local development. Key entities:

- **Users** - Authentication and user management
- **Projects** - Development projects and workspaces  
- **Agents** - AI agents with different specializations
- **Stories** - User stories and requirements
- **Tasks** - Story breakdown and task management
- **Conversations** - Agent chat history
- **CodebaseSnapshots** - Flattened codebase versions

## AI Integration

### Supported Providers
- **OpenAI**: GPT-4, GPT-3.5-turbo
- **Anthropic**: Claude-3 models
- **Mock AI**: Development fallback with realistic responses

### Agent Types & Specializations
Each agent type has specialized system prompts and capabilities:

- **Analyst**: Requirements gathering and analysis
- **PM**: Product management and prioritization  
- **Architect**: System design and technical specifications
- **Scrum Master**: Agile process facilitation and story breakdown
- **Developer**: Code implementation and technical solutions
- **Tester**: Quality assurance and testing strategies
- **Designer**: UI/UX design and user experience
- **DevOps**: Infrastructure and deployment automation

## Development

### Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

### Project Structure
```
backend/
├── src/
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic and AI services
│   ├── middleware/      # Authentication and validation
│   └── server.ts        # Main server setup
├── prisma/
│   └── schema.prisma    # Database schema
├── uploads/             # File uploads
├── outputs/             # Generated files
└── package.json
```

## Production Deployment

1. **Environment Setup**
   ```bash
   NODE_ENV=production
   DATABASE_URL="your-production-db"
   JWT_SECRET="secure-production-secret"
   ```

2. **Build and Start**
   ```bash
   npm run build
   npm start
   ```

3. **Database Migration**
   ```bash
   npm run db:migrate
   ```

## WebSocket Support

Real-time updates via WebSocket connections:
- Agent status changes
- Project updates  
- Story progress
- Chat messages

Connect to `ws://localhost:5000` for real-time features.

## Security Features

- JWT authentication with session management
- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization
- CORS configuration
- Helmet security headers
- File upload size limits

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
# tinykit - Claude Code Documentation

## ⚠️ CRITICAL: SVELTE 5 ONLY

**THIS PROJECT USES SVELTE 5 WITH RUNES. YOU MUST ALWAYS:**

1. **Use `$state()` for reactive variables** - NOT `let foo = 'bar'`
   ```svelte
   ❌ WRONG: let count = 0
   ✅ RIGHT: let count = $state(0)
   ```

2. **Use `$props()` for component props** - NOT `export let`
   ```svelte
   ❌ WRONG: export let title = ''
   ✅ RIGHT: let { title = '' } = $props()
   ```

3. **Use `watch` from runed for watching prop changes** - NOT `$effect()`
   ```svelte
   ❌ WRONG: $effect(() => { if (target_field) doSomething() })
   ✅ RIGHT: watch(() => target_field, (value) => { if (value) doSomething() })
   ```
   - Import: `import { watch } from "runed"`
   - Use `watch` when reacting to specific prop/state changes
   - Use `$effect()` only for setup/cleanup side effects (e.g., event listeners)

4. **Use `$derived()` for computed values** - NOT `$:` assignments
   ```svelte
   ❌ WRONG: $: doubled = count * 2
   ✅ RIGHT: let doubled = $derived(count * 2)
   ```

5. **Use `onclick={handler}` NOT `on:click={handler}`**
   ```svelte
   ❌ WRONG: <button on:click={handler}>Click</button>
   ✅ RIGHT: <button onclick={handler}>Click</button>
   ```

6. **BEFORE writing ANY Svelte component:**
   - Use `mcp__svelte__svelte-autofixer` tool to validate your code
   - Pass `desired_svelte_version: 5` and `async: false` (unless using await in markup)
   - Fix ALL issues the autofixer reports before proceeding

**No exceptions. Svelte 4 syntax will break this codebase.**

## Project Overview

tinykit is an open-source, self-hosted AI development platform—think Lovable, but running on your own server alongside the apps it builds. It provides database, editor, and hosting all at `/tinykit`, enabling you to ship production CRUD apps in an afternoon.

**Core Value Proposition:**
Let the AI handle the boring 80% (routes, auth, CRUD operations, basic UI), then you take over for the last mile—the details that actually matter.

**📖 Documentation:**
- **[SPEC.md](./SPEC.md)** - Complete technical specification (how everything works now)
- **[ROADMAP.md](./ROADMAP.md)** - Future features and implementation plan

## Current Implementation Status

### ✅ Phase 1: Foundation (COMPLETED)
- [x] SvelteKit setup with TypeScript
- [x] Tailwind CSS configuration
- [x] Project structure
- [x] MVP UI at `/tinykit` with side-by-side panes
- [x] Pocketbase download script
- [x] Pocketbase initialization with collections (projects, files, commits)
- [x] Pocketbase proxy at `/_pb/` (same port as frontend)
- [x] File system API routes (tree, read, write, delete)
- [x] Database admin UI (Pocketbase iframe)
- [x] Basic layout with tabs (Agent, Files, DB)
- [x] Heroicons integration

### ✅ Phase 2: Core Features (COMPLETED)
- [x] Monaco editor with syntax highlighting
- [x] Live preview iframe with in-browser Svelte compilation
- [x] Build system (server-side compilation to standalone HTML)
- [x] Agent chat UI with message history and streaming
- [x] localStorage persistence for conversations
- [x] File operations (read/write via API)
- [x] Clear conversation functionality
- [x] Reset project functionality
- [x] Auto-scroll message history
- [x] Content fields (CMS-like editable values)
- [x] Design fields (CSS variables for theming)
- [x] Pocketbase collections via AI tools
- [x] Snapshots (time travel / undo)
- [x] Data tab with visual record editing
- [x] 6-tab UI (Agent, Code, Config, Design, Data, History)
- [x] Refactored _crud UI into modular panels
- [x] Pocketbase authentication (login/register/logout)
- [x] Auth guard for admin routes
- [x] SDK-first architecture (direct PB SDK instead of API endpoints)
- [x] Project service layer with all CRUD operations

### ✅ Phase 3: Domain-Based Routing (COMPLETED)
- [x] Domain field added to `_tk_projects` collection
- [x] Domain resolution in `hooks.server.ts`
- [x] Production apps served at root (`/`) based on domain
- [x] Builder at `/tinykit/builder?id=X` or `/tinykit/builder` (uses current domain)
- [x] Dashboard at `/tinykit/dashboard`
- [x] New project flow with domain awareness (`/tinykit/new?domain=X`)
- [x] Auto-redirect unknown domains to project creation

### 🚧 Phase 4: Immediate Next Steps
See [ROADMAP.md](./ROADMAP.md) for complete feature list. Top priorities:
- [ ] Multi-file support (file tree in Code tab)
- [ ] Template marketplace (starter apps)
- [ ] Export/deploy to Vercel, Railway
- [ ] Real-time collaboration

### 📋 Future Phases
Detailed in [ROADMAP.md](./ROADMAP.md):
- Multi-file component support
- Visual database editor
- Git auto-commits and history
- Template marketplace
- Deployment integrations (Railway, Vercel)
- Collaboration features

## Tech Stack

### Core Technologies
- **Frontend Framework**: SvelteKit 2.x with TypeScript
- **Database & Storage**: Pocketbase 0.23.8 (single `_tk_projects` collection)
- **Styling**: Tailwind CSS 3.4.x
- **Icons**: Heroicons via svelte-hero-icons
- **Editor**: Monaco editor
- **Version Control**: Git snapshots (code-only, DB unaffected)

### Architecture
- Self-hosted, single-server deployment
- No external services required
- **Single collection storage:** All tinykit platform data in `_tk_projects`
  - `frontend_code` - App frontend code
  - `backend_code` - App backend code (not used yet)
  - `design` - CSS variables (JSON)
  - `content` - Content fields (JSON)
  - `agent` - Conversation history (JSON)
  - `snapshots` - Time travel history (JSON)
- Pocketbase proxied through SvelteKit at `/_pb/` (same port)
- Live preview with in-browser Svelte compilation
- Server-side build system for production HTML

### Domain-Based Routing

Each project is associated with a domain. Users can point multiple domains to a single tinykit server:

```
calculator.myserver.com/           → Serves calculator production app
calculator.myserver.com/tinykit/builder  → Edit calculator app
calculator.myserver.com/tinykit/dashboard → See ALL apps
calculator.myserver.com/tinykit/abc123    → Edit blog app by ID

blog.myserver.com/                 → Serves blog production app
blog.myserver.com/tinykit/builder  → Edit blog app
blog.myserver.com/tinykit/dashboard → See ALL apps (same list)
```

**Route Resolution:**
- `/` - Serve production app for current domain (from `project.backend_code`)
- `/tinykit/builder` - Edit the project for current domain
- `/tinykit/builder?id=X` - Edit specific project by ID
- `/tinykit/dashboard` - List all projects
- `/tinykit/new?domain=X` - Create new project for domain

**Unknown Domain Flow:**
When a domain has no project: Unknown domain → `/tinykit/new?domain=X` → Shows "Creating app for X"

### Current UI Layout
```
┌───────────────────────────────────────────────────────────┐
│ tinykit · My Project                            Deploy  │
├────────────────────────────┬──────────────────────────────┤
│ [Agent] [Code] [Config]    │ Preview                      │
│ [Design] [Data] [History]  │                              │
├────────────────────────────┤                              │
│                            │                              │
│  Left Pane Content         │  Live Preview                │
│  (tabs switchable)         │                              │
│                            │                              │
└────────────────────────────┴──────────────────────────────┘
```

- **Left Pane**: 6 tabs
  - **Agent** (Cmd+1): AI chat interface for building apps
  - **Code** (Cmd+2): Monaco editor for manual code editing
  - **Config** (Cmd+3): Environment vars, API endpoints, content fields
  - **Design** (Cmd+4): CSS variables for theming (colors, fonts, spacing)
  - **Data** (Cmd+5): Pocketbase collections and records
  - **History** (Cmd+6): Snapshots for time travel / undo
- **Right Pane**: Live preview iframe with hot reload
- **Split View**: Resizable 50/50 layout with PaneForge

### Planned Integrations
- PostHog analytics
- AI SDK (Vercel)
- Puppeteer testing
- Agent auto-testing
- Stripe payments
- S3/R2 storage
- Additional frameworks: Next.js, Astro, Nuxt

## Repository Structure

```
tinykit/
├── src/
│   ├── routes/
│   │   ├── login/            # ✅ Login page
│   │   │   └── +page.svelte
│   │   ├── register/         # ✅ Registration page
│   │   │   └── +page.svelte
│   │   ├── tinykit/          # Main admin interface
│   │   │   ├── +layout.svelte  # ✅ Auth guard
│   │   │   ├── dashboard/      # ✅ Projects list (/tinykit/dashboard)
│   │   │   ├── builder/        # ✅ Project editor (/tinykit/builder?id=X)
│   │   │   ├── new/            # ✅ New project page (/tinykit/new?domain=X)
│   │   │   ├── [id]/           # Legacy redirect to /tinykit/builder
│   │   │   ├── panels/         # Tab panels (Agent, Code, etc.)
│   │   │   ├── components/     # UI components
│   │   │   └── lib/            # Local utilities
│   │   ├── api/
│   │   │   ├── agent/        # ✅ LLM integration (requires server)
│   │   │   ├── build/        # ✅ Svelte compilation (requires server)
│   │   │   └── templates/    # ✅ Starter templates
│   │   ├── +layout.svelte    # Root layout
│   │   └── +server.ts        # ✅ Domain-based routing (serves production apps)
│   ├── lib/
│   │   ├── pocketbase.svelte.ts  # ✅ PB client + auth store
│   │   ├── services/
│   │   │   └── project.svelte.ts # ✅ Project CRUD via SDK
│   │   ├── stores/
│   │   │   └── project.svelte.ts # ✅ Reactive project store
│   │   ├── components/       # Reusable Svelte components
│   │   ├── server/           # Server-side utilities
│   │   └── ai/               # AI agent implementation
│   ├── hooks.server.ts       # ✅ Pocketbase proxy handler
│   ├── app.html              # HTML template
│   └── app.css               # Global styles with Tailwind
├── scripts/
│   └── download-pocketbase.js  # ✅ Downloads PB binary for platform
├── pocketbase/                 # Pocketbase instance & data
│   ├── pocketbase              # Binary (downloaded)
│   └── pb_data/                # Database & files
├── workspace/                  # User projects
├── static/                     # Static assets
├── .env.example                # ✅ Environment template
├── package.json
├── svelte.config.js
├── vite.config.ts
├── tailwind.config.js
├── CLAUDE.md                   # This file
└── README.md
```

## Key Features to Implement

### 1. AI Agent System
**Location**: `src/lib/ai/`

The core AI agent that:
- Accepts natural language prompts
- Generates production-ready code
- Creates/modifies SvelteKit routes and components
- Configures Pocketbase collections
- Sets up email services and integrations
- Commits each change to git

**Components:**
- Prompt parser and intent recognition
- Code generation engine
- Pocketbase schema manager
- Git integration
- File system operations

### 2. Code Editor
**Location**: `src/routes/tinykit/editor/`

Monaco-based editor with:
- File tree navigation
- Syntax highlighting
- Auto-completion
- Full read/write access to project files
- Integration with git for version control

### 3. Live Preview & Build System
**Location**: `src/routes/tinykit/preview/` and `src/routes/api/build/`

**Preview System:**
- In-browser Svelte compilation for instant feedback
- iframe-based isolation with BroadcastChannel communication
- Error boundaries and logging
- Mobile/desktop viewport switching

**Build System (Implemented):**
- Server-side compilation using Svelte 5's native `compile()` function
- Generates standalone HTML with CDN-based imports (import maps)
- Auto-builds on page load and file saves
- Production route `/` serves pre-compiled static HTML
- Preview pane uses in-browser compiler, production uses server-compiled build

### 4. Database & Admin UI
**Location**: `src/routes/tinykit/database/`

Pocketbase integration:
- Collection management
- Record CRUD operations
- Auth configuration
- Realtime subscriptions
- Admin dashboard

### 5. Design System
**Location**: `src/routes/tinykit/+page.svelte` (Design tab)

Dynamic CSS variable system for theming:
- AI creates design fields based on what the app actually uses
- Each field has: name, CSS variable, value, description
- Auto-generated CSS served at `/api/design/css`
- Non-technical users can customize colors/fonts/spacing without code changes
- Live preview updates instantly

**Example Design Fields:**
```json
{
  "id": "1",
  "name": "Primary Color",
  "css_var": "--color-primary",
  "value": "#3b82f6",
  "description": "Main brand color for buttons and accents"
}
```

**Usage in Code:**
```html
<!-- Direct CSS -->
<button style="background-color: var(--color-primary)">Click</button>

<!-- Tailwind arbitrary values -->
<button className="bg-[var(--color-primary)]">Click</button>
```

**AI Tool Integration:**
- `create_design_field` - AI creates CSS variables as needed
- Only creates fields actually used in the app code
- Appears as clickable badges in chat when created

**Key Principle:** Start with zero design fields. AI adds them progressively as the app needs them. A simple calculator might have 3-4 fields, while a complex dashboard might have 12-15.

### 6. Version Control Interface
**Location**: `src/routes/tinykit/history/`

Git UI showing:
- Commit history (one commit per AI turn)
- Diff viewer
- Branch management
- Revert capabilities
- GitHub push/pull

### 6. Starter Templates
**Location**: `src/lib/templates/`

Pre-built templates:
- Calendar App
- Booking System
- Form Backend
- Landing Page
- Admin Dashboard
- Blog / CMS
- Simple Store
- Chat App

## Development Guidelines

### AI Agent Behavior
1. **Understand context**: Parse the user's natural language request
2. **Plan changes**: Determine which files need to be created/modified
3. **Generate code**: Create production-ready SvelteKit/Svelte code
4. **Configure backend**: Set up Pocketbase collections and rules
5. **Commit**: Create a descriptive git commit
6. **Report**: Show user what was done and provide preview link

### Code Standards
- Use TypeScript for type safety
- Follow SvelteKit conventions
- Use Tailwind CSS utility classes
- Keep components small and reusable
- Implement proper error handling
- Add loading states for async operations

### Git Workflow
- One AI turn = one commit
- Descriptive commit messages
- Support for branching and reverting
- Integration with GitHub for push/pull

### Pocketbase Integration
- Use Pocketbase SDK for all database operations
- Implement proper auth guards
- Set up realtime subscriptions where needed
- Configure CORS and security rules

## User Workflows

### Starting a New Project
1. User accesses `/tinykit`
2. Chooses a starter template or starts blank
3. Names the project
4. Agent initializes the project structure

### Building with AI
1. User describes feature in natural language
2. Agent generates code and updates preview
3. User iterates with follow-up instructions
4. User can switch to editor for manual refinement

### Manual Editing
1. User opens code editor
2. Browses file tree
3. Makes changes in Monaco editor
4. Sees live preview update
5. Can commit manually or let agent commit

### Deployment
1. Project is already running on the server
2. User configures domain
3. Sets environment variables if needed
4. Ships to production

## Testing Strategy

### Current
- Manual testing via preview
- User verification

### Planned
- Puppeteer integration for automated testing
- Agent auto-testing (AI generates and runs tests)
- Visual regression testing
- E2E test generation

## Security

### Pocketbase Authentication (Implemented)

tinykit uses Pocketbase's built-in `users` collection for authentication. The admin UI (`/tinykit/*`) requires login.

**How it works:**
1. User visits `/tinykit` → redirected to `/login` if not authenticated
2. Login/register via Pocketbase SDK (`pb.collection('users').authWithPassword()`)
3. Auth token stored in Pocketbase's auth store (persisted to localStorage)
4. All `_tk_projects` collection requests require valid auth token
5. Collection rules enforce `@request.auth.id != ''`

**Key Files:**
- `src/lib/pocketbase.svelte.ts` - Auth store with login/register/logout
- `src/lib/services/project.svelte.ts` - Project CRUD using SDK
- `src/routes/login/+page.svelte` - Login form
- `src/routes/register/+page.svelte` - Registration form
- `src/routes/tinykit/+layout.svelte` - Auth guard for admin routes

**Client-side usage:**
```typescript
import { pb, auth } from '$lib/pocketbase.svelte'

// Check auth status
if (auth.is_authenticated) {
  // User is logged in
}

// Login
await auth.login('user@example.com', 'password')

// Logout
auth.logout()

// Direct SDK access (auto-includes auth)
const projects = await pb.collection('_tk_projects').getFullList()
```

**Security level:**
- ✅ Per-user accounts with email/password
- ✅ JWT tokens with automatic refresh
- ✅ Collection-level access rules
- ✅ Auth state persisted across sessions
- ✅ Works with self-hosted Pocketbase

**Note:** Since tinykit is self-hosted (one server = one team), no owner field is needed. All authenticated users can access all projects.

## Environment Variables

```env
# LLM Configuration
LLM_PROVIDER=openai|anthropic|gemini|deepseek
LLM_API_KEY=your-api-key
LLM_MODEL=gpt-4|claude-sonnet-4.5|gemini-3-pro-preview|deepseek-chat

# Pocketbase Configuration
POCKETBASE_URL=http://127.0.0.1:8091
POCKETBASE_ADMIN_EMAIL=admin@tinykit
POCKETBASE_ADMIN_PASSWORD=adminpassword123

# Workspace directory (where user projects are stored)
WORKSPACE_DIR=./workspace

# Server Configuration
PORT=5173
HOST=0.0.0.0

# Optional Integrations (not yet implemented)
POSTHOG_API_KEY=
STRIPE_SECRET_KEY=
S3_BUCKET=
```

**Current Setup:**
- Frontend runs on `http://localhost:5173`
- Pocketbase runs on `http://127.0.0.1:8091`
- Pocketbase is proxied through frontend at `/_pb/` for same-origin access
- Database admin accessible at `http://localhost:5173/tinykit` → DB tab

## API Routes

### Architecture: SDK-First Approach

**Most project operations now use the Pocketbase SDK directly** instead of server-side API endpoints. This provides:
- Automatic authentication via `pb.authStore`
- Real-time subscriptions
- Simpler codebase (less server code to maintain)

**Key files for SDK operations:**
- `src/lib/pocketbase.svelte.ts` - Singleton PB client
- `src/lib/services/project.svelte.ts` - Project CRUD operations
- `src/routes/tinykit/lib/api.svelte.ts` - High-level API module

### ✅ Active Server Endpoints

Only a few endpoints still require server-side handling:

**Agent (LLM Integration):**
- `POST /api/agent/prompt` - Submit prompt to AI (body: `{prompt, messages, project_id}`)
  - Requires server-side for LLM API keys
  - Returns streaming response

**Build System:**
- `POST /api/build` - Compile Svelte to standalone HTML
  - Server-side compilation with Svelte 5
  - Generates production-ready HTML with CDN imports
  - Returns `{success, output, size}`

**Templates:**
- `GET /api/templates` - List available starter templates
- `GET /api/templates/[id]` - Get template code

### 🗑️ Deprecated Endpoints (Removed)

These endpoints were replaced by direct SDK calls:
- `/api/projects/*` → Use `project_service.list/get/create/update/delete()`
- `/api/projects/[id]/code/*` → Use `project_service.update_code()`
- `/api/projects/[id]/config/*` → Use SDK to update project fields directly
- `/api/projects/[id]/snapshots/*` → Use `project_service.create_snapshot/restore_snapshot()`
- `/api/projects/[id]/data/*` → Use `project_service.get_data_files/update_data_file()`
- `/api/settings` → Vibe zone uses localStorage, project name via SDK

### ✅ Pocketbase Direct Access

Platform data is stored in `_tk_projects` collection:
```typescript
import { pb } from '$lib/pocketbase.svelte'

// All CRUD operations use SDK directly
const projects = await pb.collection('_tk_projects').getFullList()
const project = await pb.collection('_tk_projects').getOne(id)
await pb.collection('_tk_projects').update(id, { frontend_code: '...' })
```

User app data uses separate collections created by AI:
- `/_pb/api/collections/:name/records` - REST API
- Real-time subscriptions available

### 📋 Git Operations (Planned)
- `GET /api/git/log` - Get commit history
- `POST /api/git/commit` - Create commit
- `POST /api/git/revert/:sha` - Revert to commit
- `POST /api/git/push` - Push to remote

## Working with Claude Code

### Initial Setup
```bash
# Clone the repository
git clone https://github.com/matthewmateo/tinykit.git
cd tinykit

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Download Pocketbase binary
npm run pocketbase:download

# Start Pocketbase (in a separate terminal or background)
npm run pocketbase:serve

# Start development server
npm run dev

# Visit http://localhost:5173/setup to complete first-time setup
```

**Access Points:**
- Frontend: http://localhost:5173
- Admin UI: http://localhost:5173/tinykit
- Pocketbase Admin: http://localhost:5173/_pb/_ (or http://127.0.0.1:8091/_/)
- Pocketbase API: http://localhost:5173/_pb/api/

### Common Commands
- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Type check
- `npm run lint` - Lint code
- `npm run format` - Format code

### Making Changes with Claude
1. Describe the feature or fix you want
2. Claude will analyze the codebase
3. Claude will make necessary changes
4. Review the changes in your editor
5. Test in the preview
6. Commit when satisfied

## Deployment Options

### Railway
- One-click deploy button
- Automatic HTTPS
- Built-in PostgreSQL option (future)

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "build"]
```

### VPS (Ubuntu/Debian)
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and build
git clone https://github.com/yourusername/tinykit.git
cd tinykit
npm install
npm run build

# Run with PM2
npm install -g pm2
pm2 start build/index.js --name tinykit
```

## Security Considerations

1. **File Access**: Restrict file operations to project directory
   - Prevent path traversal attacks
   - Validate all file paths server-side
   - Stay within workspace boundaries

4. **LLM API Keys**: Store securely, never commit to git
   - Use environment variables
   - Rotate keys regularly
   - Monitor usage and costs

5. **Pocketbase**: Configure proper CORS and auth rules
   - Alpha: No auth (single-user assumption)
   - Production: Per-user auth with proper rules

6. **Code Execution**: Sanitize AI-generated code before execution
   - Review generated code for security issues
   - Watch for XSS, SQL injection, command injection
   - Add security linting in future

7. **Rate Limiting**: Implement rate limits on agent endpoints
   - Prevent abuse of LLM API
   - Protect against brute force on password
   - Future: Add proper rate limiting middleware

## Roadmap

### Phase 1: Foundation ✅
- [x] SvelteKit setup with TypeScript and Tailwind
- [x] Monaco editor integration
- [x] File system API (read/write/delete)
- [x] Basic UI with terminal aesthetic

### Phase 2: AI Agent ✅
- [x] LLM provider abstraction (OpenAI, Anthropic)
- [x] Streaming AI responses
- [x] Code block extraction and auto-file writing
- [x] Chat interface with localStorage persistence

### Phase 3: Enhanced Features ✅
- [x] Live preview with iframe
- [x] Git history viewer
- [x] JSON data storage API
- [x] Data Config system (env vars, endpoints, content fields)
- [x] Spec Sheet tab for project context

### Phase 4: Multi-Project Support 🚧
- [ ] Project switching UI
- [ ] Multi-workspace architecture (`/workspaces/project-a/`, `/workspaces/project-b/`)
- [ ] Domain-based routing (e.g., `calculator.yourdomain.com` → workspace)
- [ ] Shared component library across projects
- [ ] Project creation/deletion management
- [ ] Per-project isolation (config, data, spec)

### Phase 5: Testing & Quality
- [ ] **Vitest integration** - Unit tests for platform APIs
- [ ] **Puppeteer E2E testing** - Automated browser testing
- [ ] **Test generation** - AI generates tests for user apps
- [ ] **Auto-test runner** - Run tests after each AI generation
- [ ] **Self-healing code** - AI auto-fixes failing tests
  - Run tests on generated code
  - Feed errors back to AI
  - AI regenerates until tests pass
- [ ] **Test results UI** - Visual test output in interface
- [ ] **Security testing** - Path traversal, XSS, SQL injection checks

### Phase 6: Advanced Features
- [ ] Pocketbase visual UI integration
- [ ] Auth system with project permissions
- [ ] Component marketplace (shared components)
- [ ] Deploy to production (one-click)
- [ ] Template gallery (starter projects)
- [ ] Collaborative editing (multi-user)
- [ ] Performance monitoring (Lighthouse scores)
- [ ] **Content Editor Sharing** - Share simplified editor for non-technical users
  - Shareable link (`/tinykit/content` or `/tinykit/edit/{token}`)
  - Stripped-down UI: content fields (left) + live preview (right)
  - No code/config/data access - only content field editing
  - Optional: Token-based auth or password protection
  - Optional: Approval workflow (changes staged until developer approves)
  - Real-time preview updates as content changes
- [ ] **Eject to framework** - Export to Next.js, Nuxt, Astro, SvelteKit
  - One-click migration when project outgrows tinykit
  - Preserves all code, data, config
  - Generates proper framework structure (routing, API routes, etc.)
  - Optional: AI assists with migration and optimization

### Phase 7: Integrations
- [ ] PostHog analytics
- [ ] Stripe payments
- [ ] S3/R2 storage
- [ ] Email services (Resend, SendGrid)
- [ ] Framework support (Next.js, Astro, Nuxt)

## Pricing Model

- **Free and open source**: MIT License
- **Infrastructure costs**:
  - Server: $0-7/mo (Railway free tier or small VPS)
  - LLM API: ~$3-5/mo (few hours daily usage)
- **No lock-in**: Full source code access, export anytime

## Contributing

See CONTRIBUTING.md for:
- Code style guidelines
- PR process
- Issue templates
- Development setup
- Testing requirements

## Troubleshooting

### Pocketbase won't start
- Check if port 8091 is available: `lsof -i :8091`
- Verify file permissions on pocketbase binary: `chmod +x ./pocketbase/pocketbase`
- Check logs in `pocketbase/pb_data/logs/`
- Try running with explicit port: `./pocketbase/pocketbase serve --http=127.0.0.1:8091`

### Pocketbase admin not loading in iframe
- Ensure Pocketbase is running on 8091
- Check browser console for CORS errors
- Verify `POCKETBASE_URL` in `.env` is set correctly
- Try accessing directly at http://127.0.0.1:8091/_/ to verify it's running

### Hot reload not working
- Clear SvelteKit cache: `rm -rf .svelte-kit node_modules/.vite`
- Restart dev server
- Check browser console for errors
- Try hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

### Icons not showing (Heroicons issue)
- Clear cache and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Restart dev server
- Check for import errors in browser console

### AI agent errors (Phase 3)
- Verify LLM API key is set in `.env`
- Check API rate limits
- Review agent logs (when implemented)

## Resources

- [SvelteKit Docs](https://kit.svelte.dev/docs)
- [Pocketbase Docs](https://pocketbase.io/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [tinykit GitHub](https://github.com/yourusername/tinykit)

## License

MIT License - See LICENSE file for details

---

## Immediate Next Steps (Phase 2 - MVP)

### 1. Monaco Code Editor Integration
**Priority**: High
**Location**: `src/routes/tinykit/+page.svelte` (Files tab)

- [ ] Install `monaco-editor` package
- [ ] Create Monaco wrapper component in `src/lib/components/Editor.svelte`
- [ ] Integrate with existing file API routes
- [ ] Add file tree component (simple list for MVP)
- [ ] Wire up read/write operations
- [ ] Add syntax highlighting for common languages

**Goal**: User can edit files in a proper code editor

### 2. Live Preview Implementation
**Priority**: High
**Location**: `src/routes/tinykit/+page.svelte` (right pane)

- [ ] Set up iframe pointing to workspace preview route
- [ ] Create `/workspace/preview` route that serves user's app
- [ ] Implement hot reload (websocket or polling)
- [ ] Add error boundary display
- [ ] Add loading states

**Goal**: User can see their app update in real-time as they code

### 3. Agent Chat UI
**Priority**: Medium
**Location**: `src/routes/tinykit/+page.svelte` (Agent tab)

- [ ] Create message history component
- [ ] Add message input with send button
- [ ] Store messages in Pocketbase (or local state for MVP)
- [ ] Add loading/thinking states
- [ ] Add copy code button to responses

**Goal**: User has a nice chat interface ready for when AI is integrated

### 4. Workspace Management
**Priority**: Medium
**Location**: `src/lib/server/workspace.ts`

- [ ] Create workspace directory structure (`./workspace/{projectId}/`)
- [ ] Add project initialization logic
- [ ] Implement safe file operations (stay within workspace)
- [ ] Add file watching for live preview

**Goal**: User projects are properly isolated and managed

### 5. Error Handling & Polish
**Priority**: Low (but important)

- [ ] Add proper error messages
- [ ] Add loading states throughout UI
- [ ] Add toast notifications for actions
- [ ] Improve mobile responsiveness
- [ ] Add keyboard shortcuts

**Goal**: App feels polished and professional

---

**Last Updated**: 2025-11-23
**Version**: 0.2.0 (Phase 2 Complete - Core Features + Design System)

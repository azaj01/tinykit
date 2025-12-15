# tinykit

**Open-source agentic app builder.** Think Lovable, Replit, or v0—but self-hostable, self-contained, and single-file. Build, tweak, and deploy all your tiny web apps on a single server controlled by you.

> Build at `/tinykit`, deploy to `/`

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/tinykit)

[![Discord](https://img.shields.io/badge/Discord-Join%20us-5865F2?logo=discord&logoColor=white)](https://discord.gg/NfMjt3yUtn)
[![X](https://img.shields.io/badge/Follow-@tinykit--studio-000?logo=x&logoColor=white)](https://x.com/tinykit_studio)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## What is tinykit?

tinykit is an AI-powered development platform that generates, edits, and hosts your apps—all in one place. Unlike other platforms where you build locally and deploy separately, tinykit runs the builder AND your app on the same server.

```
You: "Build a recipe box for my family"
AI: *writes code, sets up database and fields*
You: *tweak code, update content and colors*
You: *point recipes.yourfamily.com → your server*
Done.
```

---

## Features

| Feature | Description |
|---------|-------------|
| **Self-hosted** | Your server, your data. Powered by PocketBase. |
| **Agentic** | Prompt the agent to write code, create fields and tables, wire it all up. |
| **Database baked-in** | Store data in simple JSON collections. |
| **Full code access** | Direct access to your code (a single Svelte file). |
| **Content Fields** | Edit text without touching code. |
| **Design System** | Update colors, fonts, shadows from a visual editor. |
| **Time Travel** | Snapshots on every change. Undo anything. |
| **Bring Your Own LLM** | OpenAI, Anthropic, or Gemini (more coming soon). |

**Run hundreds of apps on one server.** Point any domain → get a working app.

---

## Templates

13 starter templates included:

| Category | Templates |
|----------|-----------|
| **Productivity** | Kanban, Notes, Canvas, Timer |
| **Finance** | Expense tracker, Invoice generator |
| **Content** | Bookmarks, Recipes |
| **Social** | Linktree, Poll, Event RSVP |
| **News** | HN reader, RSS reader |

Or start from scratch.

---

## Quick Start

### Railway (Easiest)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/tinykit)

One-click deploy. Configure your LLM from the app (optionally, add key as ENV var).

### Docker (Self-Hosted)

```bash
git clone https://github.com/tinykit-studio/tinykit.git
cd tinykit/deploy/docker
docker-compose up -d
```

Works on any VPS. See [deploy/docker/README.md](./deploy/docker/README.md) for details.

---

## Roadmap

- [x] AI agent with streaming
- [x] Content & Design fields
- [x] Snapshots (time travel)
- [x] Domain-based routing
- [ ] Full PocketBase integration
- [ ] Backend functions (API routes, background jobs, cron)

---

## Docs

- [Architecture](./ARCHITECTURE.md)
- [Technical Spec](./SPEC.md)
- [Contributing](./CONTRIBUTING.md)

---

## License

MIT — see [LICENSE](./LICENSE)

---

*Build your digital homestead.*

# tinykit

**Open-source agentic app builder.** Think Lovable, Replit, or v0—but self-hostable, self-contained, and single-file. Build, tweak, and deploy all your tiny web apps on a single server controlled by you.

> Build at `/tinykit`, deploy to `/`

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/tinykit)

---

## What is tinykit?

tinykit is an AI-powered development platform that generates, edits, and hosts your apps—all in one place. Unlike other platforms where you build locally and deploy separately, tinykit runs the builder AND your app on the same server.

```
You: "Build a recipe box for my family"
AI: *writes code, sets up database*
You: *tweak colors, add a field*
You: *point recipes.yourfamily.com → your server*
Done.
```

---

## Features

| Feature | Description |
|---------|-------------|
| **Self-hosted** | Your server, your data. Powered by PocketBase. |
| **Agentic** | Prompt the agent to write code and wire up the database. |
| **Database baked-in** | Store data in simple JSON collections. |
| **Full code access** | Direct access to your code (a single Svelte file). |
| **Content Fields** | Edit text without touching code. |
| **Design System** | Update colors, fonts, shadows from a visual editor. |
| **Time Travel** | Snapshots on every change. Undo anything. |
| **Bring Your Own LLM** | OpenAI, Anthropic, Gemini, or [z.ai](https://z.ai). |

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

**Railway (fastest):** Click the deploy button above, add your API key, done.

**Local:**
```bash
git clone https://github.com/matthewmateo/tinykit.git && cd tinykit
npm install && cp .env.example .env
# Edit .env with your LLM API key, then:
npm run pocketbase:download && npm run dev
```

See [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) for full setup.

---

## Roadmap

- [x] AI agent with streaming
- [x] Content & Design fields
- [x] Snapshots (time travel)
- [x] Domain-based routing
- [ ] Full PocketBase integration
- [ ] Backend functions (API routes, cron)
- [ ] On-page visual editing

See [ROADMAP.md](./ROADMAP.md) for the full plan.

---

## Docs

- [Local Development](./LOCAL_DEVELOPMENT.md)
- [Architecture](./ARCHITECTURE.md)
- [Technical Spec](./SPEC.md)
- [Contributing](./CONTRIBUTING.md)

---

## License

MIT — see [LICENSE](./LICENSE)

---

*Build your digital homestead.*

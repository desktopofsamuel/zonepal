# ZonePal

ZonePal is a timezone comparison web application built with Next.js 14, React 18, and TypeScript. It allows users to compare multiple timezones, manage blocked hours for scheduling, and includes weather information integration.

## Getting Started

This is a pnpm workspaces monorepo. The web app lives in `apps/web-app`.

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production (includes sitemap generation) |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm release` | Create release with conventional changelog |

## Project Structure

```
zonepal/
├── apps/
│   └── web-app/          # Next.js web application
├── docs/                 # Product documentation
├── package.json          # Workspace root
└── pnpm-workspace.yaml
```

## Deploy on Vercel

Set the **Root Directory** to `apps/web-app` in your Vercel project settings.

Required environment variables:

- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`
- `NEXT_PUBLIC_MEASUREMENT_ID`
- `WEATHER_API_KEY`

See [CLAUDE.md](CLAUDE.md) for detailed architecture and development guidelines.

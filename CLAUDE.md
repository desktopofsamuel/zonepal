# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ZonePal is a timezone comparison web application built with Next.js 14, React 18, and TypeScript. It allows users to compare multiple timezones, manage blocked hours for scheduling, and includes weather information integration.

This is a **pnpm workspaces monorepo**. The web app is at `apps/web-app`.

## Development Commands

Run from the repo root:

- `pnpm dev` - Start development server on localhost:3000
- `pnpm build` - Build for production (includes sitemap generation via postbuild)
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm release` - Create release with conventional changelog

## Technology Stack

**Core Framework:**
- Next.js 14.2.11 (App Router)
- React 18 with TypeScript
- TailwindCSS 4.0.0-beta.4 (custom PostCSS config)
- pnpm workspaces

**Key Libraries:**
- `date-fns` & `date-fns-tz` for timezone handling
- `countries-and-timezones` for timezone data
- Shadcn/ui components (New York variant)
- PostHog for analytics
- `cmdk` for command palette
- `next-sitemap` for automatic sitemap generation

## Architecture

**State Management:**
- URL-based state persistence for timezones and settings
- React hooks (useState, useEffect, useMemo)
- localStorage for recent timezones

**Key Patterns:**
- Component-based architecture with functional components
- Server-side rendering with App Router
- Event-driven analytics with centralized tracking
- Type-safe development with comprehensive TypeScript definitions

## Directory Structure

```
zonepal/
├── apps/
│   └── web-app/                    # Next.js web application
│       ├── src/
│       │   ├── app/                # Next.js App Router
│       │   │   ├── [timezone1]/[timezone2]/  # SEO dynamic routes
│       │   │   ├── api/weather/    # Weather API endpoint
│       │   │   └── changelog/      # Changelog page
│       │   ├── components/         # React components
│       │   │   └── ui/             # Shadcn/ui base components
│       │   └── lib/                # Utilities and types
│       │       ├── timezone.ts     # Core timezone logic
│       │       ├── timezone-seo.ts # SEO utilities for timezone URLs
│       │       ├── analytics.ts    # PostHog event tracking
│       │       └── types.ts        # TypeScript definitions
│       ├── public/
│       ├── config.js               # Site metadata
│       └── package.json
├── docs/                           # Product documentation
├── package.json                    # Workspace root
└── pnpm-workspace.yaml
```

## Key Features & Implementation

**URL State Management:**
- Timezones: `?z=timezone1,timezone2`
- Blocked hours: `&b=blocked_hours`
- All settings persist via URL parameters

**Analytics Tracking:**
- PostHog integration with comprehensive event tracking
- Events follow `category.action` naming (e.g., `timezone.add`)
- See `docs/analytics.md` for complete event specification
- All events include automatic timestamp property

**Timezone Handling:**
- Uses IANA timezone database via `countries-and-timezones`
- Client-side calculations with `date-fns-tz`
- Recent timezones stored in localStorage
- Weather integration via custom API route

**SEO Implementation:**
- Static page generation for major timezone combinations (~780+ pages)
- SEO-friendly URLs: `/america-new-york/europe-london`
- Automatic redirect to main app with proper URL parameters
- Dynamic metadata generation with Open Graph and Twitter cards
- JSON-LD structured data for search engines
- Automatic sitemap generation via `next-sitemap`

## Component Architecture

**Core Components:**
- `TimezoneCard` - Individual timezone display with weather
- `TimelineRadix` - Visual time selection interface
- `TimezoneSearch` - Timezone search with keyboard shortcuts
- `SettingsDialog` - Configuration panel
- `Main` - Root app component orchestrating views

**UI Components:**
- Based on Shadcn/ui with Radix UI primitives
- Custom variants using `class-variance-authority`
- Responsive design with mobile-first approach

## Development Guidelines

**TypeScript:**
- Strict type checking enabled
- Comprehensive type definitions in `apps/web-app/src/lib/types.ts`
- Use proper typing for all props and state

**Styling:**
- TailwindCSS 4.0 beta with custom configuration
- Use `cn()` utility for conditional classes
- Mobile-first responsive design

**Analytics:**
- Use predefined `EventCategory` and `EventAction` enums
- Include relevant properties for each tracked event
- Reference `docs/analytics.md` for event specifications

**State Management:**
- Persist important state via URL parameters
- Use localStorage only for user preferences (recent timezones)
- Leverage React hooks for component state

## Testing & Quality

- ESLint configuration with Next.js rules
- Prettier with import sorting and Tailwind class sorting
- Conventional commit messages for releases
- Release automation with `release-it`

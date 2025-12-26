# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ZonePal is a timezone comparison web application built with Next.js 14, React 18, and TypeScript. It allows users to compare multiple timezones, manage blocked hours for scheduling, and includes weather information integration.

## Development Commands

- `npm run dev` / `yarn dev` - Start development server on localhost:3000
- `npm run build` / `yarn build` - Build for production (includes sitemap generation)
- `npm run start` / `yarn start` - Start production server
- `npm run lint` / `yarn lint` - Run ESLint
- `npm run release` / `yarn release` - Create release with conventional changelog
- `npm run postbuild` / `yarn postbuild` - Generate sitemap (runs automatically after build)

## Technology Stack

**Core Framework:**
- Next.js 14.2.11 (App Router)
- React 18 with TypeScript
- TailwindCSS 4.0.0-beta.4 (custom PostCSS config)

**Key Libraries:**
- `date-fns` & `date-fns-tz` for timezone handling
- `countries-and-timezones` for timezone data
- `firebase` for authentication and data persistence
- Shadcn/ui components (New York variant)
- PostHog for analytics
- `cmdk` for command palette
- `next-sitemap` for automatic sitemap generation

## Architecture

**State Management:**
- URL-based state persistence for timezones and settings
- Firebase authentication and Firestore for user data persistence
- React hooks (useState, useEffect, useMemo) with Context API
- localStorage for guest mode and recent timezones

**Key Patterns:**
- Component-based architecture with functional components
- Server-side rendering with App Router
- Event-driven analytics with centralized tracking
- Type-safe development with comprehensive TypeScript definitions

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── [timezone1]/[timezone2]/  # Dynamic timezone comparison routes (SEO)
│   ├── api/weather/        # Weather API endpoint
│   ├── changelog/          # Changelog page
│   └── saved/              # Saved timezones functionality
├── components/             # React components
│   ├── auth/               # Authentication components (login, user menu)
│   ├── ui/                 # Shadcn/ui base components
│   └── common/             # Shared utility components
├── contexts/               # React Context providers
│   ├── auth-context.tsx    # Firebase authentication context
│   └── user-data-context.tsx  # User data management context
└── lib/                    # Utilities and types
    ├── firebase.ts         # Firebase configuration and initialization
    ├── user-data.ts        # Firestore user data operations
    ├── timezone.ts         # Core timezone logic
    ├── timezone-seo.ts     # SEO utilities for timezone URLs
    ├── analytics.ts        # PostHog event tracking
    └── types.ts            # TypeScript definitions
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

**User Authentication & Data:**
- **Google Sign-In** as primary authentication method with email/password fallback
- Firebase Authentication with proper OAuth integration
- Firestore database for user preferences persistence across devices
- Real-time sync of timeline settings, recent timezones, and view preferences
- **Auto-load recent timezones**: When users log back in, their most recent 3 timezones are automatically loaded (if no URL params present)
- Recent timezones appear in the search dropdown for quick access
- Automatic localStorage migration for new users transitioning to authenticated accounts
- Seamless guest mode with URL-based state for unauthenticated users
- Cross-device synchronization of all user preferences and data

**Timezone Handling:**
- Uses IANA timezone database via `countries-and-timezones`
- Client-side calculations with `date-fns-tz`
- Recent timezones stored in Firestore (authenticated) or localStorage (guest)
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
- `Timeline` - Visual time selection interface
- `TimezoneSearch` - Timezone search with keyboard shortcuts and recent timezones
- `SettingsSheet` - Configuration panel for blocked hours
- `LoginDialog` - Authentication modal with Google Sign-In and email/password
- `UserMenu` - User profile menu with logout functionality

**UI Components:**
- Based on Shadcn/ui with Radix UI primitives
- Custom variants using `class-variance-authority`
- Responsive design with mobile-first approach

## Development Guidelines

**TypeScript:**
- Strict type checking enabled
- Comprehensive type definitions in `src/lib/types.ts`
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
- Persist important state via URL parameters for guest users
- Use Firebase/Firestore for authenticated user data persistence
- Use localStorage for guest mode and temporary data
- Leverage React Context API for global auth and user data state
- Use React hooks for component-level state management

**Firebase Integration:**
- Environment variables in `.env.local` for Firebase configuration
- See `FIREBASE_SETUP.md` for detailed setup instructions with Google OAuth setup
- Firestore security rules should restrict access to authenticated users
- Real-time listeners for user data updates across devices
- Google Sign-In provider configuration with authorized domains
- Automatic user profile creation with display name and email from Google
- Graceful error handling for authentication failures and network issues

## Recent Updates & Features

**Latest Firebase Integration (2024):**
- ✅ Complete Google Sign-In implementation as primary auth method
- ✅ Auto-loading of recent timezones on user login (up to 3 most recent)
- ✅ Cross-device synchronization of user preferences
- ✅ Seamless migration from localStorage to Firebase for existing users
- ✅ Real-time data sync with Firestore listeners
- ✅ Comprehensive error handling and offline fallback support

**Authentication Flow:**
1. Users see prominent "Continue with Google" button
2. Email/password available as fallback option
3. Automatic user data creation with Google profile information
4. Instant sync of preferences across all devices
5. Recent timezones automatically loaded on subsequent visits

## Testing & Quality

- ESLint configuration with Next.js rules
- Prettier with import sorting and Tailwind class sorting
- Conventional commit messages for releases
- Release automation with `release-it`
- TypeScript strict mode for enhanced type safety
- Firebase error handling and retry logic for reliability
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Lint code
npm run lint

# Database operations
npm run db:generate    # Generate migrations from schema changes
npm run db:migrate     # Run pending migrations
npm run db:studio      # Open Drizzle Studio for database inspection
```

## Architecture Overview

This is a Next.js full-stack softball team management application with the following key components:

### Tech Stack
- **Frontend**: Next.js 14 with React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with HTTP-only cookies
- **Calendar Integration**: Google Calendar API

### Directory Structure
```
src/
├── app/                    # Next.js app router pages and API routes
│   ├── api/               # Backend API endpoints
│   ├── dashboard/         # Main dashboard page
│   └── (other pages)/     # Stats, roster, schedule pages
├── components/            # React components
│   ├── layout/           # Navigation and layout components
│   ├── forms/            # Form components
│   └── ui/               # Reusable UI components
├── lib/                  # Utility libraries
│   ├── db/               # Database schema and connection
│   ├── auth/             # Authentication utilities
│   └── utils/            # Helper functions
└── types/                # TypeScript type definitions
```

### Database Schema
- **users**: Authentication and user management
- **players**: Player roster information
- **seasons**: Season organization
- **games**: Game schedule and results
- **player_game_stats**: Individual game statistics
- **scoring_book_images**: For future OCR feature

### User Roles & Permissions
- **Admin**: Full system access, user management
- **Manager**: Stats entry, roster management, game management
- **Coach**: Read-only access to all stats and schedules
- **Player**: View own stats and team information

## Development Workflow

### Setting up the database
1. Set up PostgreSQL database
2. Copy `.env.example` to `.env` and configure DATABASE_URL
3. Run `npm run db:generate` to create initial migrations
4. Run `npm run db:migrate` to apply migrations

### Adding new features
1. Update database schema in `src/lib/db/schema.ts` if needed
2. Generate and run migrations
3. Add API routes in `src/app/api/`
4. Create React components in `src/components/`
5. Add pages in `src/app/`

### Authentication Flow
- JWT tokens stored in HTTP-only cookies
- Middleware protection for authenticated routes
- Role-based access control throughout the application

## Key Features Being Built
1. ✅ User authentication with role-based permissions
2. ⏳ Player roster management
3. ⏳ Manual statistics entry
4. ⏳ Statistics viewing and analytics
5. ⏳ Google Calendar schedule integration
6. 🔄 Scoring book image processing (OCR - future feature)

## Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT token signing
- `GOOGLE_CLIENT_ID`: For Google Calendar integration
- `GOOGLE_CLIENT_SECRET`: For Google Calendar integration
- `GOOGLE_CALENDAR_ID`: Team calendar ID
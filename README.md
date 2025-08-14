# Softball Team Stats

A comprehensive team management web application for tracking softball statistics, schedules, and roster information.

## Features

- **User Authentication**: Role-based access (Admin, Manager, Coach, Player)
- **Statistics Tracking**: Individual and team performance metrics
- **Roster Management**: Player information and lineup management
- **Schedule Integration**: Google Calendar sync for games and events
- **Analytics Dashboard**: Performance trends and insights
- **Mobile Responsive**: Works on all devices

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Google Calendar API credentials (optional)

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd softball-team-stats
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database URL and other settings
   ```

3. **Set up the database**
   ```bash
   # Generate initial migrations
   npm run db:generate
   
   # Run migrations
   npm run db:migrate
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## User Roles

- **Admin**: Complete system access and user management
- **Manager**: Enter stats, manage roster, view all data  
- **Coach**: Read-only access to stats and schedules
- **Player**: View personal stats and team information

## Development

### Database Operations
```bash
npm run db:generate    # Generate migrations from schema changes
npm run db:migrate     # Apply pending migrations  
npm run db:studio      # Open database management interface
```

### Code Quality
```bash
npm run type-check     # TypeScript type checking
npm run lint          # ESLint code linting
```

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with secure HTTP-only cookies
- **Deployment**: Vercel/Railway compatible

## Project Structure

```
src/
├── app/                 # Next.js pages and API routes
├── components/          # Reusable React components
├── lib/                # Utilities and database
├── types/              # TypeScript definitions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and type checking
5. Submit a pull request

## License

MIT License - see LICENSE file for details
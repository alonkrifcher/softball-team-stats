# Getting Started

This guide will help you set up and run your softball team statistics website.

## Prerequisites

Before you begin, make sure you have:

- **Node.js 18+** installed ([download here](https://nodejs.org/))
- **PostgreSQL** database running ([download here](https://www.postgresql.org/download/))
- A PostgreSQL database created for this project

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your settings
nano .env
```

Configure these required variables in your `.env` file:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/your_database_name"
JWT_SECRET="your-super-secret-jwt-key-here-make-it-long-and-random"
```

### 3. Set Up the Database
```bash
# Generate migrations from the schema
npm run db:generate

# Run migrations to create tables
npm run db:migrate

# Add sample data (optional but recommended for testing)
npm run db:setup
```

### 4. Start the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Sample Login Credentials

After running `npm run db:setup`, you can log in with:

- **Manager Account**: `manager@teamstats.com` / `manager123`
- **Admin Account**: `admin@teamstats.com` / `admin123`

The manager account can enter stats and manage games. The admin account has full system access.

## First Steps

1. **Log in** with the manager account
2. **Go to Stats** → **Enter Stats** 
3. **Create a new game** with your next opponent
4. **Add players** and **enter their statistics**
5. **Save the stats** to see them in your dashboard

## Key Features Available

✅ **Working Now:**
- User authentication with role-based permissions
- Game creation and management  
- Comprehensive stats entry system
- Game results tracking
- Responsive design for mobile and desktop

⏳ **Coming Next:**
- Player roster management
- Advanced statistics and analytics
- Google Calendar schedule integration
- Historical performance tracking

## Common Issues

### Database Connection Error
- Verify PostgreSQL is running
- Check your `DATABASE_URL` in `.env`
- Make sure the database exists and is accessible

### Migration Errors
- Ensure the database is empty before first migration
- If tables exist, you may need to drop them first
- Check database user has proper permissions

### Port Already in Use
- The app runs on port 3000 by default
- Kill other processes using port 3000, or set `PORT=3001` in `.env`

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run code linting
npm run type-check   # Check TypeScript types

npm run db:generate  # Generate new migrations
npm run db:migrate   # Run pending migrations
npm run db:studio    # Open database browser
npm run db:setup     # Add sample data
```

## Project Structure

```
src/
├── app/                    # Next.js pages and API routes
│   ├── api/               # Backend endpoints
│   ├── dashboard/         # Main dashboard
│   └── stats/             # Statistics pages
├── components/            # React components
│   ├── forms/            # Form components
│   ├── layout/           # Navigation and layouts  
│   └── ui/               # Reusable UI elements
├── lib/                  # Core utilities
│   ├── auth/             # Authentication logic
│   ├── db/               # Database schema
│   └── utils/            # Helper functions
└── types/                # TypeScript definitions
```

## Need Help?

- Check the `README.md` for more detailed information
- Review `CLAUDE.md` for development guidelines  
- Look at the API endpoints in `src/app/api/`
- Examine the database schema in `src/lib/db/schema.ts`

Ready to start tracking your team's stats! 🥎
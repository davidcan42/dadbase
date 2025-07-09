# Database Setup Instructions

## Quick Setup Options

### Option 1: Local PostgreSQL (Recommended for Development)

1. **Install PostgreSQL**:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   
   # macOS
   brew install postgresql
   
   # Windows: Download from https://www.postgresql.org/download/
   ```

2. **Start PostgreSQL**:
   ```bash
   # Ubuntu/Debian
   sudo systemctl start postgresql
   
   # macOS
   brew services start postgresql
   ```

3. **Create Database**:
   ```bash
   # Connect to PostgreSQL
   sudo -u postgres psql
   
   # Create database and user
   CREATE DATABASE dadbase;
   CREATE USER dadbase_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE dadbase TO dadbase_user;
   \q
   ```

4. **Update .env file**:
   ```env
   DATABASE_URL="postgresql://dadbase_user:your_password@localhost:5432/dadbase"
   ```

### Option 2: Supabase (Free Cloud Database)

1. **Go to https://supabase.com**
2. **Create a new project**
3. **Go to Settings > Database**
4. **Copy the connection string**
5. **Update .env file**:
   ```env
   DATABASE_URL="your_supabase_connection_string"
   ```

### Option 3: Railway (Free Cloud Database)

1. **Go to https://railway.app**
2. **Create a new project**
3. **Add PostgreSQL service**
4. **Copy the connection string**
5. **Update .env file**:
   ```env
   DATABASE_URL="your_railway_connection_string"
   ```

## After Database Setup

1. **Push the schema**:
   ```bash
   npx prisma db push
   ```

2. **Generate Prisma client**:
   ```bash
   npx prisma generate
   ```

3. **Restart the development server**:
   ```bash
   npm run dev
   ```

## Testing Without Database

The app now includes fallback functionality for testing:

- **Chat functionality** works with mock responses
- **Profile onboarding** saves to localStorage
- **Navigation** works normally
- **Testing controls** available in Profile page

## Current Status

✅ **Working without database**:
- Onboarding flow
- Chat interface with mock responses
- Profile management (localStorage)
- Navigation and UI

❌ **Requires database**:
- Persistent chat history
- Real profile data
- User synchronization
- Goals and progress tracking

The app is fully functional for testing the UI and user experience even without a database connection! 
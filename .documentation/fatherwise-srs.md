# FatherWise Software Requirements Specification

## System Design

### Overall Architecture
FatherWise employs a **modern Progressive Web Application (PWA) architecture** designed for rapid development, scalability, and future mobile app conversion. The system follows a **client-server pattern** with a **layered architecture** approach:

- **Frontend**: React-based PWA with offline capabilities
- **Backend**: Node.js/Express API server with RAG implementation
- **Database**: PostgreSQL for user data + Vector database for embeddings
- **AI Integration**: OpenAI API with custom RAG pipeline
- **Content Storage**: Vector embeddings of Dr. Anna Machin's research

### Core System Principles
- **Mobile-First**: Responsive design optimized for father usage patterns
- **Offline-Capable**: Service workers enable core functionality without internet
- **Secure**: HTTPS-only, token-based authentication, data encryption
- **Scalable**: Microservices-ready architecture for future expansion
- **Performance**: Lazy loading, caching, and optimized bundle sizes

## Architecture Pattern

### Hybrid Layered + Client-Server Pattern
```
┌─────────────────────────────────────────┐
│              PWA Client                 │
├─────────────────────────────────────────┤
│  Presentation Layer (React Components)  │
│  Business Logic Layer (Custom Hooks)    │  
│  Data Access Layer (API Clients)        │
│  Service Worker Layer (Caching/Offline) │
└─────────────────────────────────────────┘
                    │
                 HTTPS/WSS
                    │
┌─────────────────────────────────────────┐
│             API Server                  │
├─────────────────────────────────────────┤
│  Controller Layer (Express Routes)      │
│  Service Layer (Business Logic)         │
│  Data Access Layer (DB + Vector DB)     │
│  Integration Layer (OpenAI + RAG)       │
└─────────────────────────────────────────┘
```

### Microservices-Ready Components
- **User Service**: Authentication, profiles, preferences
- **AI Service**: RAG pipeline, embeddings, chat processing  
- **Content Service**: Dr. Anna's content management
- **Community Service**: Father groups, messaging, forums
- **Analytics Service**: Usage tracking, progress monitoring

## State Management

### React State Architecture
- **Local State**: `useState` for component-specific data
- **Complex State**: `useReducer` for multi-step forms and AI chat
- **Global State**: Context API for user session and app settings
- **Server State**: React Query for API data caching and synchronization
- **Persistent State**: LocalStorage for offline data and user preferences

### State Structure
```javascript
// Global App Context
const AppContext = {
  user: {
    profile: UserProfile,
    preferences: UserPreferences,
    subscription: SubscriptionStatus
  },
  ai: {
    chatHistory: ChatMessage[],
    isLoading: boolean,
    currentThread: string
  },
  content: {
    bookmarks: ContentItem[],
    progress: LearningProgress,
    achievements: Achievement[]
  },
  community: {
    groups: CommunityGroup[],
    notifications: Notification[]
  }
}
```

## Data Flow

### RAG-Enhanced AI Chat Flow
```
User Input → NLP Processing → Intent Classification → 
Vector Search (Dr. Anna's Content) → Context Assembly → 
OpenAI API Call → Response Generation → UI Update
```

### Detailed Data Flow Patterns
1. **User Authentication Flow**
   - Login/Register → JWT Token → Secure Storage → API Headers
   
2. **AI Chat Flow**
   - User Message → Preprocessing → Vector Similarity Search → 
   - Context Injection → LLM Processing → Response Streaming → UI Update
   
3. **Content Discovery Flow**
   - User Query → Search Index → Relevance Ranking → 
   - Results Presentation → User Interaction Tracking
   
4. **Offline Sync Flow**
   - Online Actions → Local Queue → Background Sync → 
   - Conflict Resolution → UI Reconciliation

## Technical Stack

### Frontend Technologies
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with PWA plugin
- **Styling**: Tailwind CSS with custom father-friendly theme
- **State Management**: React Context + React Query
- **Routing**: React Router v6
- **Forms**: React Hook Form with Zod validation
- **Charts**: Chart.js for progress visualization
- **PWA**: Workbox for service worker management

### Backend Technologies
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **API Style**: RESTful APIs with GraphQL consideration for v2
- **Database**: PostgreSQL 15+ for relational data
- **Vector Database**: Pinecone or Weaviate for embeddings
- **Caching**: Redis for session and API caching
- **File Storage**: AWS S3 for user uploads and content

### AI/ML Technologies
- **Language Model**: OpenAI GPT-4 with function calling
- **Embeddings**: OpenAI text-embedding-ada-002
- **Vector Search**: Semantic similarity with cosine distance
- **Content Processing**: LangChain for RAG pipeline
- **Model Monitoring**: Custom logging and performance tracking

### DevOps & Infrastructure
- **Deployment**: Docker containers on AWS/Vercel
- **CI/CD**: GitHub Actions for automated testing and deployment
- **Monitoring**: Sentry for error tracking, Analytics for usage
- **Security**: Helmet.js, rate limiting, input validation
- **Testing**: Jest + React Testing Library + Playwright

## Authentication Process

### Multi-Factor Authentication Flow
```
1. Primary Authentication (OAuth + Email/Password)
   ├── Google OAuth 2.0
   ├── Apple Sign-In  
   └── Email/Password with bcrypt hashing

2. Optional 2FA Enhancement
   ├── SMS OTP
   ├── TOTP (Google Authenticator)
   └── Email verification codes

3. Session Management
   ├── JWT Access Tokens (15 min expiry)
   ├── Refresh Tokens (7 days, rotating)
   └── Secure HttpOnly cookies for web
```

### Security Implementation
- **Password Requirements**: Minimum 8 characters, complexity rules
- **Account Lockout**: 5 failed attempts = 15-minute lockout
- **Token Security**: JWT with RS256 signing, token rotation
- **Privacy Controls**: GDPR-compliant data handling
- **Audit Logging**: All authentication events tracked

### Social Authentication Providers
- **Google**: Primary recommendation for fathers
- **Apple**: iOS user convenience  
- **Facebook**: Optional for community features
- **Microsoft**: Enterprise fathers integration

## Route Design

### PWA Route Structure
```
/                          # Landing page
/auth/
  ├── /login              # Sign in page
  ├── /register           # Sign up page
  ├── /forgot-password    # Password reset
  └── /verify-email       # Email verification

/dashboard                # Main father dashboard
/chat                     # AI coaching interface
/content/
  ├── /library           # Dr. Anna's content browser
  ├── /bookmarks         # Saved content
  └── /progress          # Learning tracking

/community/
  ├── /groups            # Father groups
  ├── /mentorship        # Mentor matching
  └── /discussions       # Forum-style discussions

/profile/
  ├── /settings          # Account settings
  ├── /preferences       # App customization
  └── /subscription      # Billing management

/offline                  # Offline mode interface
```

### Route Protection & Access Control
- **Public Routes**: Landing, auth pages, marketing content
- **Authenticated Routes**: Dashboard, chat, community features  
- **Premium Routes**: Advanced AI features, exclusive content
- **Admin Routes**: Content management, user administration

## API Design

### RESTful API Structure
```
Base URL: https://api.fatherwise.app/v1

Authentication:
POST   /auth/login
POST   /auth/register  
POST   /auth/refresh
DELETE /auth/logout

User Management:
GET    /users/profile
PUT    /users/profile
GET    /users/preferences
PUT    /users/preferences

AI Chat:
POST   /chat/message
GET    /chat/history/:threadId
DELETE /chat/history/:threadId
POST   /chat/thread

Content:
GET    /content/search?q={query}
GET    /content/:id
POST   /content/bookmark
GET    /content/bookmarks

Community:
GET    /community/groups
POST   /community/groups/:id/join
GET    /community/discussions
POST   /community/discussions
```

### API Security & Performance
- **Rate Limiting**: 100 requests/minute per user
- **Input Validation**: Joi schemas for all endpoints
- **Response Caching**: ETags and Cache-Control headers
- **API Versioning**: URL versioning with backward compatibility
- **Error Handling**: Consistent error response format
- **Request Logging**: Structured logging for debugging

### WebSocket Integration
- **Real-time Chat**: Live AI responses and typing indicators
- **Community Features**: Live group discussions and notifications
- **Progress Updates**: Real-time learning milestone notifications

## Database Design ERD

### Core Entity Relationships
```sql
-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_verified BOOLEAN DEFAULT FALSE,
    subscription_tier VARCHAR(50) DEFAULT 'free'
);

-- User Profiles (Father-specific data)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    children_count INTEGER,
    children_ages INTEGER[],
    relationship_status VARCHAR(50),
    primary_concerns TEXT[],
    goals TEXT[],
    communication_style VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Chat Threads
CREATE TABLE chat_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_archived BOOLEAN DEFAULT FALSE
);

-- Chat Messages
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES chat_threads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'user', -- 'user', 'assistant', 'system'
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Dr. Anna's Content
CREATE TABLE content_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(50), -- 'book_chapter', 'research_paper', 'podcast'
    source_reference VARCHAR(255),
    content_text TEXT,
    metadata JSONB,
    embedding_id VARCHAR(255), -- Reference to vector database
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User Bookmarks
CREATE TABLE user_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, content_id)
);

-- Community Groups
CREATE TABLE community_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    group_type VARCHAR(50), -- 'new_fathers', 'experienced', 'single_fathers', etc.
    is_private BOOLEAN DEFAULT FALSE,
    max_members INTEGER,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Group Memberships
CREATE TABLE group_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES community_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- 'member', 'moderator', 'admin'
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- User Progress Tracking
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
    progress_type VARCHAR(50), -- 'completed', 'in_progress', 'bookmarked'
    progress_value DECIMAL(5,2), -- 0.00 to 100.00
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Vector Database Schema (Pinecone/Weaviate)
```python
# Vector embeddings structure
{
    "id": "content_uuid",
    "values": [1536_dimensional_embedding],
    "metadata": {
        "content_type": "book_chapter",
        "title": "The Making of a Modern Father",
        "source": "dr_anna_machin",
        "chapter": 3,
        "themes": ["bonding", "hormones", "neuroscience"],
        "target_age": "newborn",
        "complexity_level": "beginner"
    }
}
```

### Database Optimization
- **Indexing Strategy**: Composite indexes on frequently queried columns
- **Partitioning**: Chat messages partitioned by month for performance
- **Connection Pooling**: pgBouncer for PostgreSQL connection management
- **Read Replicas**: Separate read/write instances for scalability
- **Backup Strategy**: Daily automated backups with point-in-time recovery
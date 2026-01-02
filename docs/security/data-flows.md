# Data Flow Diagrams

## DFD Level 0 - System Context

```mermaid
flowchart LR
    subgraph External["External Entities"]
        User["👤 YouTube Creator"]
        Google["🔵 Google/YouTube"]
        Stripe["💳 Stripe"]
        OpenAI["🤖 OpenAI"]
    end
    
    subgraph System["ChannelBoost System"]
        App["📱 ChannelBoost<br/>Application"]
    end
    
    User -->|"1. Auth + Actions"| App
    App -->|"2. Dashboard + Insights"| User
    
    App -->|"3. OAuth + API calls"| Google
    Google -->|"4. Tokens + Channel data"| App
    
    App -->|"5. Checkout + Webhooks"| Stripe
    Stripe -->|"6. Payment status"| App
    
    App -->|"7. Content prompts"| OpenAI
    OpenAI -->|"8. Generated ideas"| App
```

## DFD Level 1 - Major Data Flows

```mermaid
flowchart TB
    subgraph Browser["Browser (Untrusted)"]
        UI["React UI"]
        Cookie["Session Cookie<br/>(HttpOnly)"]
    end
    
    subgraph Vercel["Vercel Platform"]
        MW["Middleware<br/>(Headers)"]
        
        subgraph API["API Routes"]
            Auth["Auth Routes<br/>/api/auth/*"]
            Me["User Routes<br/>/api/me/*"]
            Int["Integration Routes<br/>/api/integrations/*"]
        end
        
        subgraph Services["Services"]
            UserSvc["User Service"]
            YTSvc["YouTube Service"]
            LLMSvc["LLM Service"]
            StripeSvc["Stripe Service"]
        end
    end
    
    subgraph External["External"]
        DB[(PostgreSQL)]
        Google["Google APIs"]
        StripeAPI["Stripe API"]
        OpenAIAPI["OpenAI API"]
    end
    
    UI -->|"HTTPS + Cookie"| MW
    MW -->|"Validated request"| API
    Cookie -.->|"Attached to requests"| MW
    
    Auth -->|"JWT ops"| UserSvc
    Me -->|"Authed requests"| UserSvc
    Me -->|"Channel data"| YTSvc
    Me -->|"Plan generation"| LLMSvc
    Int -->|"Payment flow"| StripeSvc
    
    UserSvc -->|"Prisma queries"| DB
    YTSvc -->|"OAuth tokens"| Google
    LLMSvc -->|"Prompts"| OpenAIAPI
    StripeSvc -->|"API calls"| StripeAPI
```

## DFD Level 1 - OAuth + YouTube Data Flow (Most Sensitive)

```mermaid
sequenceDiagram
    participant U as User Browser
    participant MW as Middleware
    participant Start as /api/integrations/google/start
    participant Google as Google OAuth
    participant CB as /api/integrations/google/callback
    participant DB as PostgreSQL
    participant YT as YouTube API
    
    Note over U,YT: OAuth Authorization Flow
    
    U->>MW: GET /api/integrations/google/start
    MW->>Start: Validated request
    Start->>Start: Generate state (crypto.randomBytes(24))
    Start->>DB: Store OAuthState (userId, state, expiresAt=10min)
    Start-->>U: 302 Redirect to Google OAuth
    
    U->>Google: Consent screen
    Google-->>U: 302 Redirect with code + state
    
    U->>MW: GET /api/integrations/google/callback?code=...&state=...
    MW->>CB: Validated request
    CB->>DB: Lookup OAuthState by state
    DB-->>CB: OAuthState record
    CB->>CB: Verify state not expired
    CB->>DB: DELETE OAuthState (single-use)
    
    CB->>Google: Exchange code for tokens
    Google-->>CB: access_token + refresh_token
    
    CB->>DB: Upsert GoogleAccount (store tokens)
    CB->>YT: GET /channels (with access_token)
    YT-->>CB: Channel list
    CB->>DB: Create/update Channel records
    
    CB-->>U: 302 Redirect to /dashboard
    
    Note over U,YT: Subsequent API Calls
    
    U->>MW: GET /api/me/channels/[id]/videos
    MW->>DB: Load user from JWT
    MW->>DB: Verify channel ownership (userId match)
    MW->>DB: Get GoogleAccount tokens
    MW->>MW: Check token expiry
    
    alt Token expired
        MW->>Google: Refresh token exchange
        Google-->>MW: New access_token
        MW->>DB: Update GoogleAccount.accessTokenEnc
    end
    
    MW->>YT: GET /videos with access_token
    YT-->>MW: Video data
    MW->>DB: Cache video data
    MW-->>U: JSON response (no tokens exposed)
```

## DFD Level 1 - LLM Content Generation Flow

```mermaid
sequenceDiagram
    participant U as User Browser
    participant API as /api/me/channels/[id]/plan/generate
    participant Auth as withAuth()
    participant RL as Rate Limiter
    participant DB as PostgreSQL
    participant LLM as OpenAI API
    
    U->>API: POST (Cookie auth)
    API->>Auth: Verify JWT session
    Auth->>DB: Load user + subscription
    DB-->>Auth: User (subscribed=true)
    
    API->>RL: Check rate limit (user:planGeneration)
    
    alt Rate limit exceeded
        RL-->>U: 429 Too Many Requests
    end
    
    API->>DB: Load channel data (verify ownership)
    API->>DB: Load recent videos
    API->>DB: Check plan cache (24h TTL)
    
    alt Cached plan exists
        DB-->>U: Return cached plan
    end
    
    API->>API: Build prompt (NO PII, NO tokens)
    Note right of API: Prompt contains:<br/>- Video titles<br/>- View counts<br/>- Channel niche<br/>NO: email, name, tokens
    
    API->>LLM: POST /chat/completions
    LLM-->>API: Generated plan
    
    API->>DB: Store plan (cache 24h)
    API-->>U: JSON response
```

## Sensitive Data Never Crosses These Boundaries

| Data Type | Allowed Zones | Never Sent To |
|-----------|---------------|---------------|
| Passwords | DB (hashed only) | Logs, Client, APIs |
| OAuth Tokens | DB, Google | Logs, Client, OpenAI |
| Stripe Keys | Env vars, Stripe | Logs, Client, DB |
| User Email | DB, Resend | OpenAI, Logs (redacted) |
| JWT Secret | Env vars, NextAuth | Anywhere else |

## Data Deletion Flows

```mermaid
flowchart TD
    subgraph UserDelete["User Account Deletion"]
        A[User requests delete] --> B[Delete User record]
        B --> C[Cascade: Channels]
        C --> D[Cascade: Videos]
        D --> E[Cascade: Plans]
        E --> F[Cascade: GoogleAccounts]
        F --> G[Cascade: Subscriptions]
        G --> H[Cascade: SavedIdeas]
    end
    
    subgraph CacheExpiry["Automatic Cache Expiry"]
        I[Cache TTL reached] --> J[Cron job runs]
        J --> K[Delete expired RetentionBlobs]
        K --> L[Delete expired VideoMetrics]
        L --> M[Delete expired Plans]
    end
```

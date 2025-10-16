# Email Agent Architecture

## System Overview

**Purpose**: Microsoft Teams bot for querying blocked/held/rejected emails in Mimecast.

**Flow**: User asks question in Teams → Parse query → Search Mimecast API → Format results as Adaptive Card → Reply in Teams.

**Performance Target**: <5 seconds from query to response.

---

## Technology Stack

- **Runtime**: Node.js 18+ with TypeScript 5+
- **Bot Framework**: Microsoft Bot Framework 4.x (CloudAdapter)
- **LLM**: Anthropic Claude API (query parsing with tool calling)
- **Email Security**: Mimecast API (OAuth or HMAC auth)
- **HTTP Server**: Restify (Teams endpoint) + Express (health checks)
- **Logging**: Winston (structured JSON logs)
- **Authentication**: Azure AD (bot) + Mimecast HMAC (API) + Anthropic API key

---

## Core Components

### 1. Teams Bot Handler
**File**: `src/teams/message-handler.ts`

**Responsibilities**:
- Receive incoming Teams messages
- Route to email auditor
- Send Adaptive Card responses
- Handle user interactions (buttons, forms)

**Bot Framework Activities**:
- `message` - User text query
- `conversationUpdate` - Bot added to channel
- `invoke` - Button clicks (future: release email, block sender)

### 2. Query Parser (Anthropic Claude SDK)
**File**: `src/services/query-parser.ts`

**Responsibilities**:
- Parse natural language questions using Claude API
- Use tool calling to extract structured search parameters
- Handle ambiguous queries with LLM understanding
- Convert tool call output to Mimecast API params

**Strategy**: Anthropic SDK with tool calling (not orchestration framework)

**Tool Definition**:
```typescript
const tools = [{
  name: 'search_mimecast',
  description: 'Search Mimecast for blocked, held, or rejected emails',
  input_schema: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['blocked', 'held', 'rejected', 'all'],
        description: 'Email status to search for'
      },
      sender: {
        type: 'string',
        description: 'Email address, domain, or IP to search for'
      },
      days: {
        type: 'number',
        description: 'Number of days to search back',
        default: 7
      }
    },
    required: ['status']
  }
}];
```

**Workflow**:
1. User query → Anthropic API with tools
2. Claude returns tool call (search_mimecast)
3. Extract params from tool call
4. Pass to Email Auditor for execution

**Why Anthropic SDK?**
- Native tool calling support
- Direct control over prompts
- Easy debugging
- Single-turn parsing (no multi-step orchestration needed)

### 3. Email Auditor
**File**: `src/agents/email-auditor.ts`

**Responsibilities**:
- Orchestrate query parsing and Mimecast search
- Convert tool call parameters to Mimecast API params
- Execute search and handle errors
- Return structured results

**Workflow**:
1. Receive user query from Teams handler
2. Parse query using Anthropic Claude SDK
3. Execute Mimecast search with parsed parameters
4. Return results or error

### 4. Mimecast Client
**File**: `src/services/mimecast-client.ts`

**Responsibilities**:
- Authenticate with Mimecast (HMAC)
- Execute message search API requests
- Handle rate limiting (10 req/s)
- Retry on transient failures

**API Endpoints Used**:
- `POST /api/message-finder/search` - Search messages

### 5. Adaptive Cards Builder
**File**: `src/teams/adaptive-cards.ts`

**Responsibilities**:
- Format search results as Adaptive Cards
- Create error/empty result cards
- Build welcome cards

**Card Types**:
- Search results card (email list)
- No results card (helpful message)
- Error card (API failure, auth issues)

---

## Data Flow

```
┌──────────────────┐
│ User in Teams    │
│ "Show blocked    │
│ emails from      │
│ chase.com"       │
└────────┬─────────┘
         │
         v
┌──────────────────────┐
│ Teams Bot Handler    │
│ Receive message      │
└────────┬─────────────┘
         │
         v
┌──────────────────────────────┐
│ LLM Query Parser             │
│ • Anthropic API with tools   │
│ • Extract structured params  │
│ • Tool call: search_mimecast │
│   {                          │
│     status: "blocked",       │
│     sender: "chase.com",     │
│     days: 7                  │
│   }                          │
└────────┬─────────────────────┘
         │
         v
┌──────────────────────┐
│ Email Auditor        │
│ Search Mimecast API  │
│ Filter results       │
└────────┬─────────────┘
         │
         v
┌──────────────────────┐
│ Response Builder     │
│ Format Adaptive Card │
└────────┬─────────────┘
         │
         v
┌──────────────────────┐
│ Teams Bot Handler    │
│ Send card to user    │
└──────────────────────┘
```

**Note**: LLM query parsing adds 1-2 seconds of latency but handles ambiguous queries naturally.

---

## API Endpoints

### Teams Bot Endpoint
```
POST /api/messages

Receives Teams activities (messages, invokes, updates).
Authenticates using Microsoft App ID/Password.
```

### Health Check
```
GET /health

Response: { "status": "healthy", "timestamp": "..." }
```

### Readiness Check
```
GET /ready

Response: {
  "status": "ready",
  "mimecastConnected": true,
  "botRegistered": true
}
```

---

## Configuration

### Environment Variables

**Required - Teams Bot**:
- `MICROSOFT_APP_ID` - Azure bot app ID
- `MICROSOFT_APP_PASSWORD` - Azure bot secret
- `MICROSOFT_APP_TENANT_ID` - Azure AD tenant
- `MICROSOFT_APP_TYPE` - Bot type (MultiTenant, SingleTenant)

**Required - Anthropic**:
- `ANTHROPIC_API_KEY` - Claude API key for query parsing

**Required - Mimecast**:
- `MIMECAST_BASE_URL` - API endpoint (https://api.mimecast.com)
- `MIMECAST_APP_ID` - App ID
- `MIMECAST_APP_KEY` - App key
- `MIMECAST_ACCESS_KEY` - Access key
- `MIMECAST_SECRET_KEY` - Secret key

**Optional**:
- `PORT` - HTTP server port (default: 3978)
- `MAX_RESULTS_PER_QUERY` - Result limit (default: 50)
- `DEFAULT_TIME_RANGE_DAYS` - Search window (default: 7)

### Azure Bot Service Configuration

**Messaging Endpoint**: `https://your-domain.com/api/messages`

**Channels**: Microsoft Teams

**Permissions**: No special Graph API permissions needed (bot-only)

---

## Mimecast Integration

### Authentication

**HMAC Authentication** (API 1.0):
1. Generate request ID (UUID)
2. Create HMAC signature using secret key
3. Include headers: `x-mc-app-id`, `x-mc-date`, `x-mc-req-id`, `Authorization`

**OAuth Authentication** (API 2.0 - future):
1. Exchange client credentials for access token
2. Include `Authorization: Bearer {token}` header

### Message Search API

**Endpoint**: `POST /api/message-finder/search`

**Request**:
```json
{
  "meta": {
    "pagination": {
      "pageSize": 50,
      "pageToken": ""
    }
  },
  "data": [
    {
      "searchReason": "Blocked",
      "from": "chase.com",
      "start": "2025-10-09T00:00:00Z",
      "end": "2025-10-16T23:59:59Z"
    }
  ]
}
```

**Response**:
```json
{
  "meta": {
    "status": 200
  },
  "data": [
    {
      "id": "msg-123",
      "subject": "Account Alert",
      "from": "noreply@chase.com",
      "to": ["user@company.com"],
      "received": "2025-10-15T14:30:00Z",
      "status": "blocked",
      "reason": "Phishing pattern detected"
    }
  ]
}
```

### Rate Limiting

**Limit**: 10 requests/second per account

**Strategy**:
- Exponential backoff on 429 errors
- Cache results for 5 minutes
- Batch requests where possible

---

## Adaptive Cards

### Search Results Card

```json
{
  "type": "AdaptiveCard",
  "version": "1.5",
  "body": [
    {
      "type": "TextBlock",
      "text": "Blocked Emails from chase.com",
      "weight": "Bolder",
      "size": "Large"
    },
    {
      "type": "TextBlock",
      "text": "Found 3 results in the last 7 days",
      "color": "Good"
    },
    {
      "type": "Container",
      "items": [
        {
          "type": "ColumnSet",
          "columns": [
            {
              "type": "Column",
              "items": [
                { "type": "TextBlock", "text": "From:", "weight": "Bolder" },
                { "type": "TextBlock", "text": "noreply@chase.com" }
              ]
            },
            {
              "type": "Column",
              "items": [
                { "type": "TextBlock", "text": "Date:", "weight": "Bolder" },
                { "type": "TextBlock", "text": "Oct 15, 14:30" }
              ]
            }
          ]
        },
        {
          "type": "TextBlock",
          "text": "Subject: Account Alert - Verify Now"
        },
        {
          "type": "TextBlock",
          "text": "Reason: Phishing pattern detected",
          "color": "Attention"
        }
      ]
    }
  ]
}
```

---

## Error Handling

### Graceful Degradation
- **Mimecast API timeout**: Return cached results or error card
- **Authentication failure**: Log error, prompt user to retry
- **Query parsing failure**: Ask user to rephrase question

### Retry Strategy
- **429 Rate Limit**: Wait 1s, retry (max 3 attempts)
- **500 Server Error**: Retry with exponential backoff
- **4xx Client Error**: Log and return error card (no retry)

---

## Performance Characteristics

**Query Processing**:
- LLM query parsing: 1-2 seconds (Anthropic API with tool calling)
- Mimecast API call: 1-3 seconds
- Adaptive Card formatting: <100ms
- Total: 3-5 seconds average

**Cost per Query**: ~$0.01-0.02 (Claude 3.5 Sonnet)

**Concurrency**:
- Handle 10+ simultaneous queries
- Rate limit per Mimecast account (not per query)

---

## Security Considerations

### Data Privacy
- No message content stored (only metadata)
- Audit queries logged (who, what, when)
- No sensitive data in logs

### Authentication
- Teams bot authenticated via Azure AD
- Mimecast API uses HMAC signatures
- Secrets stored in environment variables (Azure Key Vault in production)

### Query Validation
- Sanitize all user input
- Prevent injection attacks
- Validate sender format (email/domain/IP only)

---

## Deployment

### Local Development
```bash
npm install
cp .env.example .env
# Edit .env with credentials
npm run dev
```

### Production (Azure)
- Deploy to Azure App Service or Container Apps
- Configure environment variables in Azure Portal
- Set messaging endpoint in Azure Bot Service
- Enable Teams channel

---

## Monitoring

### Logs
- **Info**: Query received, API call, results returned
- **Warn**: API errors, slow responses
- **Error**: Authentication failures, bot crashes
- **Security**: Unusual query patterns

### Metrics
- Queries per minute
- Average response time
- Mimecast API success rate
- Top queried senders/domains

### Health Checks
- `/health` - Server alive
- `/ready` - Mimecast connected, bot registered

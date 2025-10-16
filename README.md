# Email Agent

Microsoft Teams bot for querying blocked/held/rejected emails in Mimecast.

## Overview

**Purpose**: Help users investigate email delivery issues by searching Mimecast audit logs via conversational Teams queries.

**Flow**: User asks question in Teams → Parse query → Search Mimecast API → Return findings as Adaptive Card.

**Tech Stack**: TypeScript + Node.js + Microsoft Bot Framework + Mimecast API

---

## Features

- **Conversational Interface**: Ask questions in natural language (no command syntax)
- **Mimecast Integration**: Search blocked, held, and rejected emails
- **Fast Queries**: <5 second response time
- **Rich Responses**: Adaptive Cards with structured email lists
- **Flexible Filtering**: By sender (email/domain/IP), status, time range
- **Atomic Code**: Max 25 lines per function, max 150 lines per file

---

## Quick Start

### Prerequisites

- Node.js 18+
- Microsoft Teams
- Azure Bot Service registration
- Mimecast API credentials

### Installation

```bash
git clone <repository-url>
cd email-agent
npm install
cp .env.example .env
# Edit .env with your Azure + Mimecast credentials
npm run build
npm start
```

### Development

```bash
npm run dev  # Hot reload with tsx
```

---

## Configuration

### Required Environment Variables

```env
# Azure Bot Configuration
MICROSOFT_APP_ID=your-teams-app-id
MICROSOFT_APP_PASSWORD=your-teams-app-password
MICROSOFT_APP_TENANT_ID=your-tenant-id
MICROSOFT_APP_TYPE=MultiTenant

# Mimecast Configuration
MIMECAST_BASE_URL=https://api.mimecast.com
MIMECAST_APP_ID=your-app-id
MIMECAST_APP_KEY=your-app-key
MIMECAST_ACCESS_KEY=your-access-key
MIMECAST_SECRET_KEY=your-secret-key

# Server
PORT=3978
NODE_ENV=development
```

### Azure Bot Service Setup

1. **Create Bot Registration**: Azure Portal → Bot Services → Create
2. **Configure Messaging Endpoint**: `https://your-domain.com/api/messages`
3. **Enable Teams Channel**: Channels → Microsoft Teams → Enable
4. **Add to Teams**: App Studio → Import App → Test in channel

---

## Usage

### Example Queries

**Blocked Emails**:
- "Show blocked emails from chase.com"
- "Do we have any blocked emails from paypal.com?"
- "List blocked emails from 192.168.1.1"

**Held Emails**:
- "Show me held emails from sender@example.com"
- "Any emails on hold from suspicious-domain.tk?"

**Rejected Emails**:
- "List rejected emails in the last 24 hours"
- "Show me all rejected emails from this domain"

**Time-Based Queries**:
- "Blocked emails today"
- "Show me rejected emails from last week"
- "Any held emails in the last 7 days?"

### Example Conversation

```
User: "Show blocked emails from chase.com"

Bot: [Adaptive Card]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Blocked Emails from chase.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Found 3 results in the last 7 days

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email 1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
From: noreply@chase.com
Subject: Account Alert - Verify Now
Date: Oct 15, 14:30
Reason: Phishing pattern detected

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email 2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
From: security@chase.com
Subject: Unusual Activity Detected
Date: Oct 14, 09:15
Reason: Suspicious link

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email 3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
From: alerts@chase.com
Subject: Urgent: Account Suspended
Date: Oct 12, 16:45
Reason: Domain impersonation
```

---

## API Endpoints

### Teams Bot Endpoint

```bash
POST /api/messages

Receives Teams messages and bot activities.
Secured by Microsoft App ID/Password authentication.
```

### Health Check

```bash
GET /health

Response:
{
  "status": "healthy",
  "timestamp": "2025-10-16T12:00:00Z",
  "version": "0.1.0"
}
```

### Readiness Check

```bash
GET /ready

Response:
{
  "status": "ready",
  "mimecastConnected": true,
  "botRegistered": true
}
```

---

## Architecture

### Core Components

```
src/
├── bot/
│   ├── teams-handler.ts      # Teams message routing
│   ├── response-builder.ts   # Adaptive Card formatter (NEW)
│   └── adaptive-cards.ts     # Card templates
├── services/
│   ├── query-parser.ts       # NLP query parsing (NEW)
│   ├── email-auditor.ts      # Mimecast search orchestrator (NEW)
│   └── mimecast-client.ts    # Mimecast API integration
├── lib/
│   ├── config.ts
│   ├── logger.ts
│   └── types.ts
└── index.ts                   # HTTP server + bot adapter
```

### Data Flow

```
User query in Teams → Teams Bot Handler → Query Parser →
Email Auditor → Mimecast API → Response Builder →
Adaptive Card → Teams message
```

For detailed architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Development Guidelines

### Code Quality Standards

- **Functions**: Max 25 lines, single responsibility
- **Files**: Max 150 lines
- **Style**: Stateless, deterministic, type-safe
- **Error Handling**: Use `Result<T, E>` pattern

### Testing

```bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
npm test -- --coverage # Coverage report
```

**Target**: 90%+ test coverage for all code.

### Example Atomic Function

```typescript
export function parseTimeRange(query: string): number {
  const lower = query.toLowerCase();
  if (lower.includes('today') || lower.includes('24 hour')) return 1;
  if (lower.includes('yesterday')) return 2;
  if (lower.includes('week') || lower.includes('7 day')) return 7;
  if (lower.includes('month') || lower.includes('30 day')) return 30;
  return 7; // Default: 7 days
}
```

---

## Roadmap

### v0.1.0 (Current)
- [x] Project structure
- [x] Documentation templates
- [ ] Teams bot handler
- [ ] Query parser
- [ ] Mimecast client
- [ ] Email auditor service

### v0.2.0 (MVP - Next)
- [ ] Natural language query parsing
- [ ] Mimecast API integration
- [ ] Adaptive Card responses
- [ ] Health checks

### v0.3.0 (Enhanced UX)
- [ ] Interactive buttons (Release, Block, Details)
- [ ] Query history & caching
- [ ] Advanced filtering (multiple senders, recipients)
- [ ] Statistics & reporting

For complete roadmap, see [roadmap.md](./roadmap.md).

---

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Agent behavior and instructions
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design and data flow
- **[changelog.md](./changelog.md)** - Version history
- **[decision-log.md](./decision-log.md)** - Technical decisions with rationale
- **[roadmap.md](./roadmap.md)** - Feature planning and GitHub issues

---

## License

MIT License - see LICENSE file for details.

---

## Support

- **Issues**: Report bugs or request features via GitHub Issues
- **Documentation**: See docs/ directory for detailed guides
- **Security**: Report vulnerabilities privately to security@company.com

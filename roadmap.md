# Email Agent Roadmap

This roadmap tracks current status, upcoming features, and future enhancements for the email-agent project.

---

## Current Status: v0.2.0 (MVP Implementation Complete)

**Completion**: 80%

- [x] Project structure created
- [x] Documentation templates
- [x] TypeScript configuration
- [x] Teams bot handler (CloudAdapter, message routing)
- [x] Mimecast client (HMAC auth, message search)
- [x] Query parser (Anthropic Claude SDK with tool calling)
- [x] Email auditor service (orchestration)
- [x] Adaptive Card responses (search results, errors)
- [x] Configuration management and logging
- [x] GitHub repository setup (https://github.com/afoxnyc3/email-agent)
- [ ] Testing framework (Jest, 90%+ coverage)

---

## Phase 1: Core Functionality (MVP)

**Target**: v0.2.0
**Estimated Duration**: 2-3 weeks

### Features

#### Issue #1: Teams Bot Handler
**Status**: ✅ Completed (2025-10-16)
**Priority**: P0 (Blocker)

Implement Teams bot infrastructure:
- Bot Framework CloudAdapter setup
- Message routing
- Adaptive Card sending
- Error handling

**Acceptance Criteria**:
- [x] Receives Teams messages
- [x] Sends Adaptive Card responses
- [x] Handles bot added/removed events
- [x] Health check endpoint working

#### Issue #2: Query Parser with Anthropic Claude SDK
**Status**: ✅ Completed (2025-10-16)
**Priority**: P0 (Blocker)

Parse natural language email audit queries using Anthropic Claude SDK with tool calling:
- **Architecture**: Anthropic SDK with `search_mimecast` tool (required, not optional)
- **Single-turn interaction**: LLM tool calling → structured parameters (no multi-step orchestration)
- Tool schema: `{ status: 'blocked'|'held'|'rejected'|'all', sender: string, days: number }`
- Handles ambiguous queries with natural language understanding
- Cost: ~$0.01-0.02 per query, Latency: 1-2s

**Implementation Note**: Originally considered regex parsing, but architectural decision (2025-10-16) mandated Anthropic SDK as primary strategy for handling complex/ambiguous queries. See decision log for "Anthropic SDK with Tool Calling (Required, Not Optional)".

**Acceptance Criteria**:
- [x] All functions <25 lines
- [x] Parses 90%+ of common query patterns
- [x] Handles ambiguous queries gracefully
- [x] Returns structured search parameters via tool calling

**Test Queries** (all handled by LLM):
- "Show blocked emails from chase.com"
- "Any rejected emails today?"
- "Do we have held emails from sender@example.com?"

#### Issue #3: Mimecast Client
**Status**: ✅ Completed (2025-10-16)
**Priority**: P0 (Blocker)

Integrate with Mimecast API:
- HMAC authentication
- Message search endpoint
- Rate limiting (10 req/s)
- Retry logic for transient failures

**Acceptance Criteria**:
- [x] Authenticates successfully
- [x] Searches messages by sender/status/date
- [x] Handles rate limits gracefully
- [x] Returns structured results

#### Issue #4: Email Auditor Service
**Status**: ✅ Completed (2025-10-16)
**Priority**: P0 (Blocker)

Orchestrate Mimecast queries and result filtering:
- Convert parsed query to Mimecast params
- Execute search
- Filter and sort results
- Paginate (max 50 results)

**Acceptance Criteria**:
- [x] All functions <25 lines
- [x] Completes queries in <5 seconds
- [x] Returns structured email list
- [x] Handles no results gracefully

#### Issue #5: Response Builder (Adaptive Cards)
**Status**: ✅ Completed (2025-10-16)
**Priority**: P0 (Blocker)

Format search results as Adaptive Cards:
- Search results card (email list)
- No results card (helpful message)
- Error card (API failures)

**Acceptance Criteria**:
- [x] Cards render correctly in Teams desktop + mobile
- [x] Email list is scannable and readable
- [x] Error messages are clear and actionable

#### Issue #6: Configuration Management
**Status**: ✅ Completed (2025-10-16)
**Priority**: P1 (High)

Environment-based configuration:
- Load from .env file
- Validate required variables
- Type-safe config access
- Secure secret handling

**Acceptance Criteria**:
- [x] All config in .env.example documented
- [x] Fails fast on missing required vars
- [x] No secrets in logs

#### Issue #7: Logging & Monitoring
**Status**: ✅ Completed (2025-10-16)
**Priority**: P1 (High)

Structured logging for observability:
- Winston logger with JSON format
- Log levels (info, warn, error, security)
- Correlation IDs for request tracing
- Health check endpoints

**Acceptance Criteria**:
- [x] All queries logged with user context
- [x] No sensitive data in logs
- [x] Metrics tracked (queries/min, response time)

---

## Phase 2: Enhanced UX (Post-MVP)

**Target**: v0.3.0
**Estimated Duration**: 2-3 weeks

### Features

#### Issue #8: Interactive Actions
**Status**: Not Started
**Priority**: P2 (Medium)

Add buttons to Adaptive Cards for common actions:
- "Release Email" - Release from quarantine
- "Block Sender" - Add to blocklist
- "View Details" - Full email headers/body

**Acceptance Criteria**:
- [ ] Buttons trigger bot invoke activities
- [ ] Actions call appropriate Mimecast APIs
- [ ] Success/failure feedback to user

#### Issue #9: Query History & Caching
**Status**: Not Started
**Priority**: P2 (Medium)

Improve performance with caching:
- Cache Mimecast API results (5-min TTL)
- Show recent queries to user
- Quick re-run of previous queries

**Acceptance Criteria**:
- [ ] Cache reduces duplicate API calls
- [ ] Users can see recent query history
- [ ] Cache invalidation works correctly

#### Issue #10: Advanced Filtering
**Status**: Not Started
**Priority**: P2 (Medium)

Support more complex queries:
- Multiple senders ("from chase.com or paypal.com")
- Recipient filtering ("to john@company.com")
- Subject keyword search
- Attachment filtering (emails with attachments)

**Acceptance Criteria**:
- [ ] Parses AND/OR logic in queries
- [ ] Supports recipient + sender filtering
- [ ] Searches subject lines

#### Issue #11: Statistics & Reporting
**Status**: Not Started
**Priority**: P2 (Medium)

Aggregate email audit metrics:
- "How many blocked emails this week?"
- "Top 5 blocked senders"
- "Trend chart: blocked emails over time"

**Acceptance Criteria**:
- [ ] Aggregates Mimecast data
- [ ] Returns summary statistics
- [ ] Optional: Chart images in Adaptive Cards

---

## Phase 3: Advanced Features (Future)

**Target**: v0.4.0+
**Estimated Duration**: TBD

### Potential Features

#### Issue #12: Proactive Alerts
**Status**: Backlog
**Priority**: P3 (Low)

Notify users of unusual email patterns:
- Sudden spike in blocked emails from a domain
- New sender never seen before
- High volume of rejected emails

**Considerations**:
- Requires background monitoring job
- Alert thresholds need tuning
- May generate noise if not careful

#### Issue #13: Email Release Workflow
**Status**: Backlog
**Priority**: P3 (Low)

Full workflow for releasing quarantined emails:
- User requests release via button
- Manager approval (if needed)
- Automatic release + notification

**Considerations**:
- Requires approval logic
- May need integration with ticketing system
- Security implications of self-service release

#### Issue #14: Multi-Tenant Support
**Status**: Backlog
**Priority**: P3 (Low)

Support multiple Mimecast accounts:
- Different credentials per tenant
- Tenant selection in query
- Isolated data per tenant

**Considerations**:
- Requires multi-tenant architecture
- More complex configuration
- Probably overkill for single company

---

## Maintenance & Operations

### Ongoing Tasks

- **Security Updates**: Monthly dependency audits
- **Documentation**: Update as features added
- **Testing**: Maintain 90%+ coverage
- **Performance**: Monitor query times, optimize bottlenecks
- **User Feedback**: Tune query parsing based on usage patterns

---

## Version History

- **v0.1.0** (2025-10-16): Project initialization
- **v0.2.0** (Planned): Core MVP functionality
- **v0.3.0** (Planned): Enhanced UX
- **v0.4.0** (Future): Advanced features

---

**Note**: All issues should be created in GitHub with labels (feature, enhancement, bug) and linked to this roadmap.

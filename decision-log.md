# Decision Log

This document tracks significant technical and architectural decisions made during the development of email-agent.

---

## Decision: Teams Bot Interface (Not Web UI)

**Date**: 2025-10-16
**Status**: Accepted
**Context**: Need user-friendly interface for Mimecast email audit queries.

**Decision**: Build as Microsoft Teams bot instead of standalone web app.

**Rationale**:
- Users already in Teams for daily work (no context switching)
- Conversational interface more intuitive than forms/filters
- Adaptive Cards provide rich formatting
- No separate login (uses Teams SSO)
- Easy deployment (Azure Bot Service)

**Consequences**:
- ✅ Native Teams experience, no app switching
- ✅ Conversational queries feel natural
- ✅ No authentication UI needed
- ⚠️ Limited to Teams users only
- ⚠️ Requires Azure Bot Service setup

**Alternatives Considered**:
- Web dashboard (rejected: extra login, context switching)
- Slack bot (rejected: company uses Teams)
- Email-based queries (rejected: less interactive)

---

## Decision: Natural Language Query Parsing

**Date**: 2025-10-16
**Status**: Accepted
**Context**: Users shouldn't need to learn command syntax.

**Decision**: Parse conversational questions without strict command format.

**Rationale**:
- More user-friendly ("Show blocked emails from chase.com" vs "/search --blocked --sender chase.com")
- Matches Teams conversational UX
- Can add AI/LLM enhancement later if needed
- Simple regex patterns work for common queries

**Consequences**:
- ✅ Intuitive user experience
- ✅ No training required
- ✅ Feels natural in Teams chat
- ⚠️ Ambiguous queries may require clarification
- ⚠️ More complex parsing logic

**Alternatives Considered**:
- Strict command syntax (rejected: poor UX, steep learning curve)
- LLM-based parsing (deferred: overkill for MVP, can add later)
- Form-based input (rejected: not conversational)

---

## Decision: Mimecast API Integration

**Date**: 2025-10-16
**Status**: Accepted
**Context**: Need access to company email security appliance for auditing.

**Decision**: Integrate directly with Mimecast API (message-finder endpoints).

**Rationale**:
- Mimecast is company's email security platform
- API provides search, filter, and detail retrieval
- HMAC authentication is secure and reliable
- Covers blocked, held, rejected email statuses

**Consequences**:
- ✅ Direct access to email security data
- ✅ Real-time query results
- ✅ Comprehensive filtering options
- ⚠️ Requires Mimecast API credentials
- ⚠️ Rate limiting (10 req/s)

**Alternatives Considered**:
- Microsoft Graph API (rejected: no Mimecast data access)
- Database replication (rejected: complex infrastructure)
- Manual CSV export (rejected: not real-time)

---

## Decision: Adaptive Cards for Results Display

**Date**: 2025-10-16
**Status**: Accepted
**Context**: Need structured, readable format for email search results.

**Decision**: Use Adaptive Cards v1.5 for all bot responses.

**Rationale**:
- Native Teams rich card format
- Supports structured data (tables, columns)
- Interactive buttons for actions
- Mobile-responsive design
- JSON-based, easy to generate

**Consequences**:
- ✅ Professional, polished UI
- ✅ Structured, scannable results
- ✅ Interactive buttons (future: release email, block sender)
- ✅ Works on desktop + mobile
- ⚠️ Limited to Adaptive Card capabilities

**Alternatives Considered**:
- Plain text (rejected: poor readability for multi-result queries)
- HTML (rejected: not supported in Teams messages)
- Thumbnail cards (rejected: less structured data support)

---

## Decision: Atomic Functions (<25 Lines)

**Date**: 2025-10-16
**Status**: Accepted
**Context**: Need maintainable, testable, predictable code.

**Decision**: Enforce max 25 lines per function, max 150 lines per file.

**Rationale**:
- Easier to test (one function = one test)
- Easier to understand (single responsibility)
- Easier to debug (small surface area)
- Prevents feature creep and over-engineering
- Forces thoughtful decomposition

**Consequences**:
- ✅ Highly testable codebase
- ✅ Easy code reviews
- ✅ Low cognitive load
- ⚠️ More files (but better organized)
- ⚠️ Requires discipline to maintain

---

## Decision: No Incident Management (Focused Scope)

**Date**: 2025-10-16
**Status**: Accepted
**Context**: Original security-alert-agent had incident tracking, Jira integration, etc.

**Decision**: Remove all incident management features from email-agent.

**Rationale**:
- email-agent purpose: audit queries, not threat response
- Users just want to know "did we block this email?"
- Incident workflows belong in separate phishing-agent project
- Keep this project focused and simple

**Consequences**:
- ✅ Simpler codebase (no Jira, no incident DB)
- ✅ Faster queries (no complex workflows)
- ✅ Clearer separation of concerns
- ⚠️ No incident tracking (intentional)
- ⚠️ Users must use phishing-agent for that

---

## Decision: Anthropic SDK with Tool Calling (Required, Not Optional)

**Date**: 2025-10-16
**Status**: Accepted
**Context**: Need to parse natural language queries from Teams users to search Mimecast for blocked/held/rejected emails.

**Decision**: Use Anthropic SDK with tool calling as the primary (required) query parsing strategy, not as an optional fallback to regex.

**Rationale**:
- Natural language queries are inherently ambiguous → LLM handles edge cases better than regex
- Tool calling provides structured output → no manual parameter extraction needed
- Single-turn interaction → no need for complex orchestration framework
- Direct SDK control → easier debugging and prompt tuning
- Acceptable latency (1-2s) for conversational interface
- Cost is reasonable (~$0.01-0.02 per query)

**Consequences**:
- ✅ Handles complex/ambiguous queries naturally
- ✅ Easy to extend (just update tool schema)
- ✅ Structured output via tool calling
- ✅ No manual regex pattern maintenance
- ⚠️ Adds 1-2s latency (acceptable for Teams UX)
- ⚠️ Cost per query (~$0.01-0.02)
- ⚠️ Requires Anthropic API key

**Alternatives Considered**:
- Regex-based parsing (rejected: brittle, hard to maintain, poor UX for edge cases)
- Hybrid regex + LLM fallback (rejected: unnecessary complexity, LLM works well enough)
- OpenAI GPT-4 (rejected: prefer Anthropic Claude for tool calling quality)
- LangChain (rejected: overkill for single-turn tool calling)
- Custom NER/intent classification (rejected: reinventing the wheel, LLM is better)

---

## Template for New Decisions

```markdown
## Decision: [Title]

**Date**: YYYY-MM-DD
**Status**: [Proposed | Accepted | Deprecated | Superseded]
**Context**: Brief description of the problem.

**Decision**: What was decided.

**Rationale**:
- Reason 1
- Reason 2
- Reason 3

**Consequences**:
- ✅ Positive outcome 1
- ✅ Positive outcome 2
- ⚠️ Trade-off 1
- ❌ Negative consequence (if any)

**Alternatives Considered**:
- Option A (rejected: reason)
- Option B (rejected: reason)
```

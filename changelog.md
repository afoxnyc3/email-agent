# Changelog

All notable changes to the email-agent project will be documented in this file.

## [0.2.0] - 2025-10-16

### Added
- Teams bot infrastructure (CloudAdapter, message routing, adaptive cards)
- Natural language query parser with Anthropic Claude SDK (tool calling)
- Mimecast client with HMAC authentication
- Email auditor orchestration service
- Adaptive Cards for search results and errors
- HTTP server with Teams endpoint (`/api/messages`) and health checks
- Production-ready logging and error handling
- Configuration management with environment variables
- Graceful shutdown handling
- GitHub repository and issues created

### Changed
- Architectural decision: Anthropic SDK with tool calling required (not optional)
- Query parsing via LLM tool calling (not regex)

## [0.1.0] - 2025-10-16

### Added
- Project initialization
- Documentation templates (README, ARCHITECTURE, roadmap, decision-log)
- TypeScript configuration with strict mode
- Development environment setup

---

**Format**: This changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

**Versioning**: This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

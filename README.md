# MCP Bridge Chrome Extension — Project Scaffold
# Track 1: Agent-Built Product
# A Chrome extension that bridges non-developers to MCP servers

## Tech Stack
- **Frontend**: Chrome Extension (Manifest V3) — popup UI
- **Backend**: Cloudflare Worker — REST API
- **Database**: Supabase (Project 2: yndlhhkhylwihsggdyru) — MCP registry + auth
- **Payments**: Stripe — $9/mo Pro, $29/mo Unlimited

## Architecture
```
Browser Extension (Popup)
  ├─ Login (Supabase Auth)
  ├─ Browse MCPs (catalog)
  ├─ Install MCP (one-click)
  └─ Manage installed MCPs
        │
        ▼
Cloudflare Worker (API)
  ├─ GET /api/mcps — list available MCPs
  ├─ POST /api/install — install MCP for user
  ├─ GET /api/installed — user's installed MCPs
  └─ Stripe webhook — handle payments
        │
        ▼
Supabase
  ├─ mcp_registry table — MCP catalog
  ├─ user_installations — user ↔ MCP mapping
  └─ user_subscriptions — Stripe subscription status
```

## Key Features
1. Browse catalog of 24+ MCP servers
2. One-click install (copies MCP config to clipboard, or auto-configures)
3. Pro users get unlimited installs, free gets 3
4. Search, filter by category, see ratings/usage

## Revenue Model
- Free: 3 MCP installs, basic search
- Pro ($9/mo): Unlimited installs, priority support
- Unlimited ($29/mo): Team sharing, custom MCPs

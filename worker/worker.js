// MCP Bridge — Cloudflare Worker API
// ==================================

// CORS headers
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

// Supabase
const SB_URL = 'https://yndlhhkhylwihsggdyru.supabase.co';
const SB_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluZGxoaGtoeWx3aWhzZ2dkeXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY0MDkzMDAsImV4cCI6MjAzMTk4NTMwMH0.LwLDsLWjdsLWjdsLWjdsLWjdsLWjdsLWjdsLWjds';

// MCP Catalog (built-in)
const MCP_CATALOG = [
  { id: 'supabase', name: 'Supabase MCP', author: 'supabase', category: 'database', description: 'Connect to Supabase projects - manage tables, run queries, deploy edge functions', installs: 1240, rating: 4.8 },
  { id: 'stripe', name: 'Stripe MCP', author: 'stripe', category: 'payments', description: 'Manage Stripe payments, customers, subscriptions, and invoices', installs: 980, rating: 4.7 },
  { id: 'cloudflare', name: 'Cloudflare MCP', author: 'cloudflare', category: 'infrastructure', description: 'Deploy Workers, manage R2, D1, KV, and DNS via AI assistants', installs: 845, rating: 4.6 },
  { id: 'github', name: 'GitHub MCP', author: 'github', category: 'devtools', description: 'Manage repos, issues, PRs, and search code from your AI assistant', installs: 1560, rating: 4.9 },
  { id: 'filesystem', name: 'Filesystem MCP', author: 'anthropic', category: 'tools', description: 'Read, write, and manage files on your local filesystem through AI', installs: 2100, rating: 4.5 },
  { id: 'brave-search', name: 'Brave Search MCP', author: 'brave', category: 'search', description: 'Web and local search via Brave Search API', installs: 720, rating: 4.4 },
  { id: 'puppeteer', name: 'Puppeteer MCP', author: 'anthropic', category: 'browser', description: 'Browser automation - navigate, click, fill forms, take screenshots', installs: 890, rating: 4.6 },
  { id: 'memory', name: 'Memory MCP', author: 'anthropic', category: 'tools', description: 'Persistent memory with knowledge graph for AI assistants', installs: 650, rating: 4.3 },
  { id: 'slack', name: 'Slack MCP', author: 'slack', category: 'communication', description: 'Send messages, manage channels, search Slack from AI assistants', installs: 430, rating: 4.2 },
  { id: 'notion', name: 'Notion MCP', author: 'notion', category: 'productivity', description: 'Create pages, query databases, manage Notion workspace via AI', installs: 560, rating: 4.5 },
  { id: 'airtable', name: 'Airtable MCP', author: 'airtable', category: 'database', description: 'CRUD operations on Airtable bases - tables, records, views', installs: 340, rating: 4.3 },
  { id: 'figma', name: 'Figma MCP', author: 'figma', category: 'design', description: 'Access Figma files, components, styles, and design tokens', installs: 280, rating: 4.1 },
  { id: 'linear', name: 'Linear MCP', author: 'linear', category: 'project-management', description: 'Manage issues, projects, and cycles in Linear', installs: 390, rating: 4.4 },
  { id: 'todoist', name: 'Todoist MCP', author: 'todoist', category: 'productivity', description: 'Create and manage tasks, projects, and labels in Todoist', installs: 310, rating: 4.0 },
  { id: 'exa', name: 'Exa Search MCP', author: 'exa', category: 'search', description: 'AI-powered semantic search and content retrieval', installs: 450, rating: 4.5 },
  { id: 'tavily', name: 'Tavily Search MCP', author: 'tavily', category: 'search', description: 'Real-time web search with AI-optimized results', installs: 390, rating: 4.3 },
  { id: 'resend', name: 'Resend MCP', author: 'resend', category: 'communication', description: 'Send transactional emails via Resend API', installs: 220, rating: 4.2 },
  { id: 'sentry', name: 'Sentry MCP', author: 'sentry', category: 'devtools', description: 'Monitor errors, performance, and releases in Sentry', installs: 190, rating: 4.1 },
  { id: 'vercel', name: 'Vercel MCP', author: 'vercel', category: 'infrastructure', description: 'Deploy projects, manage domains, check build status on Vercel', installs: 340, rating: 4.3 },
  { id: 'railway', name: 'Railway MCP', author: 'railway', category: 'infrastructure', description: 'Deploy apps, manage services, and check deployment status on Railway', installs: 180, rating: 4.2 },
  { id: 'obsidian', name: 'Obsidian MCP', author: 'obsidian', category: 'productivity', description: 'Read, write, and search your Obsidian vault through AI', installs: 260, rating: 4.4 },
  { id: 'youtube', name: 'YouTube MCP', author: 'google', category: 'media', description: 'Search videos, get transcripts, manage playlists on YouTube', installs: 410, rating: 4.0 },
  { id: 'spotify', name: 'Spotify MCP', author: 'spotify', category: 'media', description: 'Control playback, search tracks, manage playlists on Spotify', installs: 290, rating: 3.9 },
  { id: 'discord', name: 'Discord MCP', author: 'discord', category: 'communication', description: 'Send messages, manage channels, moderate servers on Discord', installs: 350, rating: 4.1 },
];

// Helper: verify JWT and get user
async function getUser(req) {
  const auth = req.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  
  try {
    const resp = await fetch(`${SB_URL}/auth/v1/user`, {
      headers: { 'Authorization': `Bearer ${token}`, 'apikey': SB_ANON_KEY }
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

// Helper: get user tier from Supabase
async function getUserTier(userId) {
  try {
    const sbSecret = SB_URL; // In production, use service_role key
    // For MVP: tier is 'free' by default
    return 'free';
  } catch {
    return 'free';
  }
}

// Helper: get user installations
async function getUserInstallations(userId) {
  try {
    const resp = await fetch(`${SB_URL}/rest/v1/user_installations?user_id=eq.${userId}`, {
      headers: { 'apikey': SB_ANON_KEY, 'Authorization': `Bearer ${SB_ANON_KEY}` }
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    return data.map(d => d.mcp_id);
  } catch {
    return [];
  }
}

// Handle request
async function handleRequest(req) {
  const url = new URL(req.url);
  const path = url.pathname;
  
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }
  
  const user = await getUser(req);
  
  // Health check
  if (path === '/health') {
    return json({ status: 'ok', version: '1.0.0' });
  }
  
  // GET /api/mcps — list MCP catalog
  if (path === '/api/mcps' && req.method === 'GET') {
    const search = url.searchParams.get('search') || '';
    const category = url.searchParams.get('category') || '';
    
    let mcps = MCP_CATALOG;
    if (search) {
      const q = search.toLowerCase();
      mcps = mcps.filter(m => m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q) || m.category.toLowerCase().includes(q));
    }
    if (category) {
      mcps = mcps.filter(m => m.category === category);
    }
    
    return json({ mcps, total: mcps.length });
  }
  
  // GET /api/installed — user's installed MCPs
  if (path === '/api/installed' && req.method === 'GET') {
    if (!user) return json({ error: 'Unauthorized' }, 401);
    
    const installed = await getUserInstallations(user.id);
    const tier = await getUserTier(user.id);
    
    return json({ installed, tier });
  }
  
  // POST /api/install — install MCP for user
  if (path === '/api/install' && req.method === 'POST') {
    if (!user) return json({ error: 'Unauthorized' }, 401);
    
    const body = await req.json();
    const mcpId = body.mcp_id;
    
    if (!mcpId) return json({ error: 'mcp_id required' }, 400);
    
    // Check MCP exists in catalog
    const mcp = MCP_CATALOG.find(m => m.id === mcpId);
    if (!mcp) return json({ error: 'MCP not found' }, 404);
    
    // Record installation in Supabase
    try {
      await fetch(`${SB_URL}/rest/v1/user_installations`, {
        method: 'POST',
        headers: {
          'apikey': SB_ANON_KEY,
          'Authorization': `Bearer ${SB_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          user_id: user.id,
          mcp_id: mcpId,
          installed_at: new Date().toISOString()
        })
      });
    } catch (e) {
      console.error('Failed to record installation:', e);
    }
    
    return json({ success: true, mcp_id: mcpId });
  }
  
  // GET /auth/login — redirect to Supabase OAuth
  if (path === '/auth/login') {
    const redirectUrl = `${SB_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent('https://mcp-bridge-api.vishar.workers.dev/auth/callback')}`;
    return Response.redirect(redirectUrl, 302);
  }
  
  // GET /auth/callback — OAuth callback
  if (path === '/auth/callback') {
    return new Response(`
      <html><head><title>MCP Bridge</title></head><body style="background:#0a0a1a;color:#e0e0f0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;">
        <h1>🌉 MCP Bridge</h1>
        <p>Authentication successful! You can close this window.</p>
        <script>
          const hash = window.location.hash;
          if (hash) {
            const params = new URLSearchParams(hash.slice(1));
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');
            if (access_token) {
              // Send to extension via postMessage
              window.opener?.postMessage({ type: 'AUTH_CALLBACK', session: { access_token, refresh_token }, tier: 'free' }, '*');
            }
          }
        </script>
      </body></html>
    `, { headers: { 'Content-Type': 'text/html' } });
  }
  
  // Stripe webhook
  if (path === '/api/webhooks/stripe' && req.method === 'POST') {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');
    
    // In production: verify signature with stripe.webhooks.constructEvent()
    let event;
    try {
      event = JSON.parse(body);
    } catch {
      return json({ error: 'Invalid payload' }, 400);
    }
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata?.user_id;
      const tier = session.metadata?.tier || 'pro';
      
      if (userId) {
        // Update subscription in Supabase
        try {
          await fetch(`${SB_URL}/rest/v1/user_subscriptions`, {
            method: 'POST',
            headers: {
              'apikey': SB_ANON_KEY,
              'Authorization': `Bearer ${SB_ANON_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              user_id: userId,
              tier,
              stripe_session_id: session.id,
              status: 'active',
              created_at: new Date().toISOString()
            })
          });
        } catch (e) {
          console.error('Failed to update subscription:', e);
        }
      }
    }
    
    return json({ received: true });
  }
  
  // 404
  return json({ error: 'Not found' }, 404);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS
  });
}

export default {
  async fetch(req, env, ctx) {
    return handleRequest(req);
  }
};

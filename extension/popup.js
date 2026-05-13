// MCP Bridge — Popup Logic
// ==========================

const API_BASE = 'https://mcp-bridge-api.apaybeta.workers.dev';
const FREE_LIMIT = 3;

// MCP Catalog (fallback built-in catalog)
const BUILTIN_MCPS = [
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

let mcps = [...BUILTIN_MCPS];
let installedIds = [];
let userTier = 'free';
let activeFilter = 'all';
let session = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadState();
  await fetchMCPs();
  renderFilters();
  renderMCPs();
  renderAuth();
});

async function loadState() {
  const stored = await chrome.storage.local.get(['installedIds', 'userTier', 'session']);
  installedIds = stored.installedIds || [];
  userTier = stored.userTier || 'free';
  session = stored.session || null;
}

async function saveState() {
  await chrome.storage.local.set({ installedIds, userTier, session });
}

// Auth
function renderAuth() {
  const userDisplay = document.getElementById('userDisplay');
  const authBtn = document.getElementById('authBtn');
  const tierBadge = document.getElementById('tierBadge');
  
  if (session) {
    userDisplay.textContent = session.user?.email || 'Signed in';
    authBtn.textContent = 'Sign Out';
    authBtn.onclick = handleSignOut;
  } else {
    userDisplay.textContent = 'Not signed in';
    authBtn.textContent = 'Sign In';
    authBtn.onclick = handleAuth;
  }
  
  // Tier badge
  if (userTier === 'pro') {
    tierBadge.innerHTML = '<span class="tier-badge tier-pro">PRO</span>';
  } else if (userTier === 'unlimited') {
    tierBadge.innerHTML = '<span class="tier-badge tier-unlimited">UNLIMITED</span>';
  } else {
    tierBadge.innerHTML = '<span class="tier-badge tier-free">FREE</span>';
  }
}

function handleAuth() {
  // Open Supabase auth in a new tab
  chrome.tabs.create({ url: API_BASE + '/auth/login' });
}

function handleSignOut() {
  session = null;
  userTier = 'free';
  installedIds = [];
  saveState();
  renderAuth();
  renderMCPs();
}

// Fetch MCPs from API (falls back to built-in)
async function fetchMCPs() {
  try {
    const resp = await fetch(API_BASE + '/api/mcps', {
      headers: session ? { 'Authorization': 'Bearer ' + session.access_token } : {}
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data.mcps && data.mcps.length > 0) {
        mcps = data.mcps;
      }
    }
  } catch (e) {
    console.log('Using built-in MCP catalog (API unreachable)');
  }
  
  // Also fetch installed if authed
  if (session) {
    try {
      const resp = await fetch(API_BASE + '/api/installed', {
        headers: { 'Authorization': 'Bearer ' + session.access_token }
      });
      if (resp.ok) {
        const data = await resp.json();
        installedIds = data.installed || [];
        userTier = data.tier || 'free';
        saveState();
      }
    } catch (e) {}
  }
}

// Render filters
function renderFilters() {
  const filterBar = document.getElementById('filterBar');
  const categories = [...new Set(mcps.map(m => m.category))];
  let html = '<span class="filter-chip active" data-cat="all" onclick="setFilter(\'all\', this)">All</span>';
  categories.forEach(cat => {
    html += `<span class="filter-chip" data-cat="${cat}" onclick="setFilter('${cat}', this)">${cat}</span>`;
  });
  filterBar.innerHTML = html;
}

function setFilter(cat, el) {
  activeFilter = cat;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderMCPs();
}

// Render MCP list
function renderMCPs() {
  const list = document.getElementById('mcpList');
  const search = document.getElementById('searchInput').value.toLowerCase();
  
  let filtered = mcps;
  if (search) {
    filtered = filtered.filter(m => 
      m.name.toLowerCase().includes(search) || 
      m.description.toLowerCase().includes(search) ||
      m.author.toLowerCase().includes(search) ||
      m.category.toLowerCase().includes(search)
    );
  }
  if (activeFilter !== 'all') {
    filtered = filtered.filter(m => m.category === activeFilter);
  }
  
  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty">No MCPs found matching your search.</div>';
  } else {
    list.innerHTML = filtered.map(mcp => renderMCPCard(mcp)).join('');
  }
  
  document.getElementById('mcpCount').textContent = `${filtered.length} MCPs available`;
  document.getElementById('installedCount').textContent = `${installedIds.length} installed`;
  
  // Show upgrade banner if free and at limit
  const banner = document.getElementById('upgradeBanner');
  if (userTier === 'free' && installedIds.length >= FREE_LIMIT) {
    banner.style.display = 'block';
  } else {
    banner.style.display = 'none';
  }
}

function renderMCPCard(mcp) {
  const isInstalled = installedIds.includes(mcp.id);
  const atLimit = userTier === 'free' && installedIds.length >= FREE_LIMIT && !isInstalled;
  
  let btnClass = '';
  let btnText = 'Install';
  let btnAction = `installMCP('${mcp.id}')`;
  
  if (isInstalled) {
    btnClass = 'installed';
    btnText = '✓ Installed';
    btnAction = '';
  } else if (atLimit) {
    btnClass = 'locked';
    btnText = '🔒 Upgrade';
  }
  
  return `
    <div class="mcp-card">
      <div class="mcp-header">
        <div>
          <div class="mcp-name">${mcp.name}</div>
          <div class="mcp-author">by ${mcp.author}</div>
        </div>
        <div>
          <button class="install-btn ${btnClass}" onclick="${btnAction}">${btnText}</button>
          ${isInstalled ? `<button class="copy-btn" onclick="copyConfig('${mcp.id}')">📋 Copy config</button>` : ''}
        </div>
      </div>
      <div class="mcp-desc">${mcp.description}</div>
      <div class="mcp-meta">
        <span>⭐ ${mcp.rating}</span>
        <span>📥 ${mcp.installs.toLocaleString()}</span>
        <span>📁 ${mcp.category}</span>
      </div>
    </div>
  `;
}

// Install MCP
async function installMCP(mcpId) {
  const atLimit = userTier === 'free' && installedIds.length >= FREE_LIMIT && !installedIds.includes(mcpId);
  
  if (atLimit) {
    showToast('🔒 Free limit reached. Upgrade to Pro!');
    chrome.tabs.create({ url: 'https://buy.stripe.com/PLACEHOLDER_PRO' });
    return;
  }
  
  if (installedIds.includes(mcpId)) {
    showToast('Already installed!');
    return;
  }
  
  // Add to installed
  installedIds.push(mcpId);
  await saveState();
  
  // Notify API if authed
  if (session) {
    try {
      await fetch(API_BASE + '/api/install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + session.access_token
        },
        body: JSON.stringify({ mcp_id: mcpId })
      });
    } catch (e) {}
  }
  
  // Copy config to clipboard
  const mcp = mcps.find(m => m.id === mcpId);
  await copyConfig(mcpId);
  showToast(`✅ ${mcp?.name || mcpId} installed! Config copied.`);
  renderMCPs();
  renderAuth();
}

// Copy MCP config JSON to clipboard
async function copyConfig(mcpId) {
  const mcp = mcps.find(m => m.id === mcpId);
  if (!mcp) return;
  
  const config = {
    mcpServers: {
      [mcp.id]: {
        command: "npx",
        args: ["-y", `@anthropic/mcp-server-${mcp.id}`],
        env: {}
      }
    }
  };
  
  try {
    await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
  } catch (e) {
    // Fallback: use background script
    chrome.runtime.sendMessage({ action: 'copyToClipboard', text: JSON.stringify(config, null, 2) });
  }
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.display = 'block';
  toast.style.animation = 'none';
  toast.offsetHeight; // reflow
  toast.style.animation = 'fadeInOut 2.5s ease';
  setTimeout(() => { toast.style.display = 'none'; }, 2500);
}

// Listen for auth callback messages
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'AUTH_CALLBACK') {
    session = event.data.session;
    userTier = event.data.tier || 'free';
    saveState();
    fetchMCPs().then(() => {
      renderAuth();
      renderMCPs();
    });
  }
});

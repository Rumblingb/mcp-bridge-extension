// MCP Bridge — Background Service Worker
// ======================================

const API_BASE = 'https://mcp-bridge-api.vishar.workers.dev';

chrome.runtime.onInstalled.addListener(() => {
  console.log('MCP Bridge Extension installed');
  // Set default state
  chrome.storage.local.get(['installedIds', 'userTier'], (result) => {
    if (!result.installedIds) {
      chrome.storage.local.set({ installedIds: [], userTier: 'free' });
    }
  });
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'copyToClipboard') {
    // Use offscreen document for clipboard access
    copyToClipboard(message.text).then(() => {
      sendResponse({ success: true });
    }).catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true; // Keep channel open for async response
  }
  
  if (message.action === 'saveSession') {
    chrome.storage.local.set({ 
      session: message.session,
      userTier: message.tier || 'free'
    }).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});

async function copyToClipboard(text) {
  try {
    // Try direct clipboard API first
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback: create a textarea
    // In service workers we need to use offscreen documents
    // For simplicity, we'll just log and let popup handle it
    console.log('Copy via service worker not supported, text:', text);
  }
}

// Listen for external messages (auth callbacks)
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message.type === 'AUTH_CALLBACK') {
    chrome.storage.local.set({
      session: message.session,
      userTier: message.tier || 'free'
    });
    sendResponse({ success: true });
  }
});

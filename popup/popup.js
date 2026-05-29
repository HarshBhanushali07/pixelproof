document.addEventListener('DOMContentLoaded', async () => {
  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    const url = new URL(tab.url);
    document.getElementById('siteDomain').innerText = url.hostname;

    // Ask background to get stats from content script
    chrome.runtime.sendMessage({ action: 'getPageStats', tabId: tab.id }, (response) => {
      if (chrome.runtime.lastError || !response) {
        // Content script might not be injected yet
        return;
      }
      updateStats(response);
    });
  }

  // Handle Scan All
  document.getElementById('btnScanAll').addEventListener('click', () => {
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { action: 'scanAllImages' });
    }
  });

  // Handle Auto-Scan toggle
  const toggle = document.getElementById('autoScanToggle');
  chrome.storage.local.get(['autoScanEnabled'], (res) => {
    toggle.checked = !!res.autoScanEnabled;
  });
  toggle.addEventListener('change', (e) => {
    chrome.storage.local.set({ autoScanEnabled: e.target.checked });
  });

  // Mock API usage
  chrome.storage.local.get(null, (items) => {
    const count = Object.keys(items).filter(k => k.startsWith('http')).length;
    document.getElementById('apiUsage').innerText = `API: ${count}/50`;
  });
});

function updateStats(stats) {
  // stats = { found: 0, scanned: 0, flagged: 0, flaggedItems: [] }
  document.getElementById('imgFound').innerText = stats.found || 0;
  document.getElementById('imgScanned').innerText = stats.scanned || 0;
  document.getElementById('imgFlagged').innerText = stats.flagged || 0;

  // Calculate Trust Score (0-100)
  let score = 100;
  if (stats.scanned > 0) {
    const fakeRatio = stats.flagged / stats.scanned;
    score = Math.max(0, Math.round(100 - (fakeRatio * 100)));
  }
  
  const scoreEl = document.getElementById('trustScore');
  scoreEl.innerText = score;

  const gauge = document.getElementById('trustGauge');
  // stroke-dasharray for gauge (approx 125 total length for 40 radius semicircle)
  const length = 125;
  const dashOffset = length - (score / 100) * length;
  gauge.style.strokeDasharray = `${length}`;
  gauge.style.strokeDashoffset = dashOffset;

  if (score <= 30) gauge.style.stroke = 'var(--ai-red)';
  else if (score <= 60) gauge.style.stroke = 'var(--uncertain-yellow)';
  else gauge.style.stroke = 'var(--real-green)';

  const list = document.getElementById('flaggedList');
  if (stats.flaggedItems && stats.flaggedItems.length > 0) {
    list.innerHTML = stats.flaggedItems.map(item => `
      <div class="flagged-item">
        <img src="${item.url}" width="40" height="40" style="object-fit: cover; border-radius: 4px;">
        <div class="flagged-details">
          <div class="badge ${item.verdict}">${item.confidence}% ${item.verdict === 'fake' ? 'AI' : 'Suspicious'}</div>
        </div>
      </div>
    `).join('');
  } else {
    list.innerHTML = '<p style="color:var(--text-secondary); text-align:center;">No flagged images yet.</p>';
  }
}

import { getAllImages, injectOverlay, removeOverlay, watchForNewImages, getImageAsBase64, isImageVisible } from './utils/dom.js';

let panelIframe = null;

// Initialize
function init() {
  const images = getAllImages();
  images.forEach(img => setupImage(img));

  watchForNewImages((img) => {
    setupImage(img);
  });

  // Special handling for WhatsApp Web
  if (window.location.hostname.includes('web.whatsapp.com')) {
    initWhatsApp();
  }
}

function setupImage(imgElement) {
  const overlayData = injectOverlay(imgElement);
  if (!overlayData) return;

  overlayData.scanBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Show loading
    overlayData.scanBtn.innerHTML = '<div class="pixelproof-loading"></div>';
    
    const base64 = await getImageAsBase64(imgElement);
    const imageUrl = imgElement.src;

    chrome.runtime.sendMessage({
      action: 'scanImage',
      imageUrl: imageUrl,
      imageBase64: base64,
      pageUrl: window.location.href
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        renderBadge(imgElement, { verdict: 'error', confidence: 0 });
        return;
      }
      renderBadge(imgElement, response);
    });
  });
}

function renderBadge(imgElement, result) {
  removeOverlay(imgElement);
  
  if (imgElement.parentNode) {
    const parentStyle = window.getComputedStyle(imgElement.parentNode);
    if (parentStyle.position === 'static') {
      imgElement.parentNode.style.position = 'relative';
    }

    const badge = document.createElement('div');
    badge.className = `pixelproof-badge ${result.verdict}`;
    
    let text = `${result.confidence}% AI Generated`;
    if (result.verdict === 'real') text = `${result.confidence}% Likely Real`;
    if (result.verdict === 'uncertain') text = `${result.confidence}% Suspicious`;
    if (result.verdict === 'error') text = `? Error`;

    badge.innerHTML = `<span>🛡</span> ${text}`;
    
    // Store data for panel
    badge.dataset.result = JSON.stringify(result);

    badge.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openPanel(result);
    });

    imgElement.parentNode.appendChild(badge);
  }
}

function openPanel(result) {
  if (panelIframe) {
    panelIframe.remove();
  }
  
  panelIframe = document.createElement('iframe');
  panelIframe.src = chrome.runtime.getURL('panel/panel.html');
  panelIframe.className = 'pixelproof-panel-iframe';
  
  // Append to body
  document.body.appendChild(panelIframe);

  // Wait for iframe to load before sending data
  panelIframe.onload = () => {
    panelIframe.contentWindow.postMessage({
      type: 'PIXELPROOF_RESULT',
      data: result
    }, '*');
  };
}

// Listen for messages from Panel or Popup
window.addEventListener('message', (event) => {
  if (event.data.type === 'PIXELPROOF_CLOSE_PANEL') {
    if (panelIframe) {
      panelIframe.remove();
      panelIframe = null;
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scanAllImages') {
    const images = getAllImages();
    images.forEach(img => {
      // Simulate click on all scan buttons
      const overlay = img.parentNode.querySelector('.pixelproof-overlay');
      if (overlay) {
        const btn = overlay.querySelector('.pixelproof-scan-btn');
        if (btn) btn.click();
      }
    });
    sendResponse({ status: 'started' });
  }
});

// WhatsApp Web special handling
function initWhatsApp() {
  const observer = new MutationObserver((mutations) => {
    const chatContainer = document.getElementById('main');
    if (chatContainer) {
      const mediaContainers = chatContainer.querySelectorAll('div[data-testid="media-url-provider"] img, img[src*="blob:"]');
      mediaContainers.forEach(img => {
        if (!img.dataset.pixelproofWaInjected) {
          img.dataset.pixelproofWaInjected = 'true';
          injectWaInlineChip(img);
        }
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function injectWaInlineChip(imgElement) {
  const container = imgElement.parentNode;
  if (!container) return;
  container.style.position = 'relative';

  const chip = document.createElement('button');
  chip.className = 'pixelproof-wa-chip';
  chip.innerText = '🔍 Scan AI';
  
  chip.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    chip.innerText = '⏳';
    const base64 = await getImageAsBase64(imgElement);
    chrome.runtime.sendMessage({ action: 'scanImage', imageUrl: imgElement.src, imageBase64: base64 }, (res) => {
      let icon = '🟡 ?';
      if (res.verdict === 'fake') icon = '🔴 AI';
      if (res.verdict === 'real') icon = '🟢 Real';
      chip.innerText = icon;
      chip.style.pointerEvents = 'none';
    });
  });

  container.appendChild(chip);
}

// Start
init();

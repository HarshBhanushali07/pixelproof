let panelIframe = null;

function getAllImages() {
  const images = Array.from(document.querySelectorAll('img'));
  return images.filter((img) => img.naturalWidth > 100 && img.naturalHeight > 100);
}

function injectOverlay(imgElement) {
  if (imgElement.dataset.pixelproofInjected) return;
  if (!imgElement.parentNode) return;

  const parentStyle = window.getComputedStyle(imgElement.parentNode);
  if (parentStyle.position === 'static') {
    imgElement.parentNode.style.position = 'relative';
  }

  const overlay = document.createElement('div');
  overlay.className = 'pixelproof-overlay';

  const scanBtn = document.createElement('button');
  scanBtn.className = 'pixelproof-scan-btn';
  scanBtn.title = 'Scan with PixelProof';
  scanBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>';

  overlay.appendChild(scanBtn);
  imgElement.parentNode.appendChild(overlay);

  imgElement.dataset.pixelproofInjected = 'true';
  imgElement.dataset.pixelproofOverlayId = overlay.id;

  return { overlay, scanBtn };
}

function removeOverlay(imgElement) {
  if (imgElement.parentNode) {
    const overlay = imgElement.parentNode.querySelector('.pixelproof-overlay');
    if (overlay) {
      overlay.remove();
    }
  }
  delete imgElement.dataset.pixelproofInjected;
}

function watchForNewImages(callback) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeName === 'IMG') {
          node.onload = () => {
            if (node.naturalWidth > 100) callback(node);
          };
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const imgs = node.querySelectorAll('img');
          imgs.forEach((img) => {
            if (img.complete) {
              if (img.naturalWidth > 100) callback(img);
            } else {
              img.onload = () => {
                if (img.naturalWidth > 100) callback(img);
              };
            }
          });
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

async function getImageAsBase64(imgElement) {
  return new Promise((resolve) => {
    try {
      if (imgElement.src.startsWith('data:image')) {
        return resolve(imgElement.src);
      }

      const canvas = document.createElement('canvas');
      canvas.width = imgElement.naturalWidth || imgElement.width;
      canvas.height = imgElement.naturalHeight || imgElement.height;
      const ctx = canvas.getContext('2d');

      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => {
        resolve(null);
      };
      img.src = imgElement.src;
    } catch (error) {
      resolve(null);
    }
  });
}

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
    await doScanOnImage(imgElement, overlayData);
  });
}

async function doScanOnImage(imgElement, overlayData = null) {
  try {
    if (imgElement.dataset.pixelproofScanned) return;

    if (!overlayData) overlayData = injectOverlay(imgElement);
    if (overlayData && overlayData.scanBtn) {
      overlayData.scanBtn.innerHTML = '<div class="pixelproof-loading"></div>';
    }

    const base64 = await getImageAsBase64(imgElement);
    const imageUrl = imgElement.src;

    const response = await new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({
          action: 'scanImage',
          imageUrl: imageUrl,
          imageBase64: base64,
          pageUrl: window.location.href
        }, (res) => {
          if (chrome.runtime.lastError) {
            resolve(null);
          } else {
            resolve(res);
          }
        });
      } catch (err) {
        resolve(null);
      }
    });

    if (!response) {
      console.error('Scan failed:', chrome.runtime.lastError);
      renderBadge(imgElement, { verdict: 'error', confidence: 0, imageUrl });
      return null;
    }

    imgElement.dataset.pixelproofScanned = 'true';
    // Ensure imageUrl is present in result for flagged lists
    response.imageUrl = response.imageUrl || imageUrl;
    renderBadge(imgElement, response);
    return response;
  } catch (err) {
    console.error('doScanOnImage error', err);
    renderBadge(imgElement, { verdict: 'error', confidence: 0, imageUrl: imgElement.src });
  }
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
    // Throttle scans to avoid flooding background/service worker
    (async () => {
      for (const img of images) {
        await doScanOnImage(img);
        // small delay between scans
        await new Promise(r => setTimeout(r, 200));
      }
    })();
    sendResponse({ status: 'started' });
  }

  if (request.action === 'scanContextMenu' && request.srcUrl) {
    // Find image element by srcUrl and trigger scan
    const images = getAllImages();
    const target = images.find(i => i.src === request.srcUrl || i.currentSrc === request.srcUrl);
    if (target) {
      doScanOnImage(target);
      sendResponse({ status: 'started' });
    } else {
      // If not found, still respond so background knows command was received
      sendResponse({ status: 'not_found' });
    }
  }

  if (request.action === 'getStats') {
    const found = getAllImages().length;
    const badges = Array.from(document.querySelectorAll('.pixelproof-badge'));
    const flaggedItems = badges
      .map((badge) => {
        try {
          return JSON.parse(badge.dataset.result || 'null');
        } catch (error) {
          return null;
        }
      })
      .filter(Boolean)
      .filter((item) => item.verdict === 'fake' || item.verdict === 'uncertain');

    sendResponse({
      found,
      scanned: badges.length,
      flagged: flaggedItems.length,
      flaggedItems: flaggedItems.map((item) => ({
        url: item.imageUrl || item.pageUrl || '',
        verdict: item.verdict,
        confidence: item.confidence
      }))
    });
    return true;
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

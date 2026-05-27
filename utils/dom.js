/**
 * PixelProof DOM Utility Helpers
 */

/**
 * Returns all img elements with naturalWidth > 100px
 * @returns {Array<HTMLImageElement>}
 */
export function getAllImages() {
  const images = Array.from(document.querySelectorAll('img'));
  return images.filter(img => img.naturalWidth > 100 && img.naturalHeight > 100);
}

/**
 * Injects scan button overlay on image parent
 * @param {HTMLImageElement} imgElement 
 */
export function injectOverlay(imgElement) {
  if (imgElement.dataset.pixelproofInjected) return;
  if (!imgElement.parentNode) return;

  // Make sure parent can anchor absolute positioned children
  const parentStyle = window.getComputedStyle(imgElement.parentNode);
  if (parentStyle.position === 'static') {
    imgElement.parentNode.style.position = 'relative';
  }

  const overlay = document.createElement('div');
  overlay.className = 'pixelproof-overlay';
  
  const scanBtn = document.createElement('button');
  scanBtn.className = 'pixelproof-scan-btn';
  scanBtn.title = 'Scan with PixelProof';
  scanBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
  
  overlay.appendChild(scanBtn);
  imgElement.parentNode.appendChild(overlay);
  
  imgElement.dataset.pixelproofInjected = 'true';
  imgElement.dataset.pixelproofOverlayId = overlay.id; // Optional mapping

  return { overlay, scanBtn };
}

/**
 * Removes overlay from image parent
 * @param {HTMLImageElement} imgElement 
 */
export function removeOverlay(imgElement) {
  if (imgElement.parentNode) {
    const overlay = imgElement.parentNode.querySelector('.pixelproof-overlay');
    if (overlay) {
      overlay.remove();
    }
  }
  delete imgElement.dataset.pixelproofInjected;
}

/**
 * MutationObserver for dynamically loaded images
 * @param {Function} callback 
 */
export function watchForNewImages(callback) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeName === 'IMG') {
          node.onload = () => {
            if (node.naturalWidth > 100) callback(node);
          };
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const imgs = node.querySelectorAll('img');
          imgs.forEach(img => {
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

/**
 * Converts image to base64 string using a canvas
 * @param {HTMLImageElement} imgElement 
 * @returns {Promise<string>}
 */
export async function getImageAsBase64(imgElement) {
  return new Promise((resolve, reject) => {
    try {
      if (imgElement.src.startsWith('data:image')) {
        return resolve(imgElement.src);
      }
      const canvas = document.createElement('canvas');
      canvas.width = imgElement.naturalWidth || imgElement.width;
      canvas.height = imgElement.naturalHeight || imgElement.height;
      const ctx = canvas.getContext('2d');
      
      // Attempt to load cross-origin safely
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => {
        // Fallback for strict CORS: we might just send URL to API if base64 fails
        resolve(null); 
      };
      img.src = imgElement.src;
    } catch (e) {
      resolve(null);
    }
  });
}

/**
 * Checks if image is in viewport
 * @param {HTMLImageElement} imgElement 
 * @returns {boolean}
 */
export function isImageVisible(imgElement) {
  const rect = imgElement.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

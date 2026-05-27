/**
 * PixelProof Cache Utility Helpers
 */

/**
 * Returns cached result for an image URL
 * @param {string} imageUrl 
 * @returns {Promise<Object|null>}
 */
export async function getCache(imageUrl) {
  return new Promise((resolve) => {
    chrome.storage.local.get([imageUrl], (result) => {
      resolve(result[imageUrl] || null);
    });
  });
}

/**
 * Stores scan result in chrome.storage.local
 * @param {string} imageUrl 
 * @param {Object} result 
 * @returns {Promise<void>}
 */
export async function setCache(imageUrl, result) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [imageUrl]: result }, () => {
      resolve();
    });
  });
}

/**
 * Clears all PixelProof cache entries
 * @returns {Promise<void>}
 */
export async function clearCache() {
  return new Promise((resolve) => {
    chrome.storage.local.clear(() => {
      resolve();
    });
  });
}

/**
 * Returns count of cached items
 * @returns {Promise<number>}
 */
export async function getCacheStats() {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (items) => {
      resolve(Object.keys(items).length);
    });
  });
}

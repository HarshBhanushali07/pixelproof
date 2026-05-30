document.addEventListener('DOMContentLoaded', () => {
  const rd = document.getElementById('rdKey');
  const gm = document.getElementById('geminiKey');
  const fc = document.getElementById('factKey');
  const status = document.getElementById('status');

  function setStatus(msg) { status.innerText = 'Status: ' + msg; }

  // Load saved keys
  chrome.storage.local.get(['REALITY_DEFENDER_API_KEY','GEMINI_API_KEY','FACT_CHECK_API_KEY'], (items) => {
    if (items.REALITY_DEFENDER_API_KEY) rd.value = items.REALITY_DEFENDER_API_KEY;
    if (items.GEMINI_API_KEY) gm.value = items.GEMINI_API_KEY;
    if (items.FACT_CHECK_API_KEY) fc.value = items.FACT_CHECK_API_KEY;
    setStatus('Loaded');
  });

  document.getElementById('saveBtn').addEventListener('click', () => {
    const obj = {
      REALITY_DEFENDER_API_KEY: rd.value.trim(),
      GEMINI_API_KEY: gm.value.trim(),
      FACT_CHECK_API_KEY: fc.value.trim()
    };
    chrome.storage.local.set(obj, () => {
      setStatus('Saved locally');
    });
  });

  document.getElementById('clearBtn').addEventListener('click', () => {
    chrome.storage.local.remove(['REALITY_DEFENDER_API_KEY','GEMINI_API_KEY','FACT_CHECK_API_KEY'], () => {
      rd.value = gm.value = fc.value = '';
      setStatus('Cleared');
    });
  });
});

let currentResult = null;

window.addEventListener('message', (event) => {
  if (event.data.type === 'PIXELPROOF_RESULT') {
    currentResult = event.data.data;
    render(currentResult);
  }
});

document.getElementById('closeBtn').addEventListener('click', () => {
  window.parent.postMessage({ type: 'PIXELPROOF_CLOSE_PANEL' }, '*');
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.parent.postMessage({ type: 'PIXELPROOF_CLOSE_PANEL' }, '*');
  }
});

document.getElementById('btnReverse').addEventListener('click', () => {
  // In a real scenario we'd need the image URL which should be passed via result, 
  // but let's assume we search Google Images
  if (currentResult && currentResult.imageUrl) {
    window.open(`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(currentResult.imageUrl)}`, '_blank');
  } else {
    window.open(`https://images.google.com/`, '_blank');
  }
});

document.getElementById('btnReport').addEventListener('click', () => {
  alert('Report submitted. Thank you for helping improve PixelProof!');
  document.getElementById('btnReport').innerText = '✓ Reported';
});

document.getElementById('btnShareX').addEventListener('click', () => {
  if (!currentResult) return;
  const confidence = currentResult.confidence;
  const verdict = currentResult.verdict === 'fake' ? 'AI generated' : 'suspicious';
  const source = currentResult.aiSource !== 'Unknown' ? `(${currentResult.aiSource})` : '';
  const url = currentResult.pageUrl || window.location.href;
  const text = `PixelProof detected this image on ${url} is ${confidence}% ${verdict} ${source}. \n\n${currentResult.explanation}`;
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
});

document.getElementById('btnListen').addEventListener('click', () => {
  if (!currentResult || !currentResult.explanation) return;
  const utterance = new SpeechSynthesisUtterance(currentResult.explanation);
  window.speechSynthesis.speak(utterance);
});

function render(result) {
  const verdictText = document.getElementById('verdictText');
  const confidenceBar = document.getElementById('confidenceBar');
  const explanationText = document.getElementById('explanationText');
  const aiSourceChip = document.getElementById('aiSourceChip');
  const exifChip = document.getElementById('exifChip');
  const factsList = document.getElementById('factsList');

  // Verdict & Bar
  if (result.verdict === 'fake') {
    verdictText.innerText = 'AI Generated';
    verdictText.style.color = 'var(--ai-red)';
    confidenceBar.style.background = 'var(--ai-red)';
  } else if (result.verdict === 'real') {
    verdictText.innerText = 'Likely Real';
    verdictText.style.color = 'var(--real-green)';
    confidenceBar.style.background = 'var(--real-green)';
  } else {
    verdictText.innerText = 'Suspicious';
    verdictText.style.color = 'var(--uncertain-yellow)';
    confidenceBar.style.background = 'var(--uncertain-yellow)';
  }

  // Animate width
  setTimeout(() => {
    confidenceBar.style.width = `${result.confidence}%`;
  }, 100);

  // Gemini details & EXIF
  explanationText.innerText = result.explanation || 'No explanation available.';
  aiSourceChip.innerText = result.aiSource || 'Unknown';
  if (exifChip) {
    exifChip.innerText = result.exif || 'Metadata: Unknown';
  }

  // Facts
  if (result.facts && result.facts.length > 0) {
    factsList.innerHTML = result.facts.map(f => `
      <div class="fact-item">
        <strong>${f.rating}</strong>: <a href="${f.url}" target="_blank">${f.text}</a>
        <br><small>by ${f.claimant}</small>
      </div>
    `).join('');
  } else {
    factsList.innerHTML = 'No fact checks found.';
  }
}

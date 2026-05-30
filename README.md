# PixelProof — AI Deepfake Detector
> See through the fake.

## What it does
* Detects whether an image is AI-generated in real-time
* Explains WHY the image looks fake in plain English
* Guesses which AI tool likely created it (DALL-E, Midjourney, Sora)
* Provides reverse image search in one click
* Checks Google Fact Check API for known misinformation
* Works natively on WhatsApp Web chat bubbles

## Demo
*(Video link to be added here)*

## Installation — Developer Mode
1. Clone this repo: `git clone https://github.com/[username]/pixelproof.git`
2. Go to `chrome://extensions/` in your Chrome browser.
3. Enable "Developer Mode" (top right toggle).
4. Click "Load Unpacked" and select the `pixelproof-1` folder.
5. Create a `config.js` file from the template and add your API keys.

## Managing API keys (secure local workflow)
The extension reads API keys from a generated `config.js` file. Do NOT commit your real keys.

1. Copy `.env.example` to `.env` and fill in your keys:

	- `REALITY_DEFENDER_API_KEY`
	- `GEMINI_API_KEY`
	- `FACT_CHECK_API_KEY`

2. Generate `config.js`:

```bash
node scripts/generate_config.js
```

This will create a `config.js` file at the project root that exports `CONFIG` used by the extension. `config.js` and `.env` are ignored by Git.

3. Reload the extension in `chrome://extensions`.

For CI or automated builds, set environment variables and run the same `scripts/generate_config.js` step in your pipeline before packaging.

## API Keys Setup
1. Copy `config.example.js` and rename it to `config.js`.
2. Get a **Reality Defender API key** (free, 50/mo) from realitydefender.com.
3. Get a **Gemini 2.5 API key** (free) from aistudio.google.com.
4. Get a **Google Fact Check API key** from Google Cloud Console.
5. Paste them into `config.js`.

## How it works
1. **Content Script**: Scans the DOM for images and injects a scan button overlay.
2. **Service Worker**: Intercepts scan requests and checks local Chrome storage cache.
3. **Reality Defender API**: Analyzes the image buffer and returns a deepfake probability.
4. **Gemini 2.5 Flash**: Takes the probability + image URL and generates a plain English explanation of visual artifacts.
5. **Popup & Panel**: Displays the verdict cleanly without interrupting the browsing experience.

## Tech Stack
| Component | Technology |
|---|---|
| Extension Core | Chrome Manifest V3, Vanilla JS |
| UI/UX | HTML, Vanilla CSS (Glassmorphism) |
| Deepfake Detection | Reality Defender API |
| LLM Analysis | Gemini 2.5 Flash API |
| Verification | Google Fact Check API |

## Built for
Next Byte Hacks V2 — [Devpost Link]

## License
MIT

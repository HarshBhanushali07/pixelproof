# 🔍 PixelProof — See Through the Lie

<div align="center">

<img src="assets/dashboard-preview.svg" alt="PixelProof Dashboard" width="700"/>

### *A Chrome extension that detects AI-generated & manipulated images in real time — explains them in plain English — and cross-checks claims against live fact-check data.*

<br/>

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-7c3aed?style=for-the-badge)](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
[![Reality Defender](https://img.shields.io/badge/Reality_Defender-API-ef4444?style=for-the-badge)](https://www.realitydefender.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-1a73e8?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Google Fact Check](https://img.shields.io/badge/Google-Fact_Check-34a853?style=for-the-badge&logo=google&logoColor=white)](https://developers.google.com/fact-check)
[![Hackathon](https://img.shields.io/badge/Next_Byte_Hacks-V2-06b6d4?style=for-the-badge)](https://devpost.com/)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
[![Demo Safe](https://img.shields.io/badge/Demo-Safe_Fallback-22c55e?style=for-the-badge)](#fallback-mode)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-blueviolet?style=for-the-badge)]()

</div>

---

## 🌐 The Problem We're Solving

> **The internet is drowning in AI-generated images, deepfakes, and manipulated media — and most people have no way to tell.**

In 2024, AI-generated images spread as "real" news across every platform. Synthetic faces. Fabricated war footage. Deepfaked politicians. The average user has zero tools to fight back in the moment — while scrolling, reading, deciding what to believe.

**PixelProof lives right in your browser. It works on every page. It catches fakes as you scroll.**

---

## ✨ What PixelProof Does

| Feature | Description |
|---|---|
| 🖼️ **Live Image Scanning** | Detects AI-generated or manipulated images on any webpage |
| 🤖 **AI-Powered Explanation** | Gemini explains *why* an image looks suspicious, in plain English |
| 📰 **Fact-Check Lookup** | Cross-references image claims against Google Fact Check database |
| ⚡ **Smart Caching** | Results stored locally — rescans are instant |
| 🛡️ **Graceful Fallback** | Works even when APIs are down — demo never breaks |
| 🔑 **Local Key Storage** | API keys stay on your machine via `chrome.storage.local` |

---

## 🎬 Demo Flow

> *(Works even without live API keys — see Fallback Mode)*

1. **Open any page** with multiple images (news sites work great)
2. **Click the PixelProof extension icon** in Chrome toolbar
3. **Hit `Scan All Images`** — watch overlays appear on each image
4. **Click any flagged image** to see the full verdict + Gemini explanation + fact-check context
5. **Rescan an image** — result appears instantly from cache
6. **Open Settings** — show local API key storage
7. **Clear a key and scan again** — demonstrate graceful fallback mode

---

## 🏗️ Architecture Deep Dive

PixelProof is built on a **4-layer pipeline** inside Chrome's Manifest V3 architecture:

```
User Action → Content Script → Background Worker → External APIs
                                      ↕
                             Chrome Storage Cache
```

### Full System Architecture

```mermaid
flowchart LR
    U[👤 User] --> P[Popup UI]
    U --> C[Content Script]
    P --> C
    C --> B[Background Service Worker]
    B --> R[Reality Defender API]
    B --> G[Gemini AI API]
    B --> F[Google Fact Check API]
    B --> S[Chrome Storage Cache]
    B --> O[Options Page]
    O --> K[chrome.storage.local]
    K --> B

    style U fill:#1e293b,color:#f8fafc
    style B fill:#7c3aed,color:#fff
    style R fill:#ef4444,color:#fff
    style G fill:#1a73e8,color:#fff
    style F fill:#34a853,color:#fff
    style S fill:#f59e0b,color:#fff
```

### Scan Sequence — Step by Step

```mermaid
sequenceDiagram
    participant User
    participant Popup
    participant Content as Content Script
    participant BG as Background Worker
    participant RD as Reality Defender
    participant GM as Gemini AI
    participant FC as Google Fact Check

    User->>Popup: Click "Scan All Images"
    Popup->>Content: sendMessage(scanAllImages)
    Content->>BG: send image payload (src / base64)
    BG->>BG: check chrome.storage cache

    alt ✅ Cache Hit
        BG-->>Content: return cached result instantly
    else ❌ Cache Miss
        BG->>RD: POST image for AI detection
        alt RD Success
            RD-->>BG: verdict + confidence score
            BG->>GM: "explain this verdict in plain English"
            GM-->>BG: human-readable explanation
            BG->>FC: search related claims
            FC-->>BG: matching fact-checks
            BG->>BG: store result in cache
        else RD Fails (network/API)
            BG->>BG: log diagnostics
            BG->>BG: generate simulated fallback verdict
        end
    end

    BG-->>Content: full result payload
    Content-->>Popup: update UI with verdict + overlay
```

### State Machine

```mermaid
stateDiagram-v2
    [*] --> Idle : Extension loaded

    Idle --> Scanning : User clicks Scan

    Scanning --> CacheHit : Result exists in storage
    Scanning --> APIRequest : Cache miss → call RD

    CacheHit --> Display : Return immediately
    APIRequest --> Enrich : RD returns verdict
    APIRequest --> Fallback : Network / API failure

    Enrich --> Enrich : Call Gemini for explanation
    Enrich --> Enrich : Call Fact Check API
    Enrich --> Display : All data assembled

    Fallback --> Display : Simulated verdict shown

    Display --> Idle : User closes popup / dismisses

    Display --> Scanning : User rescans image
```

### Data Flow

```mermaid
flowchart TD
    IMG[Image on Page] --> CS[Content Script\nextract src / canvas base64]
    CS --> BW[Background Worker]
    BW --> CACHE{Cache\ncheck}
    CACHE -- hit --> RESULT[Result Object]
    CACHE -- miss --> RD[Reality Defender\nPOST /scan]
    RD --> VERDICT[verdict + confidence]
    VERDICT --> GEM[Gemini\ngenerate explanation]
    GEM --> EXP[Plain-English Explanation]
    EXP --> FC[Google Fact Check\nquery related claims]
    FC --> CLAIMS[Matched Claim Results]
    CLAIMS --> ASSEMBLE[Assemble Full Result]
    ASSEMBLE --> STORE[Write to chrome.storage.local]
    STORE --> RESULT
    RESULT --> UI[Popup + Overlay UI]
```

---

## 📁 Project Structure

```
pixelproof/
├── manifest.json               # MV3 manifest — permissions, bg worker, options
├── background.js               # Scan orchestration, caching, tab messaging
├── content.js                  # Image discovery, DOM overlays, per-image UI
├── styles.css                  # Shared content script styles
├── config.example.js           # Local API key template
├── .env.example                # Environment template used by the config generator
│
├── popup/
│   ├── popup.html              # Extension dashboard
│   ├── popup.js                # Scan trigger, results renderer
│   └── popup.css               # Popup styling
│
├── options/
│   ├── options.html            # API key settings page
│   └── options.js              # chrome.storage.local key management

├── panel/
│   ├── panel.html              # Slide-in analysis panel
│   ├── panel.js                # Panel interactions + share/listen actions
│   └── panel.css               # Panel layout and glassmorphism styling
│
├── utils/
│   ├── api.js                  # Reality Defender + Gemini + Fact Check wrappers
│   ├── cache.js                # Storage-backed result cache
│   └── dom.js                  # Image discovery and overlay helpers
│
├── scripts/
│   └── generate_config.js      # .env → config.js for local key injection
│
├── assets/
│   ├── dashboard-preview.svg
│   ├── overlay-preview.svg
│   └── settings-preview.svg

├── docs/
│   ├── imp.md
│   ├── master.md
│   └── prd_extracted.txt

├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png

├── DEMO_CHECKLIST.md          # Recorder-friendly demo order and notes
├── reference_repo/             # Reference structure from the starter project
├── package.json                # Minimal npm metadata for scripts
│
└── README.md                   # Project overview and setup
```

---

## 🔧 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Extension Platform | Chrome Manifest V3 | Browser-native execution |
| AI Detection | Reality Defender API | Classifies images as real/AI/manipulated |
| Explanation Engine | Google Gemini API | Human-readable verdict explanations |
| Fact Verification | Google Fact Check API | Cross-references flagged claims |
| Storage | chrome.storage.local | Local caching + key storage |
| Messaging | Chrome Extension Messaging | Popup ↔ Content ↔ Background |

---

## ⚙️ Setup & Installation

### 1. Load Extension in Chrome

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/pixelproof.git
```

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked** → select the `pixelproof/` folder
4. PixelProof icon appears in your Chrome toolbar ✅

### 2. Add API Keys

**Option A — Options Page (recommended)**
- Click the PixelProof icon → Settings
- Paste keys into the fields → Save
- Keys are stored in `chrome.storage.local` (never sent anywhere)

**Option B — Config Template**
```bash
# Copy .env.example to .env and fill in your keys
# Then generate config.js for the extension runtime
node scripts/generate_config.js
```

**Required keys:**

| Key | Where to get it |
|---|---|
| `REALITY_DEFENDER_API_KEY` | [realitydefender.com](https://www.realitydefender.com/) |
| `GEMINI_API_KEY` | [ai.google.dev](https://ai.google.dev/) |
| `FACT_CHECK_API_KEY` | [Google Cloud Console](https://console.cloud.google.com/) |

### 3. Reload & Go

Reload the extension in `chrome://extensions` after saving keys — then start scanning.

### 4. Demo Prep

- Use `DEMO_CHECKLIST.md` for the exact four-image presentation order.
- For the cleanest recording, keep the demo on a local page with controlled images.
- Use the popup last if you want to show bulk scanning after the individual badge flow.

## Repository Docs

- [Contributing](CONTRIBUTING.md) - how to open clean pull requests and keep changes focused
- [Security](SECURITY.md) - how to report issues safely and handle secrets
- [License](LICENSE) - MIT license for reuse and redistribution

---

## 🛡️ Fallback Mode

PixelProof is **demo-safe by design**. If any API key is missing or a network request fails:

- The extension logs diagnostics to the service worker console
- A **simulated verdict** is generated locally
- The UI continues working — overlays, explanations, confidence scores still display
- The presentation never breaks

**To demo fallback mode:** Open Settings, clear any API key, scan an image. PixelProof handles it gracefully.

---

## 🔒 Security

- Real API keys **never leave your machine** — stored in `chrome.storage.local` only
- `.env` and `config.js` are listed in `.gitignore`
- No key is ever bundled into the extension package or sent to any third party
- If a key is accidentally exposed, rotate it immediately at the provider

---

## 🧪 Testing Checklist

### Core Flow
- [ ] Open a news or social media page with images
- [ ] Scan a single image via the overlay button
- [ ] Scan all images via the popup — verify overlays appear
- [ ] Refresh the page — rescan to confirm cache reuse (instant result)

### Failure Paths
- [ ] Clear API keys in Settings → verify fallback mode activates
- [ ] Disconnect network → verify diagnostics appear in service worker console
- [ ] Try images from cross-origin domains → observe canvas tainting behavior

### Connectivity (PowerShell)
```powershell
Invoke-WebRequest -Uri 'https://www.google.com/generate_204' -UseBasicParsing
Invoke-WebRequest -Uri 'https://api.realitydefender.com/' -UseBasicParsing
```

---

## 🚀 What We Built During the Hackathon

- ✅ **Browser-native image scanning** — works on any page, no page modification required
- ✅ **3-API orchestration pipeline** — Reality Defender → Gemini → Fact Check, in sequence
- ✅ **Intelligent caching layer** — chrome.storage.local backed, deduplicates requests
- ✅ **Safe local key workflow** — zero risk of key exposure via `.env` + `chrome.storage.local`
- ✅ **Graceful fallback mode** — demo works even when APIs are unreachable
- ✅ **Plain-English AI explanations** — Gemini turns raw detection output into something a non-technical user can act on

---

## 💡 Why PixelProof Matters

Misinformation spreads at the speed of a scroll. By the time a fact-checker publishes a correction, millions of people have already seen the fake image and formed an opinion.

PixelProof puts the detection tool **right where the content is** — in the browser, in real time, on every page. It doesn't ask users to copy URLs into some external tool. It works where the harm is already happening.

---

## 📄 License

MIT — see [LICENSE](LICENSE)

---

<div align="center">

**Built for Next Byte Hacks V2** · Made with 🔍 and too much caffeine

*If you're seeing fake images you can't unsee — you're welcome.*

</div>

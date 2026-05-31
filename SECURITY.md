# Security Policy

[![Owner](https://img.shields.io/badge/Owner-Harsh_Bhanushali-111827?style=for-the-badge)](https://github.com/HarshBhanushali07)
[![Hackathon](https://img.shields.io/badge/Next_Byte_Hacks-V2-06b6d4?style=for-the-badge)](https://devpost.com/)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

## Supported versions
PixelProof is maintained on the `main` branch and published through the `gh-pages` demo branch.

## Reporting a vulnerability
If you find a security issue, do not open a public issue with exploit details.

Please report it privately by:
- Opening a minimal, non-sensitive issue description
- Or contacting the repository maintainer directly

Primary contact: [harsh@dualmindlab.tech](mailto:harsh@dualmindlab.tech)
Backup contact: [harshu.dev@outlook.com](mailto:harshu.dev@outlook.com)

Include:
- What file or feature is affected
- Steps to reproduce the issue
- Why it matters
- Any screenshots or logs that do not expose secrets

## Project stance
PixelProof stores API keys locally and is designed to avoid secret exposure in the repo. If a report involves a secret, treat it as urgent and rotate it immediately.

The project is currently demo-only and is distributed as an unpacked extension rather than a public release.

## Sensitive data
- Never commit API keys, tokens, or `.env` files
- Keep generated `config.js` local only
- If a secret is exposed, rotate it immediately

## What to avoid in reports
- Full credentials
- Live tokens
- Private keys
- Personal data
- Complete exploit payloads that could be reused without authorization

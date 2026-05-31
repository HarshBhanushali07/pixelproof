# Security Policy

## Supported versions
PixelProof is maintained on the `main` branch.

## Reporting a vulnerability
If you find a security issue, do not open a public issue with exploit details.

Please report it privately by:
- Opening a minimal, non-sensitive issue description
- Or contacting the repository maintainer directly

Include:
- What file or feature is affected
- Steps to reproduce the issue
- Why it matters
- Any screenshots or logs that do not expose secrets

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

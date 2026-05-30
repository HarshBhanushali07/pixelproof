#!/usr/bin/env node
// generate_config.js
// Reads .env in the repo root and writes a config.js ES module with exported CONFIG.

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const envPath = path.join(repoRoot, '.env');
const outPath = path.join(repoRoot, 'config.js');

function parseEnv(content) {
  const lines = content.split(/\r?\n/);
  const env = {};
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

if (!fs.existsSync(envPath)) {
  console.error('.env not found. Copy .env.example to .env and fill keys.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = parseEnv(envContent);

const cfg = {
  REALITY_DEFENDER_API_KEY: env.REALITY_DEFENDER_API_KEY || 'your_reality_defender_key_here',
  GEMINI_API_KEY: env.GEMINI_API_KEY || 'your_gemini_key_here',
  FACT_CHECK_API_KEY: env.FACT_CHECK_API_KEY || 'your_google_api_key_here'
};

const fileContent = `export const CONFIG = ${JSON.stringify(cfg, null, 2)};\n`;

fs.writeFileSync(outPath, fileContent, 'utf8');
console.log('Wrote', outPath);

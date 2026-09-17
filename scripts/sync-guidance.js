#!/usr/bin/env node
'use strict';

// Host-specific rule wrappers, generated from the one organization-neutral loader.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const guidance = fs.readFileSync(path.join(root, 'VENOM.md'), 'utf8');
const outputs = {
  'platforms/cursor/venom.mdc': '---\nalwaysApply: true\n---\n\n' + guidance,
  'platforms/kiro/venom.md': '---\ninclusion: always\n---\n\n' + guidance,
  'platforms/copilot/copilot-instructions.md': guidance,
  'platforms/cline/venom.md': guidance,
  'platforms/windsurf/venom.md': '---\ntrigger: always_on\n---\n\n' + guidance,
};
for (const [file, content] of Object.entries(outputs)) {
  if (process.argv.includes('--check')) {
    if (fs.readFileSync(path.join(root, file), 'utf8') !== content) {
      throw new Error(`${file} is stale; run npm run sync:guidance`);
    }
  } else {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), content);
  }
}

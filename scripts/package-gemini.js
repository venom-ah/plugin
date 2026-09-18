#!/usr/bin/env node
'use strict';

// Gemini auto-discovers hooks/hooks.json with its own schema.
// Package separately from the explicitly registered Claude/Codex hooks.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const destination = path.resolve(process.argv[2] || path.join(root, 'dist', 'gemini', 'venom'));
fs.mkdirSync(path.join(destination, 'hooks'), { recursive: true });
for (const [source, target] of [
  ['platforms/gemini/gemini-extension.json', 'gemini-extension.json'],
  ['VENOM.md', 'VENOM.md'],
  ['hooks/venom-context.js', 'hooks/venom-context.js'],
]) fs.copyFileSync(path.join(root, source), path.join(destination, target));
const hooks = {};
for (const event of ['SessionStart', 'BeforeAgent', 'AfterAgent']) {
  hooks[event] = [{ hooks: [{
    type: 'command',
    name: `venom-${event}`,
    command: `node "\${extensionPath}/hooks/venom-context.js" ${event} gemini`,
    timeout: 5000,
  }] }];
}
fs.writeFileSync(path.join(destination, 'hooks', 'hooks.json'), JSON.stringify({ hooks }, null, 2) + '\n');
process.stdout.write(destination + '\n');

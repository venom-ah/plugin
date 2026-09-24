#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const event = process.argv[2];
const fullEvents = ['SessionStart', 'SubagentStart'];
const fallback = 'Read relevant shared context using the organization’s session-start skill through the host-managed connection. Save only meaningful new human intent or handoff context; skip unchanged or code-recoverable detail and verify saves. Respect disabled skills, denied approvals, and disabled connections.';

process.stdout.on('error', (error) => {
  if (error.code === 'EPIPE') process.exit(0);
  throw error;
});

if (fullEvents.includes(event)) {
  let context = fallback;
  try { context = fs.readFileSync(path.join(__dirname, '..', 'VENOM.md'), 'utf8').trim() || fallback; }
  catch { /* Retain startup guidance when the instruction file is unavailable. */ }
  const hookSpecificOutput = { additionalContext: context };
  // Gemini only documents additionalContext, without the Claude/Codex event discriminator.
  if (process.argv[3] !== 'gemini') hookSpecificOutput.hookEventName = event;
  process.stdout.write(JSON.stringify({ hookSpecificOutput }));
}

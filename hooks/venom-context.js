#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const event = process.argv[2];
const fullEvents = ['SessionStart', 'SubagentStart'];
const turnEvents = ['UserPromptSubmit', 'BeforeAgent'];

if (fullEvents.includes(event) || turnEvents.includes(event)) {
  const context = fullEvents.includes(event)
    ? fs.readFileSync(path.join(__dirname, '..', 'VENOM.md'), 'utf8').trim()
    : 'Apply the current organization’s Venom session-start skill. If it is missing from context, load it through the host-managed Venom connection before substantive work. Respect disabled skills and denied approvals.';
  const hookSpecificOutput = { additionalContext: context };
  // Gemini only documents additionalContext, without the Claude/Codex event discriminator.
  if (process.argv[3] !== 'gemini') hookSpecificOutput.hookEventName = event;
  process.stdout.write(JSON.stringify({ hookSpecificOutput }));
}

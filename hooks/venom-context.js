#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const event = process.argv[2];
const fullEvents = ['SessionStart', 'SubagentStart'];
const turnEvents = ['UserPromptSubmit', 'BeforeAgent'];
const completionEvents = ['Stop', 'SubagentStop', 'AfterAgent'];
const saveReminder = 'Venom checkpoint: apply the current organization’s session-start skill (load it through the host-managed Venom connection if missing). Save useful changed outcomes, current status, decisions, evidence, blockers, and next actions in the existing record; verify the save. Skip unchanged or already-saved information. Never mark unfinished work complete. Respect user instructions, disabled skills/connections, and denied approvals. If saving is unavailable or fails, report that Venom was not updated and hand off the unsaved status. Subagents without write access return findings to their parent for consolidation.';
const turnReminder = 'Apply the current organization’s Venom session-start skill; load it through the host-managed connection if missing. Read saved status before work. Save useful progress at milestones, task status changes, and before completion or handoff; verify saves. Respect disabled skills/connections and denied approvals. Report unsaved status if Venom cannot be updated.';

process.stdout.on('error', (error) => {
  if (error.code === 'EPIPE') process.exit(0);
  throw error;
});

if (completionEvents.includes(event)) {
  // ponytail: one reminder pass, not a persistence guarantee; use backend receipts
  // if hard enforcement is needed. Never loop when a save is denied or unavailable.
  let input = '';
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    let payload;
    try { payload = JSON.parse(input.replace(/^\uFEFF/, '')); } catch { return; }
    if (payload?.stop_hook_active !== false) return;
    process.stdout.write(JSON.stringify({
      decision: process.argv[3] === 'gemini' ? 'deny' : 'block',
      reason: saveReminder + ' Complete this checkpoint now, then finish; do not repeat already completed work.',
    }));
  };
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    input += chunk;
    if (input.length > 1024 * 1024) process.exit(0);
  });
  process.stdin.on('end', finish);
  process.stdin.on('error', () => { finish(); process.exit(0); });
  // Recover complete input even when a shell wrapper leaves stdin open, as
  // Ponytail does. Missing/partial input still cannot trigger a continuation.
  setTimeout(() => { finish(); process.exit(0); }, 1000).unref();
} else if (fullEvents.includes(event) || turnEvents.includes(event) || event === 'PostToolUse') {
  let context = event === 'PostToolUse' ? saveReminder : turnReminder;
  if (fullEvents.includes(event)) {
    try { context = fs.readFileSync(path.join(__dirname, '..', 'VENOM.md'), 'utf8').trim() || turnReminder; }
    catch { /* Retain the bundled loader reminder if the instruction file is unavailable. */ }
  }
  const hookSpecificOutput = { additionalContext: context };
  // Gemini only documents additionalContext, without the Claude/Codex event discriminator.
  if (process.argv[3] !== 'gemini') hookSpecificOutput.hookEventName = event;
  process.stdout.write(JSON.stringify({ hookSpecificOutput }));
}

#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const event = process.argv[2];
const fullEvents = ['SessionStart', 'SubagentStart'];
const turnEvents = ['UserPromptSubmit', 'BeforeAgent'];
const saveReminder = 'Venom checkpoint: apply the current organization’s session-start skill (load it through the host-managed Venom connection if missing). Before the final answer or handoff, save useful changed outcomes, current status, decisions, evidence, blockers, and next actions in the existing record; verify the save. Avoid routine save narration. Skip unchanged or already-saved information. Never mark unfinished work complete. Respect user instructions, disabled skills/connections, and denied approvals. If saving is unavailable or fails, report that Venom was not updated and hand off the unsaved status. Subagents without write access return findings to their parent for consolidation.';
const turnReminder = 'Apply the current organization’s Venom session-start skill; load it through the host-managed connection if missing. Read saved status before work. Save useful progress at milestones and before the final answer or handoff; verify saves. Skip unchanged information and routine save narration. Respect disabled skills/connections and denied approvals. Report unsaved status if Venom cannot be updated.';

process.stdout.on('error', (error) => {
  if (error.code === 'EPIPE') process.exit(0);
  throw error;
});

if (fullEvents.includes(event) || turnEvents.includes(event) || event === 'PostToolUse') {
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

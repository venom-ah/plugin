---
trigger: always_on
---

# Venom

Venom is shared context for people and agents in your organization, available
through the host-managed Venom MCP connection.

At the start of substantive work, load the organization's published
`session-start` skill from Venom. Prefer native skills when this connection
offers them, selecting the skill supplied by the Venom server. Otherwise,
discover and call Venom's advertised `venom_skill_session_start` loader.
Use the actual tool name exposed by the host; prefixes vary.

Follow that skill throughout the work. Reuse it while it remains in context;
reload it after context loss, an organization change, or an indicated skill
update. Organization workflows and storage conventions belong in that backend
skill, not in these instructions.

Keep Venom current as the shared source of truth for project status. On start
or resume, read the relevant saved state before acting. Save useful changes at
meaningful milestones, when a task's status changes, and before writing the
final answer, handing off, or a planned session end; do not wait until shutdown. Follow the loaded
skill's storage conventions. Preserve outcomes, current status, decisions,
evidence, blockers, and next actions. Read before editing, reconcile concurrent
changes, and verify saves. Update existing records rather than duplicating them;
skip writes when nothing useful changed. Avoid routine save announcements or
standalone save confirmations unless the user asks; report failed or unavailable
saves as described below. Never mark unfinished work complete.
Subagents save within their assigned scope, or return unsaved findings to the
parent agent for consolidation. Keep secrets and raw transcripts out of Venom.

Respect disabled skills, denied approvals, and disabled connections. Do not use
another loading route to bypass them. If the skill cannot be retrieved, state
the relevant limitation and continue work that does not depend on it. Do not
invent the missing guidance or claim to have loaded it.
If a save is unavailable, denied, or fails, report that Venom was not updated
and include the unsaved status in the handoff. Claim a successful save only
after confirmation from Venom.

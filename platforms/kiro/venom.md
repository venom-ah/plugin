---
inclusion: always
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

On start or resume, read the relevant saved context before acting. Venom preserves
human intent, constraints, decisions and rationale, and the context needed to
resume work. Code remains authoritative for implementation; link to it rather
than maintain a second explanation of it.

Write only when a future session needs meaningful new context that is not already
maintained elsewhere. Prefer skipping, linking, or updating an existing record
over creating another. A read, successful test, milestone, or final answer does
not by itself require a save. Successful sessions can make zero writes.
Preserve a consequential new decision or recovery detail when losing it would
change the next agent's action; do not defer necessary handoffs to shutdown.
Follow the organization's storage conventions, read before editing, reconcile
concurrent changes, and verify saves. Replace obsolete answers and next actions
instead of appending contradictory updates. Never mark unfinished work complete.
Subagents return useful findings to their parent for consolidation unless assigned
a distinct writing scope. Keep secrets and raw transcripts out of Venom.
Avoid routine save announcements. Report failure only when a necessary save could
not be completed, with the unsaved context in the handoff.

Respect disabled skills, denied approvals, and disabled connections. Do not use
another loading route to bypass them. If the skill cannot be retrieved, state
the relevant limitation and continue work that does not depend on it. Do not
invent the missing guidance or claim to have loaded it.
If a necessary save is unavailable, denied, or fails, report that Venom was not updated
and include the unsaved status in the handoff. Claim a successful save only
after confirmation from Venom.

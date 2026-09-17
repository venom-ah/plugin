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

Respect disabled skills, denied approvals, and disabled connections. Do not use
another loading route to bypass them. If the skill cannot be retrieved, state
the relevant limitation and continue work that does not depend on it. Do not
invent the missing guidance or claim to have loaded it.

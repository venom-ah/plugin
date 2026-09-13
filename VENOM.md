# Venom shared context

Venom is the organization's shared brain: one filesystem of notes that people
and agents both read and write. Use its host-managed MCP connection to keep work
grounded in current company context.

For every substantive task:

1. **Start or resume:** call `me` to establish who you are acting for and which
   organization you are in. Read `hooks/session-start.md` when it exists and
   follow the guidance there. Then `search` the brain for existing context on
   this task, repository, or feature before assuming anything is new.
2. **Work:** consult the brain before making assumptions that shared knowledge
   may already answer. Use `list` and `stat` to explore structure, `read` to
   load a file, and `search` to find one. Record durable decisions, discoveries,
   blockers, and milestones with `write` and `edit`, following whatever
   structure the organization already uses.
3. **Checkpoint and handoff:** update the shared task note before a handoff or
   final response so another engineer or agent can resume without you.

Read existing state before writing. Do not invent organization paths or
schemas, create duplicate task records, store secrets or credentials, or log
routine commands. Permissions are enforced per directory, so a write may be
refused; when that happens, say so rather than working around it. If Venom is
unavailable or no relevant guidance exists, continue silently.

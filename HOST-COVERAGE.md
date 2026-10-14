# Host coverage — 24 September 2026

The design has two parts: authenticated MCP provides the organization's
published `session-start` skill; a small host reminder directs the model to
load it and preserve only necessary context. Native skill loading is preferred when offered by the host. Otherwise
the server's advertised `venom_skill_session_start` tool loads the same content.
Tool prefixes are discovered, not guessed. A disabled or rejected native skill
must not be accessed through the fallback to bypass the user's choice.

The table describes implemented delivery, not a ranking or an assertion that
every agent behaves identically. All adapters use the development endpoint.

| Host | Implemented delivery | Limit that remains |
| --- | --- | --- |
| Codex | Plugin MCP; `SessionStart`, `SubagentStart` | Hooks must be enabled and trusted; Node must be available. SessionStart covers context restoration supported by the host. No per-prompt, tool, or completion save reminders. [Official hooks reference](https://learn.chatgpt.com/docs/hooks) |
| Claude Code | Plugin MCP and the same two hook events | Hook trust and tool approvals remain host-owned; `SessionStart` runs after compaction. No Stop/SubagentStop continuation is installed. [Official hooks reference](https://code.claude.com/docs/en/hooks) |
| Gemini CLI | Separate extension bundle with `contextFileName: VENOM.md`, `SessionStart` | Persistent context and SessionStart provide the entry point. No AfterAgent continuation is installed; timeouts are milliseconds. [Extension reference](https://geminicli.com/docs/extensions/reference/), [hook reference](https://geminicli.com/docs/hooks/reference/) |
| Cursor Agent | HTTP MCP plus an always-applied `.mdc` rule | Rules apply to Agent conversations; this does not configure inline completion or Bugbot. [MCP](https://docs.cursor.com/context/model-context-protocol), [rules](https://prod.cursor.com/docs/rules) |
| Kiro IDE / CLI | MCP plus always-included steering | Custom agents require the steering resource in their configuration; no claim of a universal session event across Kiro surfaces. [MCP](https://kiro.dev/docs/mcp/), [steering](https://kiro.dev/docs/steering/) |
| OpenCode | Remote MCP plus `instructions: ["VENOM.md"]` | Merge with existing instructions. Host manages remote OAuth. [MCP](https://opencode.ai/docs/mcp-servers/), [rules](https://opencode.ai/docs/rules/) |
| Copilot CLI | HTTP MCP plus persistent Copilot instructions | Command-hook output at userPromptSubmitted is discarded, so no fake prompt reminder is installed. [MCP setup](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers), [instructions](https://docs.github.com/en/copilot/concepts/agents/copilot-cli/comparing-cli-features), [hooks](https://docs.github.com/en/copilot/reference/hooks-reference) |
| VS Code Copilot Agent | VS Code's `servers` MCP schema plus repository instructions | Server/organization trust and authentication must be completed in VS Code. [MCP setup](https://code.visualstudio.com/docs/agent-customization/mcp-servers), [custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions) |
| Cline | Explicit `streamableHttp` MCP plus enabled `.clinerules` file | Connection and rule must be enabled; actual OAuth with Venom needs a host trial. Omitting transport can select legacy SSE. [MCP](https://docs.cline.bot/mcp/mcp-overview), [rules](https://docs.cline.bot/customization/cline-rules) |
| Windsurf / Devin Desktop legacy Cascade | Remote MCP plus `trigger: always_on` rule | Current docs distinguish Cascade from the new default Local agent. [Cascade MCP](https://docs.devin.ai/desktop/cascade/mcp), [rules](https://docs.devin.ai/desktop/cascade/memories) |
| Devin CLI / Desktop Local | Dedicated `mcp_config.json` plus AGENTS.md loader instruction | Dedicated MCP file applies to v3000.3+; authenticate this client separately. [MCP configuration](https://docs.devin.ai/cli/extensibility/mcp/configuration), [AGENTS.md](https://docs.devin.ai/onboard-devin/agents-md) |

Kiro's current MCP documentation disallows hyphens in tool names. The fallback
uses underscores while the actual skill keeps its name `session-start`.
Long fallback tool names are capped at 52 characters to leave room for the
bundled connection's host prefix. They retain a readable prefix and use a
double underscore plus a stable digest; agents must use the advertised tool
name. Resolution uses the caller's current organization catalog, and disabled
or withdrawn skills remain unavailable. Renaming the MCP connection to a longer
server name can exceed a host's limit despite this reserved space.
The old Kiro hook template used the legacy format; steering now provides the
entry point on both IDE and CLI without creating an extra agent turn.
Current Kiro hooks have a different schema and surface-specific triggers.
[Tool-name requirements](https://kiro.dev/docs/mcp/#tool-validation-errors),
[current hook schema](https://kiro.dev/docs/hooks/).

Claude and Codex explicitly register `hooks/claude-codex-hooks.json` in their
manifests, following Ponytail. There is no root `hooks/hooks.json`, avoiding
duplicate auto-discovery. Gemini's separate package generates that default file
with its own events, path variable, and millisecond timeouts. All three use the
same reminder script. No runtime dependency or authentication client is added.

## Selective persistence

Only `SessionStart` and `SubagentStart` inject guidance. Gemini uses SessionStart
and its persistent context file. Per-prompt and task-tool hooks are removed;
stale prompt, tool, and completion invocations produce no output. Version 0.3.3
already removed forced completion turns; this change removes the remaining
repeated write reminders. Restart updated hosts to unload cached registrations.

`VENOM.md` is canonical; persistent adapters are generated from it. The guidance
prioritizes reading, allows zero-write sessions, and saves only useful context
that is not already maintained elsewhere. Consequential decisions and recovery
context should be saved when losing them would change the next action. Subagents
return findings to the parent unless assigned a distinct write scope.

Hooks neither fetch skills nor write notes. The agent uses its authenticated
connection; user instructions, disabled skills and denied approvals remain
binding. Necessary failed saves must be reported. Startup guidance cannot
ensure persistence during abrupt termination; no shutdown or background writer
is installed.

Claude and Codex resolve the plugin-root placeholder for the plain `node`
command. The shared file contains no host-specific `commandWindows` field or
POSIX conditionals, matching Ponytail's portable hook commands. Missing Node
produces a nonblocking hook error; server startup
instructions remain available when the host delivers them.
[Claude command execution](https://code.claude.com/docs/en/hooks#exec-form-and-shell-form).

## Verification and release gate

Local checks exercise startup JSON, silent prompt/tool/completion events, open
stdin, missing-instruction fallback, closed pipes, shell quoting, Gemini package
isolation, adapter configuration, and canonical rule synchronization. Tests do
not launch authenticated agent turns. The Windows execution check is skipped on
macOS; CI covers Windows separately.

Before claiming verified host behavior, run an authenticated trial: load the
organization skill, resume after context loss, confirm trivial work creates no
note, and preserve a consequential decision for a fresh session. Check that
subagents do not duplicate parent notes and that disabled skills are respected.
Record the host version and native or fallback skill-loading route.

Hosts without a demonstrated host-managed OAuth connection are not presented
as authenticated integrations merely because their settings accept a URL.
The server remains organization-scoped; no template embeds credentials or
opens anonymous access.

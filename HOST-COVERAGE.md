# Host coverage — 18 September 2026

The design has two parts: authenticated MCP provides the organization's
published `session-start` skill; a small host reminder directs the model to
load it and save useful progress. Native skill loading is preferred when offered by the host. Otherwise
the server's advertised `venom_skill_session_start` tool loads the same content.
Tool prefixes are discovered, not guessed. A disabled or rejected native skill
must not be accessed through the fallback to bypass the user's choice.

The table describes implemented delivery, not a ranking or an assertion that
every agent behaves identically. All adapters use the development endpoint.

| Host | Implemented delivery | Limit that remains |
| --- | --- | --- |
| Codex | Plugin MCP; `SessionStart`, `SubagentStart`, `UserPromptSubmit`; task-status `PostToolUse`; guarded `Stop` and `SubagentStop` | Hooks must be enabled and trusted; Node must be available. SessionStart covers context restoration supported by the host. One completion pass is a reminder, not proof of persistence. [Official hooks reference](https://learn.chatgpt.com/docs/hooks) |
| Claude Code | Plugin MCP and the same six hook events | Hook trust and tool approvals remain host-owned; `SessionStart` runs after compaction. Completion continuation respects `stop_hook_active`. [Official hooks reference](https://code.claude.com/docs/en/hooks) |
| Gemini CLI | Separate extension bundle with `contextFileName: VENOM.md`, `SessionStart`, `BeforeAgent`, guarded `AfterAgent` | Persistent context and the next BeforeAgent reminder restore the entry point. AfterAgent uses `decision: deny` and `stop_hook_active`; timeouts are milliseconds. [Extension reference](https://geminicli.com/docs/extensions/reference/), [hook reference](https://geminicli.com/docs/hooks/reference/) |
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

Gemini and Claude both auto-load `hooks/hooks.json`, but their supported events,
path variables, and timeout units differ. Sharing that physical package
silently breaks one host. The Gemini packaging script copies the one loader
and its script into an isolated directory and writes only Gemini hook entries.
It adds no runtime dependency or authentication client.

## Lifecycle findings and changes

The installed Ponytail 4.10.0 reference uses `SessionStart`, `SubagentStart`,
and `UserPromptSubmit` in `hooks/claude-codex-hooks.json`. Venom already matched
those events. Ponytail is a useful instruction-persistence reference, but that
event set alone does not deliver a completion-time save reminder.

Venom now reminds the agent to read saved status on startup, checkpoint useful
changes at milestones and task-status changes, and verify saves before completion
or handoff. All persistent host rule files are generated from `VENOM.md`.
The organization's published skill still determines where and how to store it.

`PostToolUse` matches only `TaskUpdate`, `TodoWrite`, `update_plan`, and
`update_goal`. It reminds the agent to reconcile useful changed status after a
task/plan update, without blocking the tool or treating its result as proof of
completion. Venom writes do not match, so saving cannot trigger another save
reminder. Other milestones rely on the persistent and per-prompt instructions.
Claude's dedicated `TaskCompleted` event is not shared with Codex and does not
have the stop retry guard; the common task-tool and completion hooks cover this
workflow without an unbounded task-completion gate.

`Stop` and `SubagentStop` return `decision: block` with a save/verify reminder
only when the host supplies `stop_hook_active: false`. Gemini `AfterAgent` uses
`decision: deny` for its equivalent retry. Already-active, missing, malformed,
or oversized inputs allow completion; open stdin is bounded to one second.
There is no transcript scraping or persistent local completion flag. This adds
one follow-up model pass even if everything was already saved; the reminder
explicitly skips unchanged information. A continuation already triggered by
another hook also suppresses this final reminder; the earlier reminders remain.

`SessionEnd` cannot steer the departing agent in Codex, Claude, or Gemini.
Codex also does not support MCP-tool hooks at SessionEnd. An extra shutdown
hook printing a save instruction would provide false coverage, so saves happen
before completion and planned shutdown. Abrupt termination, interruptions, and
API failures can still lose progress since the last checkpoint. Pre-compaction
events are not a portable opportunity for another agent tool pass; the startup
restoration and prompt reminders reload the skill after context loss.

Hooks do not fetch the skill or write data themselves: the model uses its
host-authenticated connection. Disabled skills/connections, denied approvals,
and user instructions remain authoritative. On failed or unavailable saves the
agent must report unsaved status, never claim success, and hand it off. Subagents
without write access return findings to their parent. Hosts with only rules
receive the same save instructions but have no installed completion hook.

This provides repeated reminders, not guaranteed continuous synchronization or
proof that the latest status was saved. A stronger guarantee would require
backend write receipts and host-specific enforcement, plus a recovery path for
interrupted work. No such guarantee is claimed by this plugin.

Claude substitutes the plugin-root placeholder before running the simple
`node` command, including in PowerShell when Git Bash is absent. Codex uses
its `commandWindows` override on Windows. Neither command requires POSIX
conditionals. Missing Node produces a nonblocking hook error; server startup
instructions remain available when the host delivers them.
[Claude command execution](https://code.claude.com/docs/en/hooks#exec-form-and-shell-form).

## Verification and release gate

Local checks exercise emitted JSON, prompt vs startup output, completion/retry
guards, malformed/oversized/open input, task-tool matching, unknown-event silence,
POSIX shell quoting (including spaces in installation paths), missing Node errors,
Gemini package isolation, and canonical rule synchronization.
Configuration checks cover each adapter's transport and instruction entry.
The OpenCode top-level field check follows its strict
[official schema](https://opencode.ai/config.json), verified on 17 September 2026,
and runs offline; `_comment` is not an allowed configuration field.
These checks do not launch authenticated instances of these hosts. Windows
commands are inspected but have not been executed in PowerShell here.

Before claiming verified support for a host release, run a disposable
organization trial: connect and authorize; start a substantive task; observe
one successful session-start skill load from Venom; issue a second prompt and
confirm reuse; restore or compact context and confirm reload when needed;
start and finish a subagent where supported; change the organization's published skill
and confirm the next fresh session receives it; disable the skill or deny
approval and confirm no fallback bypass. Complete a task/plan step and observe
the checkpoint reminder; finish the turn and observe at most one Venom completion
pass; verify the stored status from a fresh session. Repeat with Venom unavailable
and ensure the agent reports unsaved status and stops without a loop. Finally perform a shared-note edit
and verify that the backend rejects a stale replacement. Record host version
and whether native skills or the fallback tool were used.

Hosts without a demonstrated host-managed OAuth connection are not presented
as authenticated integrations merely because their settings accept a URL.
The server remains organization-scoped; no template embeds credentials or
opens anonymous access.
